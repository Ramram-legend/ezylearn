import { Sparkles } from 'lucide-react';

export default function LessonLoading() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-blue/10">
        <Sparkles className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-bold text-foreground">Chargement de votre leçon...</h2>
        <p className="text-sm text-muted-foreground">Préparation des contenus magiques ✨</p>
      </div>
      
      {/* Skeletons to mimic content */}
      <div className="w-full max-w-3xl space-y-4 px-4 pt-8">
        <div className="h-8 w-3/4 rounded-lg bg-muted/60 animate-pulse" />
        <div className="h-4 w-1/4 rounded-lg bg-muted/60 animate-pulse" />
        <div className="mt-8 space-y-3">
          <div className="h-4 w-full rounded bg-muted/60 animate-pulse" />
          <div className="h-4 w-full rounded bg-muted/60 animate-pulse" />
          <div className="h-4 w-5/6 rounded bg-muted/60 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
