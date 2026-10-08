import type { Metadata } from 'next';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthProvider from '@/components/AuthProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { LanguageProvider } from '@/hooks/useLanguage';

export const metadata: Metadata = {
  title: 'EasyLearn — Plateforme d\'apprentissage adaptatif par IA',
  description: 'Générez des leçons interactives sur-mesure avec schémas animés SVG, explications adaptées à votre âge et quiz personnalisés.',
  keywords: ['éducation', 'IA', 'apprentissage adaptatif', 'leçons', 'quiz', 'gamification', 'claude', 'supabase'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'EasyLearn',
  },
  openGraph: {
    title: 'EasyLearn — Apprendre autrement avec l\'IA',
    description: 'Des leçons personnalisées générées par IA, adaptées à chaque apprenant.',
    type: 'website',
    locale: 'fr_FR',
  },
};

import AIAssistant from '@/components/AIAssistant';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* PWA meta tags (F6) */}
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/logo.png" />
        {/* Google AdSense (Auto Ads & Rewarded) - beforeInteractive to stay in head */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7555332282799741"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
      </head>
      <body className="flex min-h-screen flex-col antialiased bg-background text-foreground transition-colors duration-300">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <AuthProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
              <AIAssistant />
            </AuthProvider>
          </LanguageProvider>
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
