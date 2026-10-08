'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, PlayCircle, Crown, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import AdModal from '@/components/AdModal';
import { DAILY_GENERATION_LIMITS } from '@/lib/plans';

const FREE_DAILY_QUOTA = DAILY_GENERATION_LIMITS.gratuit ?? 10;

export default function CreditBalance() {
  const { user, profile } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [quota, setQuota] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);

  const fetchCredits = async () => {
    if (!user) return;
    try {
      // Get daily usage
      const today = new Date().toISOString().split('T')[0];
      const { data: usage } = await supabase
        .from('user_daily_usage')
        .select('lessons_generated')
        .eq('user_id', user.id)
        .eq('usage_date', today)
        .maybeSingle();
        
      const generated = usage?.lessons_generated || 0;
      setQuota(Math.max(0, FREE_DAILY_QUOTA - generated));

      // Get bonus
      const { data: credits } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();
        
      setBonus(credits?.balance || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCredits();
    }
  }, [user]);

  if (!profile || loading) return null;

  const isPremium = ['plus', 'famille', 'etablissement'].includes(profile.plan);
  const isEnfant = profile.age_group === 'enfant';

  return (
    <div className="card p-6 sm:p-8 relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="rounded-xl bg-muted p-3">
            {isPremium ? (
              <Crown className="h-6 w-6 text-brand-yellow" />
            ) : (
              <Sparkles className="h-6 w-6 text-brand-blue" />
            )}
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">
              {isPremium ? 'Accès Illimité (Premium)' : 'Vos Crédits de Génération'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isPremium
                ? 'Profitez de générations de leçons illimitées avec votre abonnement.'
                : 'Chaque jour, votre quota se réinitialise à 10 leçons.'}
            </p>
          </div>
        </div>

        {isPremium ? (
          <div className="bg-brand-yellow/10 border border-brand-yellow/30 p-4 rounded-xl text-brand-yellow text-sm font-semibold flex items-center gap-2">
            <Crown className="h-5 w-5 shrink-0" />
            Compte Premium Actif — Aucune limite d&apos;utilisation.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="flex flex-col bg-background p-5 rounded-xl border border-border">
                <span className="text-foreground text-xs uppercase tracking-wider font-bold mb-1">Quota Quotidien Restant</span>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-foreground">{quota}</span>
                  <span className="text-foreground font-medium mb-1">/ {FREE_DAILY_QUOTA} aujourd&apos;hui</span>
                </div>
              </div>

              <div className="flex flex-col bg-background p-5 rounded-xl border border-border">
                <span className="text-foreground text-xs uppercase tracking-wider font-bold mb-1">Crédits Bonus</span>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-brand-blue">{bonus}</span>
                  <span className="text-foreground font-medium mb-1">crédits</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-4">
              {!isEnfant && (
                <button
                  onClick={() => setIsAdModalOpen(true)}
                  className="flex-1 flex items-center justify-center gap-2 btn-ghost py-4 hover:scale-[1.02] transition-transform"
                >
                  <PlayCircle className="h-5 w-5 text-brand-blue" />
                  Regarder une pub
                </button>
              )}
              
              <button className="flex-1 flex items-center justify-center gap-2 btn-primary py-4">
                <Crown className="h-5 w-5 text-brand-yellow" /> Passer Premium
              </button>
            </div>

            {!isEnfant && (
              <AdModal
                isOpen={isAdModalOpen}
                onClose={() => setIsAdModalOpen(false)}
                onRewardGranted={() => {
                  fetchCredits();
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
