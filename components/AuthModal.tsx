'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, User, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalState = 'idle' | 'loading_google' | 'loading_email' | 'success' | 'error';

// Google SVG icon
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M47.532 24.552c0-1.636-.143-3.2-.41-4.704H24.48v8.897h12.974c-.56 3.017-2.255 5.573-4.804 7.286v6.055h7.776c4.55-4.19 7.106-10.36 7.106-17.534z" fill="#4285F4"/>
      <path d="M24.48 48c6.507 0 11.964-2.157 15.95-5.847l-7.776-6.055c-2.157 1.446-4.916 2.3-8.174 2.3-6.285 0-11.607-4.246-13.509-9.953H2.918v6.255C6.885 42.853 15.087 48 24.48 48z" fill="#34A853"/>
      <path d="M10.971 28.445A14.47 14.47 0 0 1 10.22 24c0-1.543.267-3.043.751-4.445v-6.255H2.918A23.965 23.965 0 0 0 .48 24c0 3.868.928 7.526 2.438 10.7l8.053-6.255z" fill="#FBBC05"/>
      <path d="M24.48 9.6c3.543 0 6.72 1.217 9.224 3.608l6.912-6.912C36.433 2.395 30.976 0 24.48 0 15.087 0 6.885 5.147 2.918 13.3l8.053 6.255C12.873 13.847 18.195 9.6 24.48 9.6z" fill="#EA4335"/>
    </svg>
  );
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const supabase = createClient();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [state, setState] = useState<ModalState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setState('idle');
      setErrorMsg('');
      setShowEmailForm(false);
      setEmail('');
      setDisplayName('');
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Focus email when form shown
  useEffect(() => {
    if (showEmailForm) {
      setTimeout(() => emailRef.current?.focus(), 80);
    }
  }, [showEmailForm]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setState('loading_google');
    setErrorMsg('');

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      setState('error');
      setErrorMsg(error.message);
    }
    // On success, browser redirects to Google — no further action needed
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!displayName.trim()) {
      setErrorMsg('Veuillez entrer votre prénom ou pseudo.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Veuillez entrer une adresse email valide.');
      return;
    }

    setState('loading_email');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), display_name: displayName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setState('error');
        setErrorMsg(data.error ?? "Une erreur est survenue. Réessaie.");
        return;
      }

      setState('success');
    } catch {
      setState('error');
      setErrorMsg('Erreur réseau. Vérifie ta connexion et réessaie.');
    }
  };

  const isLoading = state === 'loading_google' || state === 'loading_email';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="auth-modal-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />

      {/* Modal Card */}
      <div className="relative w-full max-w-md rounded-3xl border border-slate-700/60 bg-slate-900/95 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl overflow-hidden">

        {/* Gradient top bar */}
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-lg shadow-indigo-500/30">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 id="auth-modal-title" className="font-heading text-xl font-extrabold text-white">
                Rejoins EasyLearn
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Connexion rapide · Gratuit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {state === 'success' ? (
            /* Magic link success */
            <div className="flex flex-col items-center text-center py-6 gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Vérifie ta boîte email !</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Un lien magique a été envoyé à{' '}
                  <span className="font-semibold text-indigo-400">{email}</span>.
                  Clique dessus pour accéder à ton espace.
                </p>
              </div>
              <p className="text-xs text-slate-500">
                Pas d&apos;email ? Vérifie tes spams ou{' '}
                <button
                  onClick={() => { setState('idle'); setShowEmailForm(true); }}
                  className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                >
                  réessaie
                </button>.
              </p>
            </div>
          ) : !showEmailForm ? (
            /* Primary: Google OAuth */
            <div className="mt-4 space-y-4">
              {/* Google Button */}
              <button
                id="google-login-btn"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-slate-800 shadow-md hover:bg-slate-50 hover:scale-[1.01] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
              >
                {state === 'loading_google' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
                ) : (
                  <GoogleIcon />
                )}
                {state === 'loading_google' ? 'Redirection vers Google...' : 'Continuer avec Google'}
              </button>

              {/* Error */}
              {errorMsg && (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm text-rose-300">
                  {errorMsg}
                </div>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-xs text-slate-500 font-medium">ou</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>

              {/* Email fallback */}
              <button
                onClick={() => setShowEmailForm(true)}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/60 px-6 py-3 text-sm font-semibold text-slate-300 hover:border-slate-600 hover:text-white transition-all duration-200 disabled:opacity-50"
              >
                <Mail className="h-4 w-4 text-slate-400" />
                Continuer avec un email (lien magique)
              </button>

              <p className="text-center text-xs text-slate-500 pt-1">
                Aucune donnée partagée · Gratuit · Sans publicité
              </p>
            </div>
          ) : (
            /* Email magic link form */
            <form onSubmit={handleEmailSubmit} className="space-y-4 mt-4" noValidate>
              <button
                type="button"
                onClick={() => { setShowEmailForm(false); setState('idle'); setErrorMsg(''); }}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-1"
              >
                ← Retour
              </button>

              <div>
                <label htmlFor="auth-name" className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                  <User className="h-3.5 w-3.5 text-indigo-400" />
                  Ton prénom ou pseudo
                </label>
                <input
                  id="auth-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ex: Sara, Lucas, Alex..."
                  autoComplete="given-name"
                  disabled={isLoading}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-colors disabled:opacity-60"
                />
              </div>

              <div>
                <label htmlFor="auth-email" className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                  <Mail className="h-3.5 w-3.5 text-indigo-400" />
                  Ton adresse email
                </label>
                <input
                  ref={emailRef}
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="toi@exemple.com"
                  autoComplete="email"
                  disabled={isLoading}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-colors disabled:opacity-60"
                />
              </div>

              {errorMsg && (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm text-rose-300">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:opacity-90 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {state === 'loading_email' ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Envoi...</>
                ) : (
                  <><Sparkles className="h-4 w-4" />Envoyer mon lien magique</>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
