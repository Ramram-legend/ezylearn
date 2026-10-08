'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles, Flame, Award, BookOpen, ArrowLeft, TrendingUp,
  Target, CheckCircle2, Star, Zap, Calendar, Trophy, BarChart2
} from 'lucide-react';
import type { UserStats, Badge, Lesson } from '@/types/database';

interface ProgressData {
  stats: UserStats;
  badges: { badge: Badge; earned_at: string }[];
  recentLessons: Lesson[];
  weeklyActivity: { date: string; lessons: number; xp: number }[];
}

function XpLevelInfo(xp: number) {
  const levels = [
    { min: 0, max: 200, label: 'Débutant', icon: '🌱', color: 'text-brand-green' },
    { min: 200, max: 500, label: 'Apprenti', icon: '📘', color: 'text-brand-blue' },
    { min: 500, max: 1000, label: 'Explorateur', icon: '🔭', color: 'text-purple-500' },
    { min: 1000, max: 2000, label: 'Érudit', icon: '🧠', color: 'text-brand-yellow' },
    { min: 2000, max: 5000, label: 'Savant', icon: '⚡', color: 'text-orange-500' },
    { min: 5000, max: Infinity, label: 'Maître', icon: '🏆', color: 'text-brand-yellow' },
  ];
  const level = levels.find((l) => xp >= l.min && xp < l.max) || levels[0];
  const progress = level.max === Infinity ? 100 : Math.round(((xp - level.min) / (level.max - level.min)) * 100);
  const nextLevelXp = level.max === Infinity ? null : level.max;
  return { ...level, progress, nextLevelXp };
}

