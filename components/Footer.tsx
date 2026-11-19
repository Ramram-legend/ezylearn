'use client';

import React from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export default function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="w-full mt-auto bg-muted/30 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">

        {/* 3-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">

          {/* Col 1 — Brand */}
          <div>
            <div className="flex items-center mb-4">
              <img 
                src="/logo.png" 
                alt="Easylearn Logo" 
                className="h-10 w-auto object-contain grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300" 
              />
            </div>
            <p className="text-sm leading-relaxed max-w-[220px] text-muted-foreground mt-2">
              {t('footer_desc')}
            </p>
          </div>

          {/* Col 2 — Navigation */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
              {t('navigation')}
            </p>
            <ul className="space-y-2.5">
              {[
                { href: '/dashboard', label: t('dashboard') },
                { href: '/lessons/generate', label: t('generate_a_lesson') },
                { href: '/badges', label: t('gamification') },
                { href: '/history', label: t('history') },
                { href: '/profile', label: t('profile') },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href}
                    className="text-sm text-muted-foreground transition-colors duration-200 hover:text-brand-blue"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Créateur */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
              {t('creator')}
            </p>
            <p className="text-sm font-semibold text-foreground">Ilyas Ramram</p>
            <a
              href="https://github.com/Ramram-legend"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Profil GitHub d’Ilyas Ramram (ouvre un nouvel onglet)"
              className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-brand-blue"
            >
              github.com/Ramram-legend
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            © {year} EasyLearn (Education Smart). {t('all_rights_reserved')}
          </p>
          <p className="text-xs flex items-center gap-1 text-muted-foreground">
            {t('made_with')} <Heart className="h-3 w-3 fill-pink-500 text-pink-500" /> {t('for_learners')}
          </p>
        </div>

      </div>
    </footer>
  );
}
