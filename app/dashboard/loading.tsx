import { Sparkles } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-blue/10">
        <Sparkles className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-bold text-foreground">Chargement de votre tableau de bord...</h2>
        <p className="text-sm text-muted-foreground">Préparation de vos statistiques et leçons ✨</p>
      </div>
      
      {/* Dashboard Grid Skeleton */}
      <div className="w-full max-w-5xl px-4 pt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-32 rounded-xl bg-muted/60 animate-pulse" />
        <div className="h-32 rounded-xl bg-muted/60 animate-pulse" />
        <div className="h-32 rounded-xl bg-muted/60 animate-pulse" />
      </div>
    </div>
  );
}