export default function ProgressPage() {
  const router = useRouter();
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.ok ? r.json() : null)
      .then(async (dashData) => {
        if (!dashData?.profile) { router.push('/'); return; }

        // Charger badges
        const badgesRes = await fetch('/api/badges').then(r => r.ok ? r.json() : null);

        // Construire l'activité hebdomadaire à partir des leçons récentes
        const lessons: Lesson[] = dashData.recentLessons || [];
        const today = new Date();
        const weekActivity = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(today);
          d.setDate(d.getDate() - (6 - i));
          const dateStr = d.toISOString().split('T')[0];
          const dayLessons = lessons.filter(l =>
            l.created_at.startsWith(dateStr)
          );
          return {
            date: dateStr,
            lessons: dayLessons.length,
            xp: dayLessons.length * 70, // estimation
          };
        });

        setData({
          stats: dashData.stats,
          badges: badgesRes?.userBadges || [],
          recentLessons: lessons,
          weeklyActivity: weekActivity,
        });
        setLoading(false);
      })
      .catch(() => { router.push('/'); });
  }, [router]);

  if (loading || !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-brand-blue">
          <Sparkles className="h-6 w-6 animate-spin" />
          <span className="text-sm font-medium">Chargement de votre progression...</span>
        </div>
      </div>
    );
  }

  const { stats, badges, recentLessons, weeklyActivity } = data;
  const levelInfo = XpLevelInfo(stats.total_xp);
  const maxDayLessons = Math.max(...weeklyActivity.map(d => d.lessons), 1);

  const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Tableau de bord
          </button>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-2">
          <TrendingUp className="h-7 w-7 text-brand-blue" />
          Ma Progression
        </h1>
      </div>

      {/* Niveau XP — Card principale */}
      <div className="card p-6 sm:p-8 bg-gradient-to-br from-brand-blue/10 via-purple-500/5 to-brand-blue/5 border-brand-blue/20 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-blue/10 border border-brand-blue/20 text-3xl">
              {levelInfo.icon}
            </div>
            <div>
              <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">Niveau actuel</span>
              <h2 className={`text-2xl font-extrabold ${levelInfo.color}`}>{levelInfo.label}</h2>
              <p className="text-sm text-muted-foreground font-medium">
                {stats.total_xp.toLocaleString('fr-FR')} XP au total
              </p>
            </div>
          </div>
          {levelInfo.nextLevelXp && (
            <div className="text-right">
              <span className="text-xs text-muted-foreground font-medium">Prochain niveau</span>
              <p className="text-lg font-bold text-foreground">
                {(levelInfo.nextLevelXp - stats.total_xp).toLocaleString('fr-FR')} XP restants
              </p>
            </div>
          )}
        </div>

        {/* Barre de progression niveau */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-muted-foreground">
            <span>{levelInfo.min.toLocaleString('fr-FR')} XP</span>
            <span>{levelInfo.progress}%</span>
            <span>{levelInfo.max === Infinity ? '∞' : levelInfo.max.toLocaleString('fr-FR')} XP</span>
          </div>
          <div className="w-full bg-muted/60 h-3 rounded-full overflow-hidden border border-border/40">
            <div
              className="bg-gradient-to-r from-brand-blue via-purple-500 to-brand-blue h-full transition-all duration-1000 rounded-full relative overflow-hidden"
              style={{ width: `${levelInfo.progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total XP', value: stats.total_xp.toLocaleString('fr-FR'), unit: 'XP', icon: Sparkles, color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
          { label: 'Série active', value: stats.current_streak, unit: 'jours', icon: Flame, color: 'text-brand-yellow', bg: 'bg-brand-yellow/10' },
          { label: 'Leçons', value: stats.lessons_completed, unit: 'terminées', icon: BookOpen, color: 'text-brand-green', bg: 'bg-brand-green/10' },
          { label: 'Quiz', value: stats.quizzes_completed, unit: 'validés', icon: CheckCircle2, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        ].map(({ label, value, unit, icon: Icon, color, bg }) => (
          <div key={label} className="card p-4 sm:p-5 space-y-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
              <div className="text-xs text-muted-foreground font-medium">{label}</div>
              <div className="text-[10px] text-muted-foreground">{unit}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Activité Hebdomadaire */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-brand-blue" />
          <h2 className="text-lg font-bold text-foreground">Activité de la semaine</h2>
        </div>

        <div className="flex items-end gap-2 h-28">
          {weeklyActivity.map((day, idx) => {
            const heightPercent = maxDayLessons > 0
              ? Math.round((day.lessons / maxDayLessons) * 100)
              : 0;
            const isToday = day.date === new Date().toISOString().split('T')[0];
            const dayOfWeek = new Date(day.date).getDay();
            const label = DAY_LABELS[(dayOfWeek + 6) % 7]; // Lundi = index 0

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full flex flex-col justify-end h-20 relative group">
                  {day.lessons > 0 && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-card border border-border rounded-md px-1.5 py-0.5 text-[10px] font-bold text-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {day.lessons} leçon{day.lessons > 1 ? 's' : ''}
                    </div>
                  )}
                  <div
                    className={`w-full rounded-t-md transition-all duration-700 ${
                      heightPercent === 0
                        ? 'h-1 bg-muted/40'
                        : isToday
                          ? 'bg-gradient-to-t from-brand-blue to-purple-500'
                          : 'bg-brand-blue/40 hover:bg-brand-blue/70'
                    }`}
                    style={{ height: heightPercent > 0 ? `${Math.max(heightPercent, 10)}%` : '4px' }}
                  />
                </div>
                <span className={`text-[10px] font-bold ${isToday ? 'text-brand-blue' : 'text-muted-foreground'}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-gradient-to-t from-brand-blue to-purple-500" />
            <span>Aujourd'hui</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-brand-blue/40" />
            <span>Jours précédents</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-muted/40" />
            <span>Inactif</span>
          </div>
        </div>
      </div>

      {/* Badges obtenus */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-brand-yellow" />
            <h2 className="text-lg font-bold text-foreground">Badges débloqués</h2>
          </div>
          <Link href="/badges" className="text-sm font-semibold text-brand-blue hover:underline">
            Voir tous →
          </Link>
        </div>

        {badges.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <Award className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Aucun badge encore. Continue d'apprendre !</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {badges.map(({ badge, earned_at }) => (
              <div
                key={badge.id}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-brand-yellow/20 bg-brand-yellow/5 hover:bg-brand-yellow/10 transition-colors"
              >
                <span className="text-2xl">{badge.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{badge.label}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(earned_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historique récent */}
      {recentLessons.length > 0 && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-brand-blue" />
            <h2 className="text-lg font-bold text-foreground">Leçons récentes</h2>
          </div>
          <div className="space-y-2">
            {recentLessons.slice(0, 5).map((lesson) => (
              <Link
                key={lesson.id}
                href={`/lessons/${lesson.id}`}
                className="flex items-center justify-between p-3.5 rounded-xl border border-border hover:border-brand-blue hover:bg-muted/30 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-brand-blue/10 flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4 text-brand-blue" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate group-hover:text-brand-blue transition-colors">
                      {lesson.topic}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {lesson.subject} · {new Date(lesson.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <CheckCircle2 className="h-4 w-4 text-brand-green shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Streak Record */}
      {stats.longest_streak > 0 && (
        <div className="card p-5 flex items-center gap-4 bg-brand-yellow/5 border-brand-yellow/20">
          <div className="h-12 w-12 rounded-xl bg-brand-yellow/20 flex items-center justify-center">
            <Star className="h-6 w-6 text-brand-yellow" />
          </div>
          <div>
            <p className="text-xs font-bold text-brand-yellow uppercase tracking-wider">Record personnel</p>
            <p className="text-xl font-extrabold text-foreground">
              {stats.longest_streak} jours de série consécutifs 🔥
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
