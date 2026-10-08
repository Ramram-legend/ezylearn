'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LessonError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Lesson error boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-2xl shadow-xl border border-border p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">Erreur de chargement</h2>
          <p className="text-muted-foreground text-sm">
            Impossible de charger cette leçon. Veuillez réessayer ou retourner au tableau de bord.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-blue text-white px-6 py-2.5 rounded-xl font-bold hover:bg-brand-blue/90 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-muted text-foreground px-6 py-2.5 rounded-xl font-bold hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Tableau de Bord
          </button>
        </div>
      </div>
    </div>
  );
}
