import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContext, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { generateLessonContent } from '@/lib/ai';
import { checkGenerationRights, consumeGenerationCredit } from '@/lib/credits';
import type { PublicQuizQuestion } from '@/types/database';
import { createAdminClient } from '@/lib/supabase/admin';

/** Limite de leçons gratuites par jour pour les invités (non connectés) */
const GUEST_DAILY_LIMIT = 3;

const guestRateLimitMap = new Map<string, { count: number; date: string }>();

/**
 * Vérifie et incrémente le compteur invité via IP et cookie.
 * Retourne { allowed: boolean, remaining: number }.
 */
async function checkGuestRateLimit(request: Request): Promise<{ allowed: boolean; remaining: number; cookieValue: string }> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const forwardedIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = request.headers.get('x-real-ip') || forwardedIp || 'unknown';

  let ipCount = 0;
  const ipData = guestRateLimitMap.get(ip);
  if (ipData && ipData.date === today) {
    ipCount = ipData.count;
  } else {
    guestRateLimitMap.set(ip, { count: 0, date: today });
  }

  const raw = request.headers.get('cookie')
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('guest_rl='))
    ?.slice('guest_rl='.length);
  let cookieCount = 0;

  if (raw) {
    try {
      const parsed = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'));
      if (parsed.date === today) {
        cookieCount = parsed.count ?? 0;
      }
    } catch {
      // Cookie corrompu → réinitialiser
    }
  }

  const count = Math.max(ipCount, cookieCount);
  const allowed = count < GUEST_DAILY_LIMIT;
  const newCount = allowed ? count + 1 : count;

  if (allowed) {
    guestRateLimitMap.set(ip, { count: newCount, date: today });
  }

  const cookieValue = Buffer.from(JSON.stringify({ date: today, count: newCount })).toString('base64');
  return { allowed, remaining: Math.max(0, GUEST_DAILY_LIMIT - newCount), cookieValue };
}

function withGuestRateLimitCookie(response: NextResponse, cookieValue?: string) {
  if (cookieValue) {
    response.cookies.set('guest_rl', cookieValue, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 86400,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    });
  }
  return response;
}

export const maxDuration = 60; // Allow up to 60 seconds for DeepSeek API generation

const generateSchema = z.object({
  topic: z.string().trim().min(2, 'Le sujet de la lecon est requis.').max(200),
  subject: z.string().trim().max(60).optional(),
  level: z.string().trim().max(30).optional(),
  age: z.number().int().optional(),
  interests: z.array(z.string()).optional(),
  language: z.enum(['fr', 'en', 'ar']).optional(),
});

/**
 * POST /api/lessons/generate
 * Genere une nouvelle lecon (SVG anime + explication + fun fact + quiz)
 * personnalisee selon le profil de l'utilisateur, via l'API Gemini.
 * Body : { topic: string, subject?: string, level?: string, age?: number, interests?: string[] }
 *
 * Applique la limite quotidienne de generations du plan "gratuit" (5/jour,
 * cf. section "Modele economique" du CDC).
 */
export async function POST(request: Request) {
  const auth = await getAuthContext();
  let guestCookieValue: string | undefined;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Corps de requete JSON invalide.');
  }

  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? 'Requete invalide.');
  }
  const { topic, subject = 'Sciences', level = 'Intermediaire', age: bodyAge, interests: bodyInterests, language = 'fr' } = parsed.data;

  // 1. Profil requis pour personnaliser la generation.
  let profile = { 
    age: bodyAge ?? 14, 
    age_group: (bodyAge && bodyAge <= 11 ? 'enfant' : bodyAge && bodyAge >= 18 ? 'etudiant_adulte' : 'college_lycee') as any, 
    interests: bodyInterests && bodyInterests.length > 0 ? bodyInterests : ['Jeux Vidéo', 'Sciences', 'Histoire'], 
    plan: 'gratuit' as const 
  };
  
  if (auth) {
    const { data, error } = await auth.supabase
      .from('profiles')
      .select('age, age_group, interests, plan')
      .eq('id', auth.userId)
      .maybeSingle();

    if (!error && data) {
      profile = {
        ...data,
        interests: (data.interests && data.interests.length > 0) ? data.interests : (bodyInterests || profile.interests),
        age: data.age || bodyAge || profile.age,
      };
    }

    // 2. Vérification des droits (Monétisation & Credits)
    const rights = await checkGenerationRights(auth.supabase, auth.userId);
    
    if (!rights.allowed) {
      return errorResponse('Plafond atteint. Passez Premium ou regardez une publicité pour obtenir des crédits bonus.', 402);
    }

  } else {
    // 2b. Mode invité : vérification du rate-limit (3 leçons/jour)
    const guestLimit = await checkGuestRateLimit(request);
    guestCookieValue = guestLimit.cookieValue;
    if (!guestLimit.allowed) {
      return withGuestRateLimitCookie(NextResponse.json(
        {
          error: `Limite atteinte : les visiteurs non connectés peuvent générer ${GUEST_DAILY_LIMIT} leçons par jour. Créez un compte gratuit pour continuer à apprendre sans limite !`,
          requiresAuth: true,
        },
        { status: 429 }
      ), guestCookieValue);
    }
  }

  // 3. Generation IA.
  let generated;
  try {
    generated = await generateLessonContent({
      topic,
      subject,
      level,
      age: profile.age,
      ageGroup: profile.age_group,
      interests: profile.interests ?? [],
      language,
    });
  } catch (err) {
    console.error('[GENERATE_ERROR]:', err);
    return withGuestRateLimitCookie(errorResponse(
      `La generation de la lecon a echoue : ${err instanceof Error ? err.message : 'erreur inconnue'}`,
      502
    ), guestCookieValue);
  }

  // 4. Sauvegarde en base et consommation de credit si authentifie
  let lessonData;
  
  if (auth) {
    const admin = createAdminClient();
    const { data: lesson, error: insertError } = await admin
      .from('lessons')
      .insert({
        user_id: auth.userId,
        topic,
        subject,
        level,
        content: generated.content,
        quiz: generated.quiz,
      })
      .select('id, topic, subject, level, content, quiz, created_at')
      .single();

    if (insertError || !lesson) {
      return errorResponse("Impossible d'enregistrer la lecon generee.", 500);
    }
    
    lessonData = lesson;
    
    // 5. Consommer le credit / incrementer usage
    try {
      await consumeGenerationCredit(auth.supabase, auth.userId);
    } catch (e) {
      console.error("Erreur de consommation de credit:", e);
    }
  } else {
    // Mode invite : on retourne la lecon generee sans la sauvegarder en base
    lessonData = {
      id: `lesson-guest-${Date.now()}`,
      topic,
      subject,
      level,
      content: generated.content,
      quiz: generated.quiz,
      created_at: new Date().toISOString()
    };
  }

  // 5. On ne renvoie jamais les bonnes reponses avant la soumission du quiz.
  const publicQuiz: PublicQuizQuestion[] = lessonData.quiz.map(
    ({ question, options }: { question: string; options: string[] }) => ({ question, options })
  );

  return withGuestRateLimitCookie(NextResponse.json({
    lesson: {
      id: lessonData.id,
      topic: lessonData.topic,
      subject: lessonData.subject,
      level: lessonData.level,
      content: lessonData.content,
      quiz: publicQuiz,
      created_at: lessonData.created_at,
    },
  }), guestCookieValue);
}
