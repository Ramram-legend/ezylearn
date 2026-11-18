import {
  Baby,
  BookOpen,
  Brain,
  Bot,
  Clapperboard,
  Code2,
  Crown,
  Flame,
  FlaskConical,
  Gamepad2,
  GraduationCap,
  Globe,
  Leaf,
  Music2,
  Palette,
  Rocket,
  ScrollText,
  Sparkles,
  Sprout,
  Target,
  Telescope,
  Trophy,
  UserRound,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const platformIcons: Record<string, { icon: LucideIcon; color: string }> = {
  gaming: { icon: Gamepad2, color: 'text-violet-600' },
  space: { icon: Rocket, color: 'text-indigo-600' },
  coding: { icon: Code2, color: 'text-blue-600' },
  biology: { icon: Leaf, color: 'text-emerald-600' },
  art: { icon: Palette, color: 'text-pink-600' },
  music: { icon: Music2, color: 'text-fuchsia-600' },
  history: { icon: ScrollText, color: 'text-amber-600' },
  sports: { icon: Trophy, color: 'text-orange-600' },
  robotics: { icon: Bot, color: 'text-cyan-700' },
  cinema: { icon: Clapperboard, color: 'text-rose-600' },
  chemistry: { icon: FlaskConical, color: 'text-teal-600' },
  environment: { icon: Globe, color: 'text-green-700' },
  first_lesson: { icon: BookOpen, color: 'text-blue-600' },
  streak_3: { icon: Flame, color: 'text-orange-600' },
  perfect_quiz: { icon: Target, color: 'text-violet-600' },
  perfect_score: { icon: Target, color: 'text-violet-600' },
  lessons_5: { icon: Rocket, color: 'text-cyan-700' },
  streak_7: { icon: Zap, color: 'text-amber-600' },
  lessons_10: { icon: Crown, color: 'text-amber-600' },
  lessons_50: { icon: Trophy, color: 'text-amber-600' },
  beginner: { icon: Sprout, color: 'text-emerald-600' },
  apprentice: { icon: BookOpen, color: 'text-blue-600' },
  explorer: { icon: Telescope, color: 'text-violet-600' },
  scholar: { icon: Brain, color: 'text-amber-600' },
  savant: { icon: Zap, color: 'text-orange-600' },
  master: { icon: Trophy, color: 'text-amber-600' },
  child: { icon: Baby, color: 'text-emerald-600' },
  teen: { icon: GraduationCap, color: 'text-indigo-600' },
  adult: { icon: UserRound, color: 'text-violet-600' },
  'quest-lesson-today': { icon: BookOpen, color: 'text-blue-600' },
  'quest-perfect-quiz': { icon: Target, color: 'text-violet-600' },
  'quest-streak': { icon: Flame, color: 'text-orange-600' },
  'quest-xp-today': { icon: Zap, color: 'text-amber-600' },
  football: { icon: Trophy, color: 'text-orange-600' },
  animals: { icon: Leaf, color: 'text-emerald-600' },
  tech: { icon: Bot, color: 'text-cyan-700' },
  cooking: { icon: FlaskConical, color: 'text-rose-600' },
  science: { icon: Telescope, color: 'text-violet-600' },
  nature: { icon: Leaf, color: 'text-green-700' },
  arts: { icon: Palette, color: 'text-pink-600' },
};

interface PlatformIconProps {
  name: string;
  className?: string;
}

export function PlatformIcon({ name, className = 'h-5 w-5' }: PlatformIconProps) {
  const { icon: Icon, color } = platformIcons[name] ?? {
    icon: Sparkles,
    color: 'text-indigo-600',
  };

  return <Icon aria-hidden="true" className={`${className} ${color}`} strokeWidth={1.8} />;
}
