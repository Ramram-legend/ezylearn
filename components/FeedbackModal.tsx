'use client';

import React, { useState } from 'react';
import { X, Send, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { user, profile } = useAuth();
  
  const [name, setName] = useState(profile?.display_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setMessage('');
          onClose();
        }, 3000);
      } else {
        setError(data.error || "Une erreur est survenue lors de l'envoi.");
      }
    } catch (err) {
      setError('Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div className="w-full max-w-md bg-card border border-border shadow-2xl rounded-3xl overflow-hidden pointer-events-auto transform transition-all relative">
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-muted transition-colors z-10"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-purple/10 text-brand-purple">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold text-foreground">Envoyer un Feedback</h2>
                <p className="text-xs text-muted-foreground mt-1">Aidez-nous à améliorer EasyLearn !</p>
              </div>
            </div>

            {success ? (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="h-16 w-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground">Message envoyé !</h3>
                <p className="text-sm text-muted-foreground">Merci pour votre retour, notre équipe le lira très vite.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-500">
                    {error}
                  </div>
                )}
                
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Nom</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Votre nom"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-brand-purple focus:ring-1 focus:ring-brand-purple focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-brand-purple focus:ring-1 focus:ring-brand-purple focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Votre Message</label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Qu'aimeriez-vous nous dire ?"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-brand-purple focus:ring-1 focus:ring-brand-purple focus:outline-none transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-purple px-4 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-brand-purple/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Envoyer
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
