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
  metadataBase: new URL('https://www.ezylearn.world'),
  applicationName: 'EasyLearn',
  title: 'EasyLearn | Leçons interactives et quiz personnalisés par IA',
  description: 'Apprenez chaque sujet avec des leçons interactives créées par l’IA, des explications adaptées à votre âge et des quiz personnalisés. Commencez gratuitement sur EasyLearn.',
  keywords: ['apprentissage en ligne', 'leçons interactives', 'apprendre avec l’IA', 'quiz éducatifs', 'apprentissage adaptatif'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'EasyLearn',
  },
  openGraph: {
    title: 'EasyLearn | Leçons interactives et quiz personnalisés par IA',
    description: 'Apprenez chaque sujet avec des leçons interactives créées par l’IA, des explications adaptées à votre âge et des quiz personnalisés.',
    type: 'website',
    locale: 'fr_FR',
    siteName: 'EasyLearn',
  },
  twitter: {
    card: 'summary',
    title: 'EasyLearn | Leçons interactives et quiz personnalisés par IA',
    description: 'Des leçons interactives créées par l’IA, adaptées à votre âge, avec quiz personnalisés.',
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
