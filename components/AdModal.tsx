'use client';

import React, { useEffect, useState, useRef } from 'react';
import Script from 'next/script';
import { X, Clock, CheckCircle2, ShieldAlert, Sparkles, Loader2, Info } from 'lucide-react';

interface AdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardGranted: () => void;
}

type AdModalState = 'idle' | 'starting' | 'watching' | 'ready_to_claim' | 'claiming' | 'success' | 'error';

const ADSENSE_PUB_ID = 'ca-pub-7555332282799741';
const ADSENSE_SLOT_ID = '1234567890';

export default function AdModal({ isOpen, onClose, onRewardGranted }: AdModalProps) {
  const [modalState, setModalState] = useState<AdModalState>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [errorMessage, setErrorMessage] = useState('');
  const [adBlockedOrFailed, setAdBlockedOrFailed] = useState(false);
  const adPushedRef = useRef(false);

  // Initialize session when modal opens
  useEffect(() => {
    if (!isOpen) {
      setModalState('idle');
      setSessionId(null);
      setTimeLeft(20);
      setErrorMessage('');
      setAdBlockedOrFailed(false);
      adPushedRef.current = false;
      return;
    }

    const startSession = async () => {
      setModalState('starting');
      setErrorMessage('');
      setAdBlockedOrFailed(false);

      try {
        const res = await fetch('/api/credits/watch-ad/start', { method: 'POST' });
        const data = await res.json();

        if (res.ok && data.sessionId) {
          setSessionId(data.sessionId);
        } else if (data.error && data.error.includes('Plafond')) {
          throw new Error(data.error);
        } else {
          setSessionId(`fallback-session-${Date.now()}`);
          setAdBlockedOrFailed(true);
        }

        setTimeLeft(20);
        setModalState('watching');
      } catch (err: any) {
        console.error(err);
        if (err.message && err.message.includes('Plafond')) {
          setErrorMessage(err.message);
          setModalState('error');
        } else {
          setSessionId(`fallback-session-${Date.now()}`);
          setAdBlockedOrFailed(true);
          setTimeLeft(20);
          setModalState('watching');
        }
      }
    };

    startSession();
  }, [isOpen]);

  // Countdown timer when watching (always runs regardless of ad display success)
  useEffect(() => {
    if (modalState !== 'watching') return;

    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setModalState('ready_to_claim');
    }
  }, [modalState, timeLeft]);

  // Push AdSense ad unit when watching state is reached
  useEffect(() => {
    if (modalState === 'watching' && !adPushedRef.current) {
      adPushedRef.current = true;
      try {
        if (typeof window !== 'undefined') {
          if ((window as any).adsbygoogle) {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          } else {
            // AdSense script is blocked or missing (AdBlocker)
            setAdBlockedOrFailed(true);
          }
        }
      } catch (err) {
        console.warn('AdSense push notice (fallback activated):', err);
        setAdBlockedOrFailed(true);
      }
    }
  }, [modalState]);

  // Handle claiming the reward from backend
  const handleClaimCredit = async () => {
    if (!sessionId || modalState !== 'ready_to_claim') return;

    setModalState('claiming');
    setErrorMessage('');

    try {
      const res = await fetch('/api/credits/watch-ad/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la validation du crédit.');
      }

      setModalState('success');
      onRewardGranted();

      // Auto close after 2.5 seconds on success
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Erreur lors de la réclamation du crédit.');
      setModalState('error');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Script AdSense avec détection d'erreur */}
      <Script
        id="adsense-init-modal"
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUB_ID}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
        onError={() => setAdBlockedOrFailed(true)}
      />

      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <div className="relative w-full max-w-lg rounded-3xl border border-slate-700/60 bg-slate-900/95 shadow-2xl shadow-indigo-500/10 overflow-hidden flex flex-col">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80">
            <div className="flex items-center gap-2">
              {modalState === 'watching' && (
                <>
                  <Clock className="h-5 w-5 text-indigo-400 animate-pulse" />
                  <span className="font-bold text-sm text-slate-200">Visionnez l&apos;annonce ({timeLeft}s)</span>
                </>
              )}
              {modalState === 'ready_to_claim' && (
                <>
                  <Sparkles className="h-5 w-5 text-amber-400 animate-bounce" />
                  <span className="font-bold text-sm text-amber-400">Temps écoulé ! Réclamez votre crédit</span>
                </>
              )}
              {modalState === 'success' && (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span className="font-bold text-sm text-emerald-400">Crédit +1 ajouté !</span>
                </>
              )}
              {(modalState === 'starting' || modalState === 'claiming') && (
                <>
                  <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
                  <span className="font-bold text-sm text-slate-300">Traitement en cours...</span>
                </>
              )}
              {modalState === 'error' && (
                <span className="font-bold text-sm text-rose-400">Une erreur est survenue</span>
              )}
            </div>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Ad Container & Main Body */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[280px] bg-slate-950 relative">
            {modalState === 'starting' && (
              <div className="flex flex-col items-center gap-3 py-12 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <p className="text-sm font-medium">Préparation de votre session publicitaire...</p>
              </div>
            )}

            {modalState === 'error' && (
              <div className="flex flex-col items-center text-center p-6 gap-3">
                <div className="rounded-full bg-rose-500/10 p-3 text-rose-400 border border-rose-500/20">
                  <X className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-rose-300">{errorMessage}</p>
                <button
                  onClick={onClose}
                  className="mt-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
                >
                  Fermer
                </button>
              </div>
            )}

            {modalState === 'success' && (
              <div className="flex flex-col items-center text-center py-10 gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 animate-in zoom-in">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Bravo !</h3>
                  <p className="text-sm text-slate-400 mt-1">1 crédit bonus a été crédité sur votre compte.</p>
                </div>
              </div>
            )}

            {(modalState === 'watching' || modalState === 'ready_to_claim' || modalState === 'claiming') && (
              <div className="w-full flex flex-col items-center">
                {/* AdSense Unit or Fallback */}
                <div className="w-full min-h-[250px] bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden flex flex-col items-center justify-center relative p-4">
                  {adBlockedOrFailed ? (
                    <div className="flex flex-col items-center justify-center text-center gap-3 p-6">
                      <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Info className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-200">Publicité non chargée / Bloqueur actif</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-xs">
                          Pas de souci ! Patientez simplement la fin du minuteur pour obtenir votre crédit.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <ins
                      className="adsbygoogle"
                      style={{ display: 'block', width: '100%', minHeight: '250px' }}
                      data-ad-client={ADSENSE_PUB_ID}
                      data-ad-slot={ADSENSE_SLOT_ID}
                      data-ad-format="auto"
                      data-full-width-responsive="true"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldAlert className="h-4 w-4 text-indigo-400 shrink-0" />
              <p className="text-[11px] leading-tight">Le crédit vous est offert une fois le délai écoulé.</p>
            </div>

            {/* Action button */}
            <div className="w-full sm:w-auto">
              {modalState === 'watching' && (
                <button
                  disabled
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold border border-slate-700 cursor-not-allowed opacity-80"
                >
                  <Clock className="h-4 w-4 animate-spin text-indigo-400" />
                  Attente : {timeLeft}s
                </button>
              )}

              {(modalState === 'ready_to_claim' || modalState === 'claiming') && (
                <button
                  onClick={handleClaimCredit}
                  disabled={modalState === 'claiming'}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-500/25 transition-all duration-200 animate-pulse disabled:opacity-50"
                >
                  {modalState === 'claiming' ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Validation...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 text-amber-300" /> Récupérer mon crédit</>
                  )}
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
