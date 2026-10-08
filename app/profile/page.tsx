'use client';

import React, { useEffect, useState } from 'react';
import { User, Check, Sparkles, Shield, Heart, Crown, CheckCircle2, Zap } from 'lucide-react';
import { getDemoProfile, saveDemoProfile, CATALOG_INTERESTS } from '@/lib/demo-engine';
import type { Profile, Plan } from '@/types/database';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';

export default function ProfilePage() {
  const { user, profile: authProfile, refreshStats } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState(14);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [savedMsg, setSavedMsg] = useState(false);
  const [loading, setLoading] = useState(false);
  const isInitialized = React.useRef(false);

  useEffect(() => {
    if (user && authProfile && !isInitialized.current) {
      isInitialized.current = true;
      setProfile(authProfile);
      setDisplayName(authProfile.display_name ?? 'Apprenant');
      setAge(authProfile.age);
      setSelectedInterests(authProfile.interests);
    } else if (!user && !authProfile && isInitialized.current) {
      window.location.href = '/';
    }
  }, [user, authProfile]);

  const toggleInterest = (id: string) => {
    if (selectedInterests.includes(id)) {
      if (selectedInterests.length <= 2) return;
      setSelectedInterests(selectedInterests.filter((i) => i !== id));
    } else {
      if (selectedInterests.length >= 8) return;
      setSelectedInterests([...selectedInterests, id]);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (user) {
      try {
        const res = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ display_name: displayName, age, interests: selectedInterests }),
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
          setAge(data.profile.age);
          setDisplayName(data.profile.display_name ?? displayName);
          setSelectedInterests(data.profile.interests);
          await refreshStats();
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      const updated = saveDemoProfile({ display_name: displayName, age, interests: selectedInterests });
      setProfile(updated);
    }
    
    setLoading(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };


  const plans = [
    {
      id: 'gratuit',
      name: 'Plan Gratuit',
      price: '0 €',
      period: 'Pour toujours',
      description: 'L\'essentiel pour découvrir l\'apprentissage adaptatif.',
      features: [
        '5 leçons personnalisées par jour',
        'Schémas animés SVG & Quiz',
        'Gain d\'XP & Série quotidienne',
        'Armoire de 6 badges',
      ],
      current: profile?.plan === 'gratuit' || !profile?.plan,
      buttonText: 'Plan Actuel',
      buttonStyle: 'border border-border text-muted-foreground bg-card',
    },
    {
      id: 'plus',
      name: 'Plan EasyLearn Plus',
      price: '4,99 €',
      period: '/ mois',
      popular: true,
      description: 'Pour les apprenants passionnés qui veulent avancer sans limite.',
      features: [
        'Générations de leçons illimitées',
        'Schémas SVG haute résolution',
        'Correction détaillée par IA avec indices',
        'Exportation PDF des fiches de révision',
      ],
      current: profile?.plan === 'plus',
      buttonText: 'Passer à EasyLearn Plus',
      buttonStyle: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-foreground font-bold shadow-lg shadow-indigo-500/25',
    },
    {
      id: 'famille',
      name: 'Plan Famille',
      price: '9,99 €',
      period: '/ mois',
      description: 'Jusqu\'à 4 profils enfants & adolescents dans un même compte.',
      features: [
        'Tout le plan Plus pour 4 enfants',
        'Tableau de bord suivi des parents',
        'Contrôle des matières et temps d\'écran',
        'Badge exclusif "Famille Érudite"',
      ],
      current: profile?.plan === 'famille',
      buttonText: 'Sélectionner le Plan Famille',
      buttonStyle: 'border border-border bg-card text-muted-foreground hover:border-slate-500',
    },
    {
      id: 'etablissement',
      name: 'Plan Établissement',
      price: 'Sur devis',
      period: '/ classe ou école',
      description: 'Solution complète pour professeurs et écoles.',
      features: [
        'Comptes élèves illimités',
        'Portail enseignant & devoirs IA',
        'API dédiée & support prioritaire',
        'Conformité RGPD Éducation',
      ],
      current: profile?.plan === 'etablissement',
      buttonText: 'Contacter l\'équipe Éducation',
      buttonStyle: 'border border-border bg-card text-muted-foreground hover:border-slate-500',
    },
  ];

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12">
      
      {/* Top Header */}
      <div>
        <h1 className="font-heading text-3xl font-extrabold text-foreground">
          {t('my_profile')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('profile_subtitle')}
        </p>
      </div>

      {savedMsg && (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-center text-sm font-semibold text-emerald-300">
          ✓ {t('changes_saved')}
        </div>
      )}

      {/* Profile Form Section */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-border space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 font-bold text-lg">
            {displayName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">{displayName}</h2>
            <p className="text-xs text-muted-foreground">{t('age')}: {age} {t('years_old')}</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2">{t('display_name')}</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-xl border border-border bg-card/90 px-4 py-3 text-sm text-muted-foreground focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2">Âge ({age} ans)</label>
              <input
                type="number"
                min="5"
                max="25"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value) || 14)}
                className="w-full rounded-xl border border-border bg-card/90 px-4 py-3 text-sm text-muted-foreground focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Interests Grid Selection */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-3">
              Vos Centres d'Intérêt ({selectedInterests.length} sélectionnés) :
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {CATALOG_INTERESTS.map((item) => {
                const isSelected = selectedInterests.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleInterest(item.id)}
                    className={`flex items-center gap-2 rounded-xl p-2.5 text-left border text-xs transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-600/20 text-foreground font-semibold'
                        : 'border-border bg-card/40 text-muted-foreground hover:border-border'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-foreground shadow-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Enregistrement...' : 'Mettre à Jour mon Profil'}
          </button>
        </form>
      </div>

      {/* Subscription Plans Section */}
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-extrabold text-foreground">Formules & Tarifs</h2>
          <p className="text-xs text-muted-foreground mt-1">Choisissez le plan adapté à vos besoins d'apprentissage.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`glass-card rounded-3xl p-6 border flex flex-col justify-between space-y-6 relative ${
                plan.popular
                  ? 'border-indigo-500/60 bg-gradient-to-b from-indigo-950/40 to-slate-900 shadow-2xl shadow-indigo-500/10'
                  : 'border-border'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 px-3 py-0.5 text-[10px] font-bold text-foreground uppercase tracking-wider shadow-md">
                  Recommandé
                </div>
              )}

              <div>
                <h3 className="font-heading text-lg font-bold text-foreground mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 my-3">
                  <span className="font-heading text-3xl font-extrabold text-foreground">{plan.price}</span>
                  <span className="text-xs text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-xs text-muted-foreground min-h-[36px]">{plan.description}</p>

                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                className={`w-full rounded-2xl py-3 text-xs font-bold transition-all ${plan.buttonStyle}`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Section */}
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-extrabold text-foreground">Contact & Équipe</h2>
          <p className="text-xs text-muted-foreground mt-1">N'hésitez pas à nous contacter pour toute question ou suggestion.</p>
        </div>

        <div className="glass-card rounded-3xl p-6 border border-border grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Créateur</p>
                <p className="text-sm font-bold text-foreground">Ilyas Ramram</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-purple/10 text-brand-purple">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Équipe</p>
                <p className="text-sm font-bold text-foreground">Edukits</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/10 text-pink-500">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Instagram</p>
                <a href="https://www.instagram.com/edukits.ma?igsh=MW43ejkwaXEyeWtqZA==" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-foreground hover:text-pink-400 transition-colors">
                  @edukits.ma
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <a href="mailto:edukits5@gmail.com" className="text-sm font-bold text-foreground hover:text-emerald-400 transition-colors">
                  edukits5@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
