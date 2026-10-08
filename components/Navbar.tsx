'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Sparkles, Flame, Award, User, Menu, X, PlusCircle, History, LayoutDashboard, LogIn, LogOut, Sun, Moon, Settings
} from 'lucide-react';
import { getDemoStats, getDemoProfile } from '@/lib/demo-engine';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import RightSidebar from '@/components/RightSidebar';

export default function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const { user, profile, stats, openLogin, signOut, loading } = useAuth();
  const { t } = useLanguage();

  const [demoStats, setDemoStats] = useState({ total_xp: 50, current_streak: 1 });
  const [demoName, setDemoName] = useState(t('learner'));

  // Prevent hydration mismatch for theme toggle
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user) {
      const updateDemoState = () => {
        const s = getDemoStats();
        setDemoStats({ total_xp: s.total_xp, current_streak: s.current_streak });
        const p = getDemoProfile();
        if (p?.display_name) setDemoName(p.display_name);
      };
      
      updateDemoState();
      window.addEventListener('demoStatsUpdated', updateDemoState);
      return () => window.removeEventListener('demoStatsUpdated', updateDemoState);
    }
  }, [pathname, user]);

  const displayName = profile?.display_name ?? (user ? user.email?.split('@')[0] : demoName) ?? t('learner');
  const xp = user && stats ? stats.total_xp : demoStats.total_xp;
  const streak = user && stats ? stats.current_streak : demoStats.current_streak;

  const navLinks = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/lessons/generate', label: t('generate'), icon: PlusCircle },
    { href: '/badges', label: t('badges_xp'), icon: Award },
    { href: '/history', label: t('history'), icon: History },
    { href: '/profile', label: t('profile'), icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b border-border transition-colors duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0 py-1">
          <img 
            src="/logo.png" 
            alt="Easylearn Logo" 
            className="h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105" 
          />
        </Link>

        {/* ── Desktop Nav Links ── */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 relative group/link 
                  ${isActive ? 'text-brand-blue bg-brand-blue/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              >
                <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-brand-blue' : 'currentColor'}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* ── Right Side ── */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Settings Button */}
          {mounted && (
            <button
              onClick={() => setRightSidebarOpen(true)}
              className="h-9 w-9 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mr-1"
              aria-label={t('settings')}
            >
              <Settings className="h-4 w-4" />
            </button>
          )}

          {/* Streak */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-yellow/10 border border-brand-yellow/30 text-brand-yellow text-xs font-bold" title={t('active_streak')}>
            <Flame className="h-3.5 w-3.5 animate-pulse" />
            <span>{streak} {t('days')}</span>
          </div>

          {/* XP */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-blue/10 border border-brand-blue/30 text-brand-blue text-xs font-bold" title="Points XP">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{xp} XP</span>
          </div>

          {/* Auth */}
          {!loading && (
            user ? (
              <div className="flex items-center gap-1.5 ml-2">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium border border-border hover:border-brand-blue transition-colors bg-card"
                >
                  <div className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-black text-white bg-brand-blue">
                    {displayName.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="hidden lg:inline max-w-[90px] truncate text-foreground">{displayName}</span>
                </Link>
                <button
                  onClick={() => signOut()}
                  title={t('logout')}
                  className="h-9 w-9 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                id="navbar-login-btn"
                onClick={openLogin}
                className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-white ml-2 transition-all duration-200 bg-brand-blue hover:bg-brand-blue/90 shadow-md shadow-brand-blue/20 hover:-translate-y-0.5"
              >
                <LogIn className="h-3.5 w-3.5" />
                {t('login')}
              </button>
            )
          )}
        </div>

        {/* ── Mobile Hamburger & Settings ── */}
        <div className="md:hidden flex items-center gap-2">
          {mounted && (
            <button
              onClick={() => setRightSidebarOpen(true)}
              className="h-9 w-9 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            >
              <Settings className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-muted/50 text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Menu mobile"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Drawer ── */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-6 space-y-1 bg-background border-t border-border shadow-xl">
          {/* Mobile stats row */}
          <div className="flex items-center gap-2 py-3 mb-2 border-b border-border">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-yellow/10 border border-brand-yellow/30 text-brand-yellow text-xs font-bold">
              <Flame className="h-3.5 w-3.5" />
              <span>{streak} {t('days')}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-blue/10 border border-brand-blue/30 text-brand-blue text-xs font-bold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{xp} XP</span>
            </div>
          </div>

          {/* Nav links */}
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive 
                      ? 'text-brand-blue bg-brand-blue/10 border-l-2 border-brand-blue' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground border-l-2 border-transparent'
                  }`}
                >
                  <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-brand-blue' : 'currentColor'}`} />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile auth */}
          <div className="pt-4 mt-2 border-t border-border">
            {user ? (
              <button
                onClick={() => { signOut(); setMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20"
              >
                <LogOut className="h-4 w-4" />
                {t('logout')} ({displayName})
              </button>
            ) : (
              <button
                onClick={() => { openLogin(); setMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white bg-brand-blue shadow-md shadow-brand-blue/20"
              >
                <LogIn className="h-4 w-4" />
                {t('login')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Settings Right Sidebar ── */}
      <RightSidebar 
        isOpen={rightSidebarOpen} 
        onClose={() => setRightSidebarOpen(false)} 
      />
    </header>
  );
}
