'use client';

import React, { useEffect, useState } from 'react';
import { Award, Sparkles, Flame, CheckCircle, Lock, Trophy, ArrowRight } from 'lucide-react';
import { INITIAL_BADGES, getDemoStats, getDemoEarnedBadges } from '@/lib/demo-engine';
import type { Badge, UserStats } from '@/types/database';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';

export default function BadgesPage() {
  const { user, stats: authStats } = useAuth();
  const { t } = useLanguage();
  const [filter, setFilter] = useState<'all' | 'earned' | 'locked'>('all');
  const [stats, setStats] = useState<UserStats | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && authStats) {
      setStats(authStats);
    } else if (!user) {
      setStats(getDemoStats());
    }
  }, [user, authStats]);

  useEffect(() => {
    setEarnedBadges(getDemoEarnedBadges());

    fetch('/api/badges')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.badges) {
          const map: Record<string, string> = {};
          data.badges.forEach((b: { id: string; code: string; earned: boolean; earned_at: string }) => {
            if (b.earned) {
              const matchingBadge = INITIAL_BADGES.find(ib => ib.code === b.code);
              if (matchingBadge) {
                map[matchingBadge.id] = b.earned_at;
              }
            }
          });
          setEarnedBadges(map);
        }
      })
      .catch(() => {});
  }, []);

  const currentLevel = stats ? Math.floor(stats.total_xp / 100) + 1 : 1;
  const currentXPInLevel = stats ? stats.total_xp % 100 : 20;

  const filteredBadges = INITIAL_BADGES.filter((badge) => {
    const isEarned = Boolean(earnedBadges[badge.id]);
    if (filter === 'earned') return isEarned;
    if (filter === 'locked') return !isEarned;
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border p-8 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-purple/30 bg-brand-purple/10 px-4 py-1.5 text-xs font-semibold text-brand-purple mb-3">
              <Trophy className="h-4 w-4 text-brand-yellow" />
              <span>Système de Gamification Pédagogique</span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground">
              {t('gamification_title')}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('gamification_subtitle')}
            </p>
          </div>

          {/* Level Progress Card */}
          <div className="bg-background rounded-2xl p-5 border border-brand-purple/30 min-w-[260px]">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-brand-purple">{t('level')} {currentLevel}</span>
              <span className="text-brand-yellow">{currentXPInLevel} / 100 XP</span>
            </div>

            <div className="h-3 w-full bg-muted rounded-full overflow-hidden p-0.5 border border-border">
              <div
                className="h-full rounded-full bg-brand-purple transition-all duration-500"
                style={{ width: `${currentXPInLevel}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          {(['all', 'earned', 'locked'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                filter === tab
                  ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/20'
                  : 'bg-muted text-muted-foreground hover:bg-card'
              }`}
            >
              {tab === 'all' && t('all_badges')}
              {tab === 'earned' && t('earned_badges')}
              {tab === 'locked' && t('locked_badges')}
            </button>
          ))}
        </div>

        <span className="text-xs text-muted-foreground">
          {Object.keys(earnedBadges).length} / {INITIAL_BADGES.length} Badges Obtenus
        </span>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBadges.map((badge) => {
          const isEarned = Boolean(earnedBadges[badge.id]);
          const earnedDate = earnedBadges[badge.id];

          return (
            <div
              key={badge.id}
              className={`rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between space-y-4 ${
                isEarned
                  ? 'border-brand-blue/40 bg-card shadow-xl'
                  : 'border-border opacity-60 bg-muted/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl shadow-lg ${
                      isEarned
                        ? 'bg-brand-blue/10 border border-brand-blue/20 shadow-brand-blue/10'
                        : 'bg-muted border border-border filter grayscale'
                    }`}
                  >
                    {badge.icon}
                  </div>

                  {isEarned ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-green/10 border border-brand-green/20 px-3 py-1 text-xs font-bold text-brand-green">
                      <CheckCircle className="h-3.5 w-3.5" /> Débloqué
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted border border-border px-3 py-1 text-xs font-semibold text-muted-foreground">
                      <Lock className="h-3.5 w-3.5" /> Verrouillé
                    </span>
                  )}
                </div>

                <h3 className="font-heading text-xl font-bold text-foreground mb-1">
                  {badge.label}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {badge.description}
                </p>
              </div>

              {/* Status Footer */}
              <div className="pt-3 border-t border-border text-[11px] text-muted-foreground">
                {isEarned ? (
                  <span className="text-brand-blue font-medium">
                    Obtenu le {new Date(earnedDate).toLocaleDateString('fr-FR')}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Condition : {badge.condition_type === 'lessons_count' ? `${badge.condition_value} leçon(s)` : badge.condition_type === 'streak' ? `${badge.condition_value} jours de série` : 'Score parfait 3/3'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
