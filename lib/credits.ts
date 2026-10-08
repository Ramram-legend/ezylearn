import { SupabaseClient } from '@supabase/supabase-js';
import { getDailyLimit } from '@/lib/plans';
import type { Plan } from '@/types/database';

export const MAX_ADS_PER_DAY = 5;
export const CREDITS_PER_AD = 1;

export async function checkGenerationRights(supabase: SupabaseClient, userId: string) {
  // 1. Check Plan
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, age_group')
    .eq('id', userId)
    .single();

  if (!profile) return { allowed: false, reason: 'profile_not_found', isPremium: false };

  const isPremium = ['plus', 'famille', 'etablissement'].includes(profile.plan);
  if (isPremium) {
    return { allowed: true, reason: 'premium', isPremium, freeQuotaLeft: 0, bonusCredits: 0 };
  }

  // 2. Check Daily Quota (limite unique definie dans lib/plans.ts)
  const dailyLimit = getDailyLimit(profile.plan as Plan) ?? 0;
  const today = new Date().toISOString().split('T')[0];
  const { data: usage } = await supabase
    .from('user_daily_usage')
    .select('lessons_generated')
    .eq('user_id', userId)
    .eq('usage_date', today)
    .maybeSingle();

  const lessonsGenerated = usage?.lessons_generated || 0;
  const freeQuotaLeft = Math.max(0, dailyLimit - lessonsGenerated);

  // 3. Check Bonus Credits
  const { data: credits } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle();

  const bonusCredits = credits?.balance || 0;

  let allowed = false;
  let reason = 'empty';

  if (freeQuotaLeft > 0) {
    allowed = true;
    reason = 'quota';
  } else if (bonusCredits > 0) {
    allowed = true;
    reason = 'bonus';
  }

  return { allowed, reason, isPremium, freeQuotaLeft, bonusCredits, ageGroup: profile.age_group };
}

export async function consumeGenerationCredit(supabase: SupabaseClient, userId: string) {
  const status = await checkGenerationRights(supabase, userId);
  
  if (!status.allowed) {
    throw new Error('No generation rights left. Please upgrade or watch an ad.');
  }

  // Premium users don't consume anything
  if (status.reason === 'premium') return;

  // If using a bonus credit, decrement it securely
  if (status.reason === 'bonus') {
    const { data: success, error } = await supabase.rpc('decrement_bonus_credit', { user_id_param: userId });
    if (error || !success) {
      throw new Error('Failed to decrement bonus credit.');
    }
  }

  // Track daily usage for all non-premium users
  await supabase.rpc('increment_daily_usage', { user_id_param: userId });
}

export async function createAdTicket(supabase: SupabaseClient, userId: string) {
  const { data: profile } = await supabase.from('profiles').select('age_group').eq('id', userId).single();
  
  if (!profile || profile.age_group === 'enfant') {
    throw new Error('Les comptes enfants ne sont pas autorisés à visionner des publicités.');
  }

  // Check daily limit
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('ad_credit_grants')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('status', 'claimed')
    .gte('claimed_at', todayStart.toISOString());

  if (count && count >= MAX_ADS_PER_DAY) {
    throw new Error('Plafond publicitaire quotidien atteint.');
  }

  // Create ticket valid for 5 minutes
  const { data: ticket, error } = await supabase
    .from('ad_credit_grants')
    .insert({
      user_id: userId,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) throw new Error('Impossible de générer le ticket publicitaire.');
  return ticket.id;
}

export async function claimAdTicket(supabase: SupabaseClient, userId: string, ticketId: string) {
  // Find ticket
  const { data: ticket } = await supabase
    .from('ad_credit_grants')
    .select('*')
    .eq('id', ticketId)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .single();

  if (!ticket) {
    throw new Error('Ticket invalide ou déjà réclamé.');
  }

  if (new Date(ticket.expires_at) < new Date()) {
    await supabase.from('ad_credit_grants').update({ status: 'expired' }).eq('id', ticketId);
    throw new Error('Le ticket publicitaire a expiré.');
  }

  // Update ticket status
  const { error: updateError } = await supabase
    .from('ad_credit_grants')
    .update({ status: 'claimed', claimed_at: new Date().toISOString() })
    .eq('id', ticketId);

  if (updateError) throw new Error('Erreur lors de la validation du ticket.');

  const { error: creditError } = await supabase.rpc('increment_bonus_credit', {
    user_id_param: userId,
    amount: CREDITS_PER_AD,
  });

  if (creditError) {
    throw new Error('Erreur lors de l\'attribution du crédit.');
  }
}

export async function startAdWatchSession(supabase: SupabaseClient, userId: string) {
  const { data: profile } = await supabase.from('profiles').select('age_group').eq('id', userId).single();
  
  if (!profile || profile.age_group === 'enfant') {
    throw new Error('Les comptes enfants ne sont pas autorisés à visionner des publicités.');
  }

  // Check daily limit (max 5 claimed per day)
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  try {
    const { count } = await supabase
      .from('ad_watch_sessions')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('used', true)
      .gte('completed_at', todayStart.toISOString());

    if (count && count >= MAX_ADS_PER_DAY) {
      throw new Error('Plafond publicitaire quotidien atteint (5/5).');
    }

    // Create session in DB
    const { data: session, error } = await supabase
      .from('ad_watch_sessions')
      .insert({
        user_id: userId,
        started_at: new Date().toISOString(),
        used: false,
      })
      .select('id')
      .single();

    if (!error && session) {
      return session.id;
    }
    
    throw new Error('Erreur lors de la création de la session de visionnage.');
  } catch (err: any) {
    if (err.message && err.message.includes('Plafond')) throw err;
    console.warn('Erreur startAdWatchSession:', err);
    throw new Error('Impossible de démarrer la session. Veuillez réessayer.');
  }
}

export async function completeAdWatchSession(supabase: SupabaseClient, userId: string, sessionId: string) {
  // 1. Attempt atomic update and select the result
  const { data: updatedSessions, error: updateError } = await supabase
    .from('ad_watch_sessions')
    .update({ used: true, completed_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', userId)
    .eq('used', false)
    .select();

  if (updateError || !updatedSessions || updatedSessions.length === 0) {
    throw new Error('Impossible de valider la session de visionnage.');
  }

  const session = updatedSessions[0];

  // 2. Vérification anti-triche : contrôle du temps écoulé
  const startTime = new Date(session.started_at).getTime();
  const elapsedSeconds = (Date.now() - startTime) / 1000;

  if (elapsedSeconds < 18) {
    throw new Error('Temps de visionnage insuffisant. Veuillez patienter la durée requise.');
  }

  // 3. Attribuer le crédit bonus
  const { error: creditError } = await supabase.rpc('increment_bonus_credit', { user_id_param: userId, amount: CREDITS_PER_AD });

  if (creditError) {
    console.error('Erreur attribution credit RPC:', creditError);
    throw new Error("Erreur lors de l'attribution du crédit. Contactez le support si le problème persiste.");
  }
}


