'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Brain, PlusCircle, ArrowLeft, CheckCircle2, Zap, Layers, HelpCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import WatchAdButton from '@/components/WatchAdButton';
import { DAILY_GENERATION_LIMITS } from '@/lib/plans';

export default function GenerateLessonPage() {
  const { language, t } = useLanguage();
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('Sciences');
  const [level, setLevel] = useState('Intermédiaire');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Crédit logic
  const { user } = useAuth();
  const supabase = createClient();
  const [hasCredits, setHasCredits] = useState<boolean>(true); // Assume true initially to prevent flash
  const [creditsLoading, setCreditsLoading] = useState(true);

  const fetchCredits = async () => {
    if (!user) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: usage } = await supabase
        .from('user_daily_usage')
        .select('lessons_generated')
        .eq('user_id', user.id)
        .eq('usage_date', today)
        .maybeSingle();
        
      const generated = usage?.lessons_generated || 0;
      const freeLeft = Math.max(0, (DAILY_GENERATION_LIMITS.gratuit ?? 10) - generated);
      
      const { data: credits } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();
        
      const bonus = credits?.balance || 0;
      
      setHasCredits(freeLeft > 0 || bonus > 0);
    } catch (e) {
      console.error(e);
    } finally {
      setCreditsLoading(false);
    }
  };

  React.useEffect(() => {
    if (user) {
      fetchCredits();
    }
  }, [user]);

  const loadingSteps = [
    'Initialisation de la session pédagogique adaptative...',
    'Consultation du modèle d\'IA pour adapter au profil...',
    'Génération du schéma vectoriel animé (SVG)...',
    'Formulation de l\'explication et du fait surprenant...',
    'Création du quiz interactif de 3 questions...',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    setError(null);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 600);

    const { getDemoProfile, saveDemoLesson, createDemoLesson } = await import('@/lib/demo-engine');
    const demoProfile = getDemoProfile();

    try {
      const res = await fetch('/api/lessons/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic, 
          subject, 
          level,
          age: demoProfile?.age,
          interests: demoProfile?.interests,
          language,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        clearInterval(stepInterval);
        
        // If it's a guest lesson, save it to local storage so the next page can find it
        if (data.lesson.id.startsWith('lesson-guest-')) {
          saveDemoLesson(data.lesson);
        }
        
        router.push(`/lessons/${data.lesson.id}`);
        return;
      } else {
        const errData = await res.json().catch(() => ({}));
        const errorMessage = errData.error || "";
        
        if (errorMessage.includes("429") || errorMessage.toLowerCase().includes("quota")) {
          alert("Le système a atteint son quota de génération gratuit pour aujourd'hui. Une leçon de démonstration va être générée à la place.");
          clearInterval(stepInterval);
          const created = createDemoLesson(topic, subject, level);
          router.push(`/lessons/${created.id}`);
          return;
        }
        
        setError(errorMessage || "Une erreur est survenue lors de la génération.");
      }
    } catch (e) {
      setError("Impossible de contacter le serveur de génération.");
    }

    // Stop loading state on error
    clearInterval(stepInterval);
    setIsGenerating(false);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      
      {/* Top Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au tableau de bord
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue flex-shrink-0">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {t('generate_page_title' as any)}
            </h1>
            <p className="text-base text-muted-foreground mt-1">
              {t('generate_page_subtitle' as any)}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-center text-sm text-red-500 font-medium">
          {error}
        </div>
      )}

      {/* Main Generator Form Card */}
      {!isGenerating ? (
        <div className="card p-8 shadow-sm space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Topic Input */}
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                {t('topic_label' as any)}
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t('topic_placeholder' as any)}
                className="w-full rounded-xl border border-border bg-background px-4 py-4 text-foreground placeholder:text-muted-foreground focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue text-base"
                required
              />
            </div>

            {/* Subject & Difficulty Level Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Matière Principale
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
                >
                  <option value="Sciences">Sciences & Nature</option>
                  <option value="Espace">Espace & Astronomie</option>
                  <option value="Informatique">Informatique & IA</option>
                  <option value="Histoire">Histoire & Civilisations</option>
                  <option value="Mathématiques">Mathématiques</option>
                  <option value="Art & Musique">Art & Musique</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Niveau de Difficulté
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
                >
                  <option value="Débutant">Débutant (Introduction claire)</option>
                  <option value="Intermédiaire">Intermédiaire (Détails & concepts)</option>
                  <option value="Avancé">Avancé (Approfondissement technique)</option>
                </select>
              </div>
            </div>

            {/* Quota indicator */}
            <div className="rounded-xl bg-brand-blue/5 border border-brand-blue/20 p-4 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-brand-blue font-medium">
                <Zap className="h-4 w-4" />
                Limite plan gratuit : {DAILY_GENERATION_LIMITS.gratuit ?? 10} leçons / jour
              </span>
              <span className="font-bold text-foreground">Création instantanée</span>
            </div>

            {/* Submit Button or Watch Ad */}
            {!creditsLoading && !hasCredits ? (
              <div className="space-y-3 pt-2">
                <div className="text-center text-sm font-bold text-red-500">
                  Vous avez épuisé votre quota gratuit !
                </div>
                <WatchAdButton 
                  className="w-full"
                  onRewardGranted={() => {
                    fetchCredits(); // Reload credits
                  }} 
                />
              </div>
            ) : (
              <button
                type="submit"
                disabled={creditsLoading}
                className="w-full flex items-center justify-center gap-3 btn-primary py-4 text-base mt-2"
              >
                <Sparkles className="h-5 w-5" />
                {creditsLoading ? 'Vérification...' : 'Générer la Leçon avec Schéma SVG'}
              </button>
            )}
          </form>
        </div>
      ) : (
        /* Loading Animation Screen */
        <div className="card p-12 text-center shadow-sm space-y-8" aria-live="polite" aria-busy="true">
          <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-brand-blue/10">
            <Sparkles className="h-12 w-12 text-brand-blue animate-spin" />
            <div className="absolute inset-0 rounded-2xl bg-brand-blue/20 animate-ping opacity-25" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-foreground">
              Génération de <span className="text-brand-blue">"{topic}"</span>
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              L'intelligence artificielle prépare ton cours sur-mesure...
            </p>
          </div>

          {/* Progress Steps List */}
          <div className="max-w-md mx-auto space-y-3 text-left">
            {loadingSteps.map((stepText, idx) => {
              const isDone = idx < loadingStep;
              const isCurrent = idx === loadingStep;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 rounded-xl p-3 border text-sm font-medium transition-all ${
                    isDone
                      ? 'border-brand-green/30 bg-brand-green/10 text-brand-green'
                      : isCurrent
                      ? 'border-brand-blue/40 bg-brand-blue/10 text-brand-blue animate-pulse'
                      : 'border-border bg-muted/50 text-muted-foreground'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-5 w-5 text-brand-green flex-shrink-0" />
                  ) : isCurrent ? (
                    <Sparkles className="h-5 w-5 text-brand-blue animate-spin flex-shrink-0" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border border-muted-foreground flex-shrink-0" />
                  )}
                  <span>{stepText}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
