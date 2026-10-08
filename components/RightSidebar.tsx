'use client';

import React from 'react';
import { X, Moon, Sun, Globe, Check, RefreshCw } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/hooks/useLanguage';
import FeedbackModal from './FeedbackModal';

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RightSidebar({ isOpen, onClose }: RightSidebarProps) {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [mounted, setMounted] = React.useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleResetDemo = () => {
    if (window.confirm(t('reset_demo_confirm'))) {
      localStorage.removeItem('easylearn_demo_profile');
      localStorage.removeItem('easylearn_demo_stats');
      localStorage.removeItem('easylearn_demo_lessons');
      localStorage.removeItem('easylearn_demo_badges');
      window.location.href = '/';
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-[70] w-full max-w-sm bg-background shadow-2xl border-l border-border transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            {t('settings')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Language Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t('language')}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setLanguage('fr')}
                className={`relative flex items-center justify-center p-3 rounded-xl border font-semibold transition-all ${
                  language === 'fr'
                    ? 'border-brand-blue bg-brand-blue/10 text-brand-blue'
                    : 'border-border bg-background text-foreground hover:border-brand-blue/50 hover:bg-muted'
                }`}
              >
                {t('french')}
                {language === 'fr' && (
                  <Check className="absolute top-2 right-2 h-3 w-3" />
                )}
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`relative flex items-center justify-center p-3 rounded-xl border font-semibold transition-all ${
                  language === 'en'
                    ? 'border-brand-blue bg-brand-blue/10 text-brand-blue'
                    : 'border-border bg-background text-foreground hover:border-brand-blue/50 hover:bg-muted'
                }`}
              >
                {t('english')}
                {language === 'en' && (
                  <Check className="absolute top-2 right-2 h-3 w-3" />
                )}
              </button>
              <button
                onClick={() => setLanguage('ar')}
                className={`relative flex items-center justify-center p-3 rounded-xl border font-semibold transition-all ${
                  language === 'ar'
                    ? 'border-brand-blue bg-brand-blue/10 text-brand-blue'
                    : 'border-border bg-background text-foreground hover:border-brand-blue/50 hover:bg-muted'
                }`}
              >
                {t('arabic')}
                {language === 'ar' && (
                  <Check className="absolute top-2 right-2 h-3 w-3" />
                )}
              </button>
            </div>
          </div>

          {/* Theme Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              {t('theme')}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTheme('light')}
                className={`relative flex items-center justify-center p-3 rounded-xl border font-semibold transition-all ${
                  theme === 'light'
                    ? 'border-brand-yellow bg-brand-yellow/10 text-brand-yellow'
                    : 'border-border bg-background text-foreground hover:border-brand-yellow/50 hover:bg-muted'
                }`}
              >
                {t('light_mode')}
                {theme === 'light' && (
                  <Check className="absolute top-2 right-2 h-3 w-3" />
                )}
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`relative flex items-center justify-center p-3 rounded-xl border font-semibold transition-all ${
                  theme === 'dark'
                    ? 'border-brand-blue bg-brand-blue/10 text-brand-blue'
                    : 'border-border bg-background text-foreground hover:border-brand-blue/50 hover:bg-muted'
                }`}
              >
                {t('dark_mode')}
                {theme === 'dark' && (
                  <Check className="absolute top-2 right-2 h-3 w-3" />
                )}
              </button>
            </div>
          </div>

          {/* Reset Demo Data */}
          <div className="pt-6 border-t border-border">
            <button
              onClick={handleResetDemo}
              className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20"
            >
              <RefreshCw className="h-4 w-4" />
              {t('reset_demo')}
            </button>
          </div>

          {/* Contact Section */}
          <div className="pt-6 border-t border-border space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {t('contact_team')}
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => setIsFeedbackOpen(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20 px-4 py-2.5 text-sm font-bold transition-colors"
              >
                {t('send_message_team')}
              </button>

              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-muted-foreground">{t('creator')}</span>
                <span className="text-sm font-bold text-foreground">Ilyas Ramram</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{t('team')}</span>
                <span className="text-sm font-bold text-foreground">Edukits</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Instagram</span>
                <a href="https://www.instagram.com/edukits.ma?igsh=MW43ejkwaXEyeWtqZA==" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-brand-blue hover:underline">
                  @edukits.ma
                </a>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Email</span>
                <a href="mailto:edukits5@gmail.com" className="text-sm font-bold text-brand-blue hover:underline">
                  edukits5@gmail.com
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      {/* Modale de Feedback */}
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </>
  );
}
