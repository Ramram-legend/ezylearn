'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, ArrowLeft, Check, User, Award } from 'lucide-react';
import { CATALOG_INTERESTS, saveDemoProfile, saveDemoStats, getDemoStats } from '@/lib/demo-engine';
import { useAuth } from '@/hooks/useAuth';
import confetti from 'canvas-confetti';

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [displayName, setDisplayName] = useState('Alex');
  const [age, setAge] = useState<number>(14);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['space', 'coding', 'gaming']);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Compute current Age Group
  const getAgeGroupLabel = (a: number) => {
    if (a <= 11) return { label: 'Enfant (5-11 ans)', badge: '👶 Enfant', color: 'from-emerald-500 to-teal-500' };
    if (a <= 17) return { label: 'Collège / Lycée (12-17 ans)', badge: '🎒 Adolescent', color: 'from-indigo-500 to-purple-500' };
    return { label: 'Étudiant / Adulte (18-25 ans)', badge: '🎓 Étudiant / Adulte', color: 'from-purple-500 to-pink-500' };
  };

  const ageInfo = getAgeGroupLabel(age);

  const toggleInterest = (id: string) => {
    setErrorMsg(null);
    if (selectedInterests.includes(id)) {
      if (selectedInterests.length <= 2) {
        setErrorMsg('Choisis au moins 2 centres d\'intérêt.');
        return;
      }
      setSelectedInterests(selectedInterests.filter((i) => i !== id));
    } else {
      if (selectedInterests.length >= 8) {
        setErrorMsg('Tu peux choisir au maximum 8 centres d\'intérêt.');
        return;
      }
      setSelectedInterests([...selectedInterests, id]);
    }
  };

  const handleCompleteStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMsg('Veuillez entrer un prénom ou pseudo.');
      return;
    }
    setErrorMsg(null);
    setStep(2);
  };

  const handleFinishOnboarding = async () => {
    if (selectedInterests.length < 2) {
      setErrorMsg('Veuillez sélectionner au moins 2 centres d\'intérêt.');
      return;
    }

    // Save to Supabase if user is authenticated
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName, age, interests: selectedInterests }),
      });
    } catch {}

    // Always save locally as fallback for demo engine
    saveDemoProfile({ display_name: displayName, age, interests: selectedInterests });
    const currentStats = getDemoStats();
    saveDemoStats({ ...currentStats, total_xp: currentStats.total_xp + 50 });

    setStep(3);

    // Burst victory confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}

    setTimeout(() => {
      router.push('/dashboard');
    }, 2500);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Progress Bar Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Étape {step} sur 3 — Configuration de votre profil adaptatif</span>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          <div className={`h-2 rounded-full transition-all duration-300 ${step >= 1 ? 'w-16 bg-indigo-500' : 'w-8 bg-muted'}`} />
          <div className={`h-2 rounded-full transition-all duration-300 ${step >= 2 ? 'w-16 bg-indigo-500' : 'w-8 bg-muted'}`} />
          <div className={`h-2 rounded-full transition-all duration-300 ${step >= 3 ? 'w-16 bg-pink-500' : 'w-8 bg-muted'}`} />
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 p-4 text-center text-sm font-medium text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* STEP 1: Name & Age */}
      {step === 1 && (
        <div className="glass-card rounded-3xl p-8 border border-border shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground">
              Bienvenue sur <span className="text-gradient">EasyLearn</span> !
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Dites-nous en plus sur vous pour que l'IA adapte ses leçons et schémas.
            </p>
          </div>

          <form onSubmit={handleCompleteStep1} className="space-y-6">
            {/* Display Name Input */}
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-400" />
                Votre Prénom ou Pseudo
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex: Sara, Lucas, Thomas..."
                className="w-full rounded-2xl border border-border bg-card/90 px-4 py-3.5 text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-base"
                required
              />
            </div>

            {/* Age Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-muted-foreground">Votre Âge :</label>
                <span className="font-heading font-extrabold text-2xl text-indigo-400">{age} ans</span>
              </div>

              <input
                type="range"
                min="5"
                max="25"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value))}
                className="w-full h-3 bg-muted rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>5 ans</span>
                <span>15 ans</span>
                <span>25 ans</span>
              </div>

              {/* Dynamic Age Badge Preview */}
              <div className="mt-4 rounded-2xl bg-card/80 border border-border p-4 flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-tr ${ageInfo.color} flex items-center justify-center text-foreground font-bold text-lg shadow-md`}>
                  {age}
                </div>
                <div>
                  <span className="inline-block rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-bold px-2 py-0.5 mb-1 border border-indigo-500/30">
                    {ageInfo.badge}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Niveau pédagogique ajusté : <span className="text-muted-foreground font-medium">{ageInfo.label}</span>
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-base font-bold text-foreground shadow-lg shadow-indigo-500/25 hover:opacity-95 transition-opacity mt-8"
            >
              Continuer vers mes passions
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>
        </div>
      )}

      {/* STEP 2: Catalog Interests */}
      {step === 2 && (
        <div className="glass-card rounded-3xl p-8 border border-border shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground">
              Tes Centres d'Intérêt
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sélectionne entre 2 et 8 passions pour personnaliser tes illustrations et exemples.
            </p>
            <div className="mt-3 inline-block rounded-full bg-card px-4 py-1 text-xs font-bold text-indigo-400 border border-border">
              {selectedInterests.length} / 8 sélectionnés (min 2)
            </div>
          </div>

          {/* Interests Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 my-6">
            {CATALOG_INTERESTS.map((item) => {
              const isSelected = selectedInterests.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleInterest(item.id)}
                  className={`flex items-center gap-3 rounded-2xl p-3.5 text-left border transition-all duration-200 ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-600/20 text-foreground shadow-md shadow-indigo-500/10'
                      : 'border-border bg-card/60 text-muted-foreground hover:border-border hover:text-muted-foreground'
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs sm:text-sm font-semibold truncate">{item.label}</span>
                  </div>
                  {isSelected && (
                    <div className="h-5 w-5 rounded-full bg-indigo-500 flex items-center justify-center text-foreground">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-8">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-3.5 text-sm font-semibold text-muted-foreground hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </button>
            <button
              type="button"
              onClick={handleFinishOnboarding}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-4 text-base font-bold text-foreground shadow-lg shadow-indigo-500/25 hover:opacity-95 transition-opacity"
            >
              Valider mon Profil & Recevoir mon Bonus XP
              <Sparkles className="h-5 w-5 text-amber-300" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Welcome Celebration */}
      {step === 3 && (
        <div className="glass-card rounded-3xl p-12 border border-border text-center shadow-2xl animate-pulse-slow">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-foreground shadow-xl shadow-amber-500/30 mb-6">
            <Award className="h-10 w-10 animate-bounce" />
          </div>
          <h2 className="font-heading text-3xl font-extrabold text-foreground">Profil Créé avec Succès !</h2>
          <p className="mt-2 text-base text-muted-foreground">
            Bienvenue <span className="font-bold text-indigo-400">{displayName}</span> ! Vous avez reçu <span className="font-bold text-amber-400">+50 XP</span> en cadeau de bienvenue.
          </p>

          <div className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 px-6 py-3 text-sm font-semibold text-indigo-200">
            <Sparkles className="h-4 w-4 text-indigo-400 animate-spin" />
            Redirection vers votre tableau de bord...
          </div>
        </div>
      )}
    </div>
  );
}
