'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Flame, Award, BookOpen, PlusCircle, ArrowRight, Play, CheckCircle, Lightbulb, Zap, Target, CheckCircle2, Star, X, AlertTriangle } from 'lucide-react';
import { getDemoProfile, getDemoStats, getDemoLessons, createDemoLesson } from '@/lib/demo-engine';
import type { Profile, UserStats, Lesson } from '@/types/database';
import CreditBalance from '@/components/CreditBalance';
import { useLanguage } from '@/hooks/useLanguage';

interface DailyQuest {
  id: string;
  title: string;
  desc: string;
  icon: string;
  progress: number;
  total: number;
  xpBonus: number;
  completed: boolean;
}

export default function DashboardPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentLessons, setRecentLessons] = useState<Lesson[]>([]);
  const [quickTopic, setQuickTopic] = useState('');
  const [quickSubject, setQuickSubject] = useState('Sciences');
  const [isGenerating, setIsGenerating] = useState(false);
  const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>([]);
  const [questsLoading, setQuestsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.ok ? res.json() : null)
      .then(async (data) => {
        if (data?.profile) {
          if (!data.profile.interests || data.profile.interests.length < 2) {
            router.push('/onboarding');
            return;
          }

          // Logged in user: sync demo progress if any
          setProfile(data.profile);
          const dLessons = getDemoLessons();
          const dStats = getDemoStats();
          
          if (dLessons.length > 0 || dStats.total_xp > 50) {
            await fetch('/api/sync-demo', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ demoStats: dStats, demoLessons: dLessons })
            });
            localStorage.removeItem('easylearn_demo_lessons');
            localStorage.removeItem('easylearn_demo_stats');
            localStorage.removeItem('easylearn_demo_profile');
            
            // Refetch to get updated stats and lessons
            const ref = await fetch('/api/dashboard');
            if (ref.ok) {
              const rData = await ref.json();
              if (rData.stats) setStats(rData.stats);
              if (rData.recentLessons) setRecentLessons(rData.recentLessons);
            }
          } else {
            if (data.stats) setStats(data.stats);
            if (data.recentLessons) setRecentLessons(data.recentLessons);
          }

          // Charger les quêtes quotidiennes dynamiques
          setQuestsLoading(true);
          fetch('/api/quests')
            .then((r) => r.ok ? r.json() : null)
            .then((qData) => {
              if (qData?.quests) setDailyQuests(qData.quests);
            })
            .catch(() => {})
            .finally(() => setQuestsLoading(false));
        } else {
          // Not logged in: force them to the home page (where login popup will appear)
          router.push('/');
        }
      })
      .catch(() => {
        // Error: force them to home page
        router.push('/');
      });
  }, [router]);

  const handleQuickGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTopic.trim()) return;

    setIsGenerating(true);

    try {
      const res = await fetch('/api/lessons/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: quickTopic, subject: quickSubject }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/lessons/${data.lesson.id}`);
        return;
      } else {
        const errData = await res.json().catch(() => ({}));
        const apiErrorText = errData.error || "";
        
        if (apiErrorText.includes("429") || apiErrorText.toLowerCase().includes("quota")) {
          setErrorMessage(t('ai_quota_reached_demo'));
          const created = createDemoLesson(quickTopic, quickSubject);
          router.push(`/lessons/${created.id}`);
          return;
        }
        
        setErrorMessage(apiErrorText || t('generation_error'));
      }
    } catch (e) {
      setErrorMessage(t('server_contact_error'));
    }

    setIsGenerating(false);
  };

  const suggestions = [
    { topic: 'La Photosynthèse & Chloroplastes', subject: 'Biologie', icon: '🌿' },
    { topic: 'Les Trous Noirs & l\'Horizon des Événements', subject: 'Espace', icon: '🚀' },
    { topic: 'Intelligence Artificielle & Réseaux de Neurones', subject: 'Informatique', icon: '🤖' },
    { topic: 'La Pyramide de Khéops', subject: 'Histoire', icon: '📜' },
  ];

  if (!profile || !stats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-brand-blue">
          <Sparkles className="h-6 w-6 animate-spin" />
          <span className="text-sm font-medium">{t('loading_dashboard')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      {errorMessage && (
        <div className="relative overflow-hidden rounded-xl bg-red-500/10 p-4 border border-red-500/20 shadow-sm animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 opacity-[0.05] pointer-events-none" />
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-red-500 to-orange-500" />
          <div className="flex items-start sm:items-center justify-between gap-4 relative z-10 pl-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-500">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-red-500">Oups, une erreur est survenue</h3>
                <p className="text-sm text-foreground/90 font-medium mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="shrink-0 p-2 text-foreground/50 hover:bg-red-500/10 hover:text-red-500 rounded-full transition-colors"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-bold text-brand-blue border border-brand-blue/20">
                {profile.age_group === 'enfant' ? `👶 ${t('child_mode')}` : profile.age_group === 'college_lycee' ? `🎒 ${t('teen_mode')}` : `🎓 ${t('adult_mode')}`} ({profile.age} {t('years_old')})
              </span>
              <span className="rounded-full bg-brand-green/10 px-3 py-1 text-xs font-bold text-brand-green border border-brand-green/20">
                {t('free_plan')} (5{t('per_day')})
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
              {t('welcome_back')}, <span className="text-brand-blue">{profile.display_name ?? t('learner')}</span> ! 👋
            </h1>
            <p className="mt-2 text-base text-foreground">
              {t('ready_explore')}
            </p>
          </div>

          {/* Quick Start Action Button */}
          <Link
            href="/lessons/generate"
            className="btn-primary whitespace-nowrap"
          >
            <PlusCircle className="h-5 w-5" />
            {t('create_custom_lesson')}
          </Link>
        </div>
      </div>

      {/* Gamification Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* XP Card */}
        <div className="card card-hover p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue flex-shrink-0">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-foreground font-medium uppercase tracking-wider">{t('experience')}</span>
            <div className="text-2xl font-extrabold text-foreground flex items-baseline gap-1">
              {stats.total_xp} <span className="text-sm font-bold text-brand-blue">XP</span>
            </div>
          </div>
        </div>

        {/* Streak Card */}
        <div className="card card-hover p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-yellow/10 text-brand-yellow flex-shrink-0">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-foreground font-medium uppercase tracking-wider">{t('active_streak')}</span>
            <div className="text-2xl font-extrabold text-foreground flex items-baseline gap-1">
              {stats.current_streak} <span className="text-sm font-bold text-brand-yellow">{t('days')}</span>
            </div>
          </div>
        </div>

        {/* Completed Lessons Card */}
        <div className="card card-hover p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green flex-shrink-0">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-foreground font-medium uppercase tracking-wider">{t('completed_lessons')}</span>
            <div className="text-2xl font-extrabold text-foreground">
              {stats.lessons_completed}
            </div>
          </div>
        </div>

        {/* Progress Link Card */}
        <Link href="/progress" className="card card-hover p-5 flex items-center justify-between group cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 flex-shrink-0">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-foreground font-medium uppercase tracking-wider">{t('progress')}</span>
              <div className="text-lg font-bold text-foreground">
                {t('view_my_stats')}
              </div>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-foreground group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Credit & Monetization Balance */}
      <CreditBalance />

      {/* Main Content Grid: AI Quick Generator + Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quick Generator Box (2 Cols) */}
        <div className="lg:col-span-2 card p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue flex-shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{t('quick_generator')}</h2>
              <p className="text-sm text-foreground">{t('quick_generator_desc')}</p>
            </div>
          </div>

          <form onSubmit={handleQuickGenerate} className="space-y-4">
            <div>
              <input
                type="text"
                value={quickTopic}
                onChange={(e) => setQuickTopic(e.target.value)}
                placeholder={t('example_placeholder')}
                className="w-full rounded-xl border border-border bg-background px-4 py-3.5 text-foreground placeholder:text-foreground focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <select
                value={quickSubject}
                onChange={(e) => setQuickSubject(e.target.value)}
                className="w-full sm:w-48 rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
              >
                <option value="Sciences">{t('sciences')}</option>
                <option value="Informatique">{t('informatique')}</option>
                <option value="Espace">{t('espace')}</option>
                <option value="Histoire">{t('histoire')}</option>
                <option value="Mathématiques">{t('mathematiques')}</option>
              </select>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full sm:w-auto flex-1 btn-primary py-3"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin" />
                    {t('generating')}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {t('start_lesson')}
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Idea Pills */}
          <div className="pt-2">
            <span className="text-xs font-semibold text-foreground block mb-2 uppercase tracking-wider">{t('trending_ideas')}</span>
            <div className="flex flex-wrap gap-2">
              {['La Photosynthèse', 'Les Trous Noirs', 'La Blockchain', 'La Révolution Française'].map((idea) => (
                <button
                  key={idea}
                  type="button"
                  onClick={() => setQuickTopic(idea)}
                  className="rounded-full border border-border bg-muted px-3 py-1.5 text-xs text-foreground hover:border-brand-blue hover:text-brand-blue transition-colors font-medium"
                >
                  + {idea}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Personalized Suggestions (1 Col) */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-brand-yellow" />
            <h2 className="text-lg font-bold text-foreground">{t('suggestions')}</h2>
          </div>
          <p className="text-sm text-foreground">{t('inspired_by_passions')} ({profile.interests.join(', ')})</p>

          <div className="space-y-3 pt-2">
            {suggestions.map((sugg, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuickTopic(sugg.topic);
                  setQuickSubject(sugg.subject);
                }}
                className="w-full flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3 text-left hover:border-brand-blue hover:bg-muted transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{sugg.icon}</span>
                  <div>
                    <span className="block text-sm font-bold text-foreground group-hover:text-brand-blue transition-colors">{sugg.topic}</span>
                    <span className="text-[11px] text-foreground font-medium">{sugg.subject}</span>
                  </div>
                </div>
                <Play className="h-4 w-4 text-foreground group-hover:text-brand-blue transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        {/* Recent Lessons Section (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-brand-blue" />
              <h2 className="text-xl font-bold text-foreground">{t('recent_lessons')}</h2>
            </div>
            <Link href="/history" className="text-sm font-semibold text-brand-blue hover:underline flex items-center gap-1">
              {t('view_all')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {recentLessons.length === 0 ? (
            <div className="card p-8 text-center text-foreground">
              {t('no_lessons_yet')}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentLessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/lessons/${lesson.id}`}
                  className="card card-hover p-5 flex flex-col justify-between space-y-4 group"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className="rounded-md bg-muted px-2.5 py-1 font-semibold text-foreground">
                        {lesson.subject}
                      </span>
                      <span className="text-foreground font-medium">
                        {new Date(lesson.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-brand-blue transition-colors line-clamp-2">
                      {lesson.topic}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-3 border-t border-border">
                    <span className="flex items-center gap-1.5 text-brand-green font-bold">
                      <CheckCircle className="h-4 w-4" /> {t('ready_to_review')}
                    </span>
                    <span className="font-bold text-brand-blue group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      {t('review')} <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Daily Quests Section (1 Col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-brand-yellow" />
              <h2 className="text-xl font-bold text-foreground">{t('daily_quests')}</h2>
            </div>
            <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              {dailyQuests.filter(q => q.completed).length}/{dailyQuests.length} ✓
            </span>
          </div>
          
          <div className="card p-5 space-y-3">
            {questsLoading ? (
              <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                <Sparkles className="h-4 w-4 animate-spin text-brand-blue" />
                <span className="text-sm">{t('loading_quests')}</span>
              </div>
            ) : dailyQuests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t('no_quests')}</p>
            ) : (
              dailyQuests.map((quest) => {
                const isCompleted = quest.completed;
                const percent = Math.round((quest.progress / quest.total) * 100);
                
                return (
                  <div key={quest.id} className={`p-3.5 rounded-xl border transition-all ${
                    isCompleted 
                      ? 'bg-brand-green/10 border-brand-green/30 shadow-sm' 
                      : 'bg-background border-border hover:border-brand-blue/40'
                  }`}>
                    <div className="flex items-start justify-between mb-1.5 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{quest.icon}</span>
                        <h3 className={`text-sm font-bold ${isCompleted ? 'text-brand-green' : 'text-foreground'}`}>
                          {quest.title}
                        </h3>
                      </div>
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-brand-green shrink-0" />
                      ) : (
                        <span className="text-xs font-bold text-brand-blue bg-brand-blue/10 px-2 py-0.5 rounded-full border border-brand-blue/20 shrink-0">
                          +{quest.xpBonus} XP
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 ml-6">{quest.desc}</p>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted/60 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-700 rounded-full ${
                            isCompleted ? 'bg-brand-green' : 'bg-gradient-to-r from-brand-blue to-purple-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground shrink-0">
                        {quest.progress}/{quest.total}
                      </span>
                    </div>
                    
                    {isCompleted && (
                      <div className="mt-2 ml-6 flex items-center gap-1.5 text-xs font-bold text-brand-green">
                        <Star className="h-3.5 w-3.5" />
                        +{quest.xpBonus} {t('xp_bonus_unlocked')}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
