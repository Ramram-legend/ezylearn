'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Brain, Layers, Award, ArrowRight, Zap, Flame, Sparkles, BarChart3, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';

export default function Home() {
  const router = useRouter();
  const { user, loading, openLogin } = useAuth();
  const { t } = useLanguage();

  React.useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* ── Hero Section ─────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          
          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-foreground leading-[1.1] tracking-tight">
            {t('learn_any_topic')}{' '}
            <span className="text-brand-blue">{t('interactive_ai_lessons')}</span>
          </h1>

          <p className="text-base sm:text-xl leading-relaxed text-muted-foreground max-w-2xl mx-auto">
            {t('hero_subtitle')}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {user ? (
              <>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="btn-primary text-base px-8 py-4 font-bold shadow-lg shadow-brand-blue/20 hover:scale-[1.02] transition-transform"
                >
                  <Layers className="h-5 w-5" />
                  {t('get_started')}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <Link href="/lessons/generate" className="btn-ghost text-base px-8 py-4">
                  {t('generate_a_lesson')}
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={openLogin}
                  className="btn-primary text-base px-8 py-4 font-bold shadow-lg shadow-brand-blue/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-5 w-5" />
                  {t('get_started')}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button onClick={openLogin} className="btn-ghost text-base px-8 py-4">
                  {t('login')}
                </button>
              </>
            )}
          </div>

          {/* Social proof / trust line */}
          <div className="flex items-center justify-center gap-6 flex-wrap pt-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
              <CheckCircle2 className="h-4 w-4 text-brand-green" />
              {t('free_to_start')}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
              <CheckCircle2 className="h-4 w-4 text-brand-blue" />
              {t('adapted_for_age')}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
              <CheckCircle2 className="h-4 w-4 text-brand-yellow" />
              {t('lessons_in_french')}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Bento ───────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-muted/50 border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center max-w-2xl mx-auto">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-blue mb-3">
              {t('features')}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
              {t('features_title')}
            </h2>
            <p className="text-muted-foreground text-lg">
              {t('features_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="card p-8 hover:-translate-y-1 transition-transform duration-300">
              <div className="h-12 w-12 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center mb-6">
                <Brain className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-card-foreground mb-3">{t('adaptive_ai')}</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                {t('adaptive_ai_desc')}
              </p>
            </div>

            <div className="card p-8 hover:-translate-y-1 transition-transform duration-300">
              <div className="h-12 w-12 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center mb-6">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-card-foreground mb-3">{t('clear_explanations')}</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                {t('clear_explanations_desc')}
              </p>
            </div>

            <div className="card p-8 hover:-translate-y-1 transition-transform duration-300">
              <div className="h-12 w-12 rounded-xl bg-brand-yellow/10 text-brand-yellow flex items-center justify-center mb-6">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-card-foreground mb-3">{t('interactive_quizzes')}</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                {t('interactive_quizzes_desc')}
              </p>
            </div>
            
            {/* Wide bottom card */}
            <div className="md:col-span-3 card p-8 flex flex-col md:flex-row items-center justify-between gap-8 hover:-translate-y-1 transition-transform duration-300">
               <div className="flex-1">
                 <div className="flex items-center gap-3 mb-3">
                   <div className="h-10 w-10 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                     <Award className="h-5 w-5" />
                   </div>
                   <h3 className="text-xl font-bold text-card-foreground">{t('gamification')}</h3>
                 </div>
                 <p className="text-base text-muted-foreground max-w-2xl">
                   {t('gamification_desc')}
                 </p>
               </div>
               
               <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
                 <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border text-foreground text-sm font-bold">
                   <Flame className="h-4 w-4 text-brand-yellow" />
                   7 jours
                 </div>
                 <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border text-foreground text-sm font-bold">
                   <Sparkles className="h-4 w-4 text-brand-blue" />
                   1 250 XP
                 </div>
                 <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border text-foreground text-sm font-bold">
                   <BarChart3 className="h-4 w-4 text-brand-green" />
                   Niveau 5
                 </div>
               </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────── */}
      <section className="py-24 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 w-full text-center">
        <h2 className="text-3xl sm:text-5xl font-extrabold text-foreground mb-6 tracking-tight">
          {t('ready_to_learn')}
        </h2>
        <p className="text-lg mb-10 text-muted-foreground">
          {t('join_thousands')}
        </p>
        <button
          onClick={() => {
            if (user) {
              router.push('/dashboard');
            } else {
              openLogin();
            }
          }}
          className="btn-primary text-base px-10 py-4 shadow-lg shadow-brand-blue/20 font-bold hover:scale-[1.02] transition-transform inline-flex items-center justify-center gap-2"
        >
          <Sparkles className="h-5 w-5" />
          {t('get_started')}
          <ArrowRight className="h-4 w-4" />
        </button>
      </section>

    </div>
  );
}

function LayoutIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}
