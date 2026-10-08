'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sparkles, ArrowLeft, CheckCircle2, XCircle, Award, Flame, Lightbulb, BookOpen, ArrowRight, HelpCircle, Globe, Maximize2, X, Image as ImageIcon, Volume2, VolumeX, MessageSquare, Send, Bot } from 'lucide-react';
import { getDemoLessons, getDemoStats, saveDemoStats, saveDemoEarnedBadge, saveDemoLesson, continueDemoLesson, getDemoProfile } from '@/lib/demo-engine';
import { computeStreakUpdate } from '@/lib/gamification';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import type { Lesson, UserStats, Badge, LessonWebPhoto } from '@/types/database';
import { fetchWebPhotosForTopic } from '@/lib/web-photo';
import confetti from 'canvas-confetti';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import InteractiveVisualizer from '@/components/InteractiveVisualizer';
import InteractiveSvg from '@/components/InteractiveSvg';
import ConceptAnimator from '@/components/ConceptAnimator';

function getLessonPhotoUrl(lesson: Lesson): string {
  if (lesson.content.web_photo?.url) {
    return lesson.content.web_photo.url;
  }
  const topicLower = (lesson.topic + ' ' + lesson.subject).toLowerCase();
  if (topicLower.includes('bio') || topicLower.includes('cell') || topicLower.includes('atp') || topicLower.includes('adn') || topicLower.includes('gradient')) {
    return 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80';
  }
  if (topicLower.includes('espac') || topicLower.includes('astron') || topicLower.includes('planete') || topicLower.includes('etoil')) {
    return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80';
  }
  if (topicLower.includes('histoir') || topicLower.includes('romain') || topicLower.includes('egypt') || topicLower.includes('guer')) {
    return 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=800&q=80';
  }
  if (topicLower.includes('math') || topicLower.includes('physic') || topicLower.includes('chimie') || topicLower.includes('scienc')) {
    return 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=800&q=80';
  }
  if (topicLower.includes('jeu') || topicLower.includes('informatiq') || topicLower.includes('code') || topicLower.includes('ai') || topicLower.includes('ia')) {
    return 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80';
  }
  return 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80';
}

export default function LessonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.id as string;
  const { refreshStats } = useAuth();
  const { language } = useLanguage();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [userAnswers, setUserAnswers] = useState<number[]>([-1, -1, -1]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    total: number;
    xpEarned: number;
    isPerfect: boolean;
    correctAnswers: number[];
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [continueError, setContinueError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<LessonWebPhoto | null>(null);
  const [mainPhotoError, setMainPhotoError] = useState(false);

  // Feature 1: TTS
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlayAudio = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !lesson) return;
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }
    const textToRead = `${lesson.content.title}. ${lesson.content.explanation}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.9;
    utterance.onend = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
  }, [isPlayingAudio, lesson]);

  useEffect(() => {
    // 1. Try local Demo Engine first
    const demoLessons = getDemoLessons();
    const foundLocal = demoLessons.find((l) => l.id === lessonId);
    if (foundLocal) {
      setLesson(foundLocal);
      setLoading(false);
      return;
    }

    // 2. Fetch from backend API
    fetch(`/api/lessons/${lessonId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.lesson) {
          setLesson(data.lesson);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [lessonId]);

  // Dynamic Web Photo Search & Import (fetches photos from Web based on lesson title)
  useEffect(() => {
    if (!lesson) return;
    const hasIllustrativePhotos = lesson.content.illustrative_photos && lesson.content.illustrative_photos.length > 0;
    const hasCustomWebPhoto = lesson.content.web_photo?.source && !lesson.content.web_photo.source.includes('référence');

    if (!hasIllustrativePhotos || !hasCustomWebPhoto) {
      fetchWebPhotosForTopic(lesson.topic, lesson.subject).then((res) => {
        if (res.illustrative_photos.length > 0 || res.web_photo) {
          setLesson((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              content: {
                ...prev.content,
                web_photo: prev.content.web_photo?.url && !prev.content.web_photo.url.includes('unsplash.com/photo-1518709268805') 
                  ? prev.content.web_photo 
                  : res.web_photo,
                illustrative_photos: res.illustrative_photos,
              },
            };
          });
        }
      }).catch(() => {});
    }
  }, [lesson?.id, lesson?.topic]);

  // Extract all markdown images from sections
  const markdownImages = React.useMemo(() => {
    const images: { url: string, alt: string }[] = [];
    if (lesson?.content?.sections) {
      lesson.content.sections.forEach(sec => {
        const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
        let match;
        while ((match = regex.exec(sec.body_markdown)) !== null) {
          images.push({ alt: match[1] || lesson.topic, url: match[2] });
        }
      });
    }
    return images;
  }, [lesson]);

  const handleSelectOption = useCallback((questionIndex: number, optionIndex: number) => {
    if (isSubmitted) return;
    setUserAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[questionIndex] = optionIndex;
      return newAnswers;
    });
  }, [isSubmitted]);

  const handleContinueLesson = useCallback(async () => {
    if (!lesson) return;
    setIsContinuing(true);
    setContinueError(null);

    const demoProfile = getDemoProfile();

    try {
      const res = await fetch('/api/lessons/continue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: lesson.id,
          age: demoProfile?.age,
          interests: demoProfile?.interests,
          language,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.lesson?.id.startsWith('lesson-guest-')) {
          saveDemoLesson(data.lesson);
        }
        router.push(`/lessons/${data.lesson.id}`);
        return;
      } else {
        const errData = await res.json().catch(() => ({}));
        if (errData.error) {
          setContinueError(errData.error);
        }
      }
    } catch {}

    // Fallback to local demo engine
    try {
      const created = continueDemoLesson(lesson);
      router.push(`/lessons/${created.id}`);
    } catch (e) {
      setIsContinuing(false);
      setContinueError("Impossible de générer le chapitre suivant.");
    }
  }, [lesson, language, router]);

  const handleSubmitQuiz = useCallback(async () => {
    if (!lesson || userAnswers.includes(-1)) return;
    setIsSubmitting(true);

    // Try backend API first
    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson.id, answers: userAnswers }),
      });

      if (res.ok) {
        const data = await res.json();
        setQuizResult(data);
        setIsSubmitted(true);
        setIsSubmitting(false);

        if (data.isPerfect || data.score > 0) {
          triggerConfetti();
        }
        
        await refreshStats();
        return;
      }
    } catch {}

    // Local Demo Engine Submission Calculation
    const correctAnswers = lesson.quiz.map((q) => q.correct_index);
    const score = userAnswers.reduce((acc, ans, i) => acc + (ans === correctAnswers[i] ? 1 : 0), 0);
    const total = lesson.quiz.length;
    const isPerfect = score === total;
    const xpEarned = score * 20 + (isPerfect ? 30 : 0);

    const stats = getDemoStats();
    const streakUpdate = computeStreakUpdate(stats.last_activity_date, stats.current_streak);

    const updatedStats: UserStats = {
      ...stats,
      total_xp: stats.total_xp + xpEarned,
      quizzes_completed: stats.quizzes_completed + 1,
      lessons_completed: stats.lessons_completed + 1,
      current_streak: streakUpdate.current_streak,
      last_activity_date: streakUpdate.last_activity_date,
    };
    saveDemoStats(updatedStats);

    // Check badges
    if (isPerfect) {
      saveDemoEarnedBadge('badge-3'); // Master Quiz
    }
    saveDemoEarnedBadge('badge-1'); // First lesson

    setQuizResult({
      score,
      total,
      xpEarned,
      isPerfect,
      correctAnswers,
    });
    setIsSubmitted(true);
    setIsSubmitting(false);

    if (score > 0) {
      triggerConfetti();
    }
  }, [lesson, userAnswers, refreshStats]);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-brand-blue">
          <Sparkles className="h-6 w-6 animate-spin" />
          <span className="text-sm font-medium">Chargement de votre leçon...</span>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Leçon Introuvable</h2>
        <p className="text-sm text-muted-foreground mb-6">Cette leçon a été supprimée ou n'a pas encore été générée.</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="btn-primary"
        >
          Retour au tableau de bord
        </button>
      </div>
    );
  }

  const chapterIndex = lesson?.content?.chapter_index || 1;
  const totalChapters = lesson?.content?.total_chapters || 4;
  const isCompleted = lesson?.content?.is_completed || chapterIndex >= totalChapters;
  const progressPercent = Math.round((chapterIndex / totalChapters) * 100);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      {/* Top Bar with Chapter Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au tableau de bord
          </button>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="rounded-md bg-brand-blue/10 px-3 py-1 text-brand-blue border border-brand-blue/20 font-extrabold flex items-center gap-1.5 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Chapitre {chapterIndex} / {totalChapters}
            </span>
            <span className="rounded-md bg-muted px-2.5 py-1 text-foreground border border-border font-semibold">
              {lesson.subject}
            </span>
            <span className="rounded-md bg-brand-blue/5 px-2.5 py-1 text-foreground border border-border font-semibold">
              Niveau {lesson.level}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted/60 h-2.5 rounded-full overflow-hidden border border-border/40 p-0.5">
          <div 
            className="bg-gradient-to-r from-brand-blue to-purple-500 h-full transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Lesson Header Title */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
            {lesson.content.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium">
            Généré le {new Date(lesson.created_at).toLocaleDateString('fr-FR')}
          </p>
        </div>
        
        {/* TTS Button */}
        <button
          onClick={handlePlayAudio}
          className={`shrink-0 flex items-center justify-center h-12 w-12 rounded-full shadow-sm transition-all ${
            isPlayingAudio 
              ? 'bg-brand-blue text-white animate-pulse' 
              : 'bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20'
          }`}
          aria-label="Écouter la leçon"
          title="Écouter la leçon"
        >
          {isPlayingAudio ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
        </button>
      </div>

      {/* Structured Content Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Explanation (2 cols) */}
        <div className="md:col-span-2 space-y-6">

          {/* Previous Chapter Summary Card */}
          {lesson.content.previous_summary && (
            <div className="card p-5 bg-brand-blue/5 border-brand-blue/20 space-y-2">
              <div className="flex items-center gap-2 text-brand-blue font-bold text-sm">
                <BookOpen className="h-4 w-4" />
                <span>📌 Synthèse des acquis précédents</span>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed font-medium">
                {lesson.content.previous_summary}
              </p>
            </div>
          )}

          {/* Mini-Jeu Interactif (ConceptAnimator) — priorité sur le SVG */}
          {lesson.content.animation_data ? (
            <ConceptAnimator data={lesson.content.animation_data} />
          ) : lesson.content.svg ? (
            <InteractiveSvg svgContent={lesson.content.svg} />
          ) : null}

          <div className="card p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2 text-brand-blue font-bold text-lg">
                <BookOpen className="h-5 w-5" />
                <h2>Introduction Sur-Mesure</h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-blue bg-brand-blue/10 border border-brand-blue/20 px-3 py-1.5 rounded-full">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Adaptée selon vos centres d'intérêt</span>
              </div>
            </div>
            
            <p className="text-base text-foreground leading-relaxed font-medium">
              {lesson.content.explanation}
            </p>
          </div>

          {/* New Interactive Sections Memoized */}
          {React.useMemo(() => {
            if (!lesson.content.sections || lesson.content.sections.length === 0) return null;
            return (
              <div className="space-y-6">
                {lesson.content.sections.map((section, idx) => {
                  const bodyWithoutImages = section.body_markdown.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '');
                  return (
                    <div key={idx} className="card p-6 sm:p-8 space-y-4 overflow-hidden">
                      <h3 className="font-bold text-xl text-foreground flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-blue text-white text-sm shrink-0">
                          {idx + 1}
                        </span>
                        {section.heading}
                      </h3>
                      
                      <div className="prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-a:text-brand-blue prose-p:text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-li:text-foreground text-foreground">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm, remarkMath]} 
                          rehypePlugins={[rehypeKatex]}
                        >
                          {bodyWithoutImages}
                        </ReactMarkdown>
                      </div>

                      {section.visualization && (
                        <InteractiveVisualizer visualization={section.visualization} />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          }, [lesson.content.sections])}

          {/* Fallback for old Visual Steps format */}
          {!lesson.content.sections && lesson.content.visual_steps && lesson.content.visual_steps.length > 0 && (
            <div className="card p-6 sm:p-8 space-y-4 mt-6">
              {lesson.content.visual_steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-background border border-border/50 shadow-sm relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-blue/30 rounded-l-xl"></div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue/10 border border-brand-blue/20 text-brand-blue font-bold shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Callouts (1 col) */}
        <div className="space-y-6">
          {/* Fun Fact Callout */}
          <div className="card p-6 bg-brand-yellow/5 border-brand-yellow/20 space-y-3">
            <div className="flex items-center gap-2 text-brand-yellow font-bold text-base">
              <Lightbulb className="h-5 w-5" />
              <h3>Le Savais-tu ?</h3>
            </div>
            <p className="text-sm text-foreground leading-relaxed font-medium">
              {lesson.content.fun_fact}
            </p>
          </div>

          {/* Web Photo — under "Le Savais-tu ?" in a square card */}
          <div className="card overflow-hidden border border-border shadow-sm bg-card space-y-0">
            <div 
              className="aspect-square w-full overflow-hidden relative group cursor-pointer bg-slate-900/40"
              onClick={() => setSelectedPhoto({
                url: getLessonPhotoUrl(lesson),
                caption: lesson.content.web_photo?.caption || `Illustration de référence pour "${lesson.topic}"`,
                source: lesson.content.web_photo?.source || 'Importé du Web',
              })}
            >
              <img
                src={getLessonPhotoUrl(lesson)}
                alt={lesson.content.web_photo?.caption || lesson.topic}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
                onError={(e) => {
                  if (!mainPhotoError) {
                    setMainPhotoError(true);
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80';
                  }
                }}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 backdrop-blur-[2px]">
                <Maximize2 className="h-4 w-4" />
                Agrandir l'illustration
              </div>
            </div>
            <div className="px-4 py-3 space-y-1.5 bg-card">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-brand-blue uppercase tracking-wider flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {lesson.content.web_photo?.source || 'Photo Web Importée'}
                </span>
                <span className="text-[9px] bg-brand-blue/10 text-brand-blue font-extrabold px-2 py-0.5 rounded-full border border-brand-blue/20">
                  HD
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-snug font-medium">
                {lesson.content.web_photo?.caption || `Illustration de référence pour "${lesson.topic}"`}
              </p>
            </div>
          </div>

          {/* Illustrative Web Photos Gallery */}
          {lesson.content.illustrative_photos && lesson.content.illustrative_photos.length > 0 && (
            <div className="card p-5 bg-card border-border space-y-3.5">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <div className="flex items-center gap-2 text-brand-blue font-bold text-sm">
                  <Globe className="h-4 w-4" />
                  <h3>Photos Illustratives du Web</h3>
                </div>
                <span className="text-[10px] font-bold bg-brand-blue/10 text-brand-blue px-2.5 py-0.5 rounded-full border border-brand-blue/20">
                  {lesson.content.illustrative_photos.length} photos
                </span>
              </div>

              <div className="space-y-3">
                {lesson.content.illustrative_photos.map((photo, pIdx) => (
                  <div 
                    key={`illust-photo-${pIdx}`}
                    onClick={() => setSelectedPhoto(photo)}
                    className="group relative rounded-xl overflow-hidden border border-border/80 bg-background cursor-pointer hover:border-brand-blue transition-all shadow-sm"
                  >
                    <div className="aspect-video w-full overflow-hidden relative">
                      <img
                        src={photo.url}
                        alt={photo.caption || lesson.topic}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                        <Maximize2 className="h-3.5 w-3.5" />
                        Voir
                      </div>
                    </div>
                    <div className="p-2.5 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-brand-blue font-bold">
                        <span className="flex items-center gap-1 truncate">
                          <Globe className="h-3 w-3 shrink-0" />
                          {photo.source || 'Wikipédia'}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/90 font-medium line-clamp-2 leading-tight">
                        {photo.caption}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extra Markdown Photos (Moved from sections) */}
          {markdownImages.map((img, idx) => (
            <div key={`md-img-${idx}`} className="card overflow-hidden border border-border shadow-sm bg-card space-y-0">
              <div className="w-full overflow-hidden bg-slate-900/50">
                <img
                  src={img.url}
                  alt={img.alt}
                  className="w-full object-contain hover:scale-105 transition-transform duration-500 max-h-[300px]"
                  loading="lazy"
                />
              </div>
              <div className="px-4 py-3 space-y-1">
                <span className="text-[10px] font-bold text-brand-blue uppercase tracking-wider">
                  📸 Complément Visuel
                </span>
                <p className="text-xs text-muted-foreground leading-snug">
                  {img.alt}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Quiz Engine Section */}
      <div className="card p-6 sm:p-8 space-y-8">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-brand-blue" />
            <h2 className="text-2xl font-extrabold text-foreground">Quiz de Validation</h2>
          </div>
          <span className="text-sm font-semibold text-muted-foreground">3 questions</span>
        </div>

        {/* Questions Loop */}
        <div className="space-y-8">
          {lesson.quiz.map((q, qIdx) => {
            const selectedOpt = userAnswers[qIdx];
            const isCorrect = quizResult && selectedOpt === quizResult.correctAnswers[qIdx];

            return (
              <div key={qIdx} className="space-y-4">
                <h3 className="text-base sm:text-lg font-bold text-foreground flex items-start gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-blue/10 border border-brand-blue/20 text-xs font-bold text-brand-blue flex-shrink-0 mt-0.5">
                    {qIdx + 1}
                  </span>
                  {q.question}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = selectedOpt === oIdx;
                    const isAnswerCorrect = quizResult && oIdx === quizResult.correctAnswers[qIdx];

                    let btnStyle = 'border-border bg-background text-foreground hover:border-brand-blue';

                    if (isSubmitted && quizResult) {
                      if (isAnswerCorrect) {
                        btnStyle = 'border-brand-green bg-brand-green/10 text-brand-green font-bold shadow-sm';
                      } else if (isSelected && !isAnswerCorrect) {
                        btnStyle = 'border-red-500 bg-red-500/10 text-red-500 font-semibold';
                      } else {
                        btnStyle = 'border-border bg-muted/50 text-muted-foreground opacity-60';
                      }
                    } else if (isSelected) {
                      btnStyle = 'border-brand-blue bg-brand-blue/10 text-brand-blue font-semibold shadow-sm';
                    }

                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => handleSelectOption(qIdx, oIdx)}
                        disabled={isSubmitted}
                        className={`flex items-center justify-between rounded-xl p-4 text-left text-sm border transition-all ${btnStyle}`}
                      >
                        <span className="flex items-center gap-2">
                          {opt}
                        </span>
                        {isSubmitted && isAnswerCorrect && (
                          <span className="inline-flex items-center gap-1 text-xs font-extrabold text-brand-green bg-brand-green/10 px-2.5 py-1 rounded-full border border-brand-green/20">
                            <CheckCircle2 className="h-4 w-4" />
                            Vraie réponse
                          </span>
                        )}
                        {isSubmitted && isSelected && !isAnswerCorrect && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                            <XCircle className="h-4 w-4" />
                            Votre réponse
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit Button & Score Summary */}
        {!isSubmitted ? (
          <button
            type="button"
            onClick={handleSubmitQuiz}
            disabled={userAnswers.includes(-1) || isSubmitting}
            className="w-full flex items-center justify-center gap-2 btn-primary py-4 text-base disabled:opacity-40 transition-opacity"
          >
            {isSubmitting ? (
              <>
                <Sparkles className="h-5 w-5 animate-spin" />
                Correction du quiz...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                Valider mes Réponses
              </>
            )}
          </button>
        ) : (
          /* Victory Score Modal Card */
          quizResult && (
            <div className="rounded-2xl bg-card border border-border p-6 sm:p-8 text-center space-y-6 shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-yellow/10 text-brand-yellow">
                <Award className="h-8 w-8" />
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-foreground">
                  {quizResult.isPerfect ? '🎯 Score Parfait ! Excellent travail !' : '👏 Bravo d\'avoir complété ce quiz !'}
                </h3>
                <p className="mt-2 text-base text-muted-foreground">
                  Tu as obtenu <span className="font-bold text-brand-yellow">{quizResult.score} / {quizResult.total}</span> réponses correctes.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="rounded-xl bg-brand-blue/10 border border-brand-blue/20 px-5 py-3 text-sm font-bold text-brand-blue flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  +{quizResult.xpEarned} XP Gagnés
                </div>
                <div className="rounded-xl bg-brand-yellow/10 border border-brand-yellow/20 px-5 py-3 text-sm font-bold text-brand-yellow flex items-center gap-2">
                  <Flame className="h-5 w-5" />
                  Série maintenue !
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                {!isCompleted ? (
                  <button
                    type="button"
                    onClick={handleContinueLesson}
                    disabled={isContinuing}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 btn-primary py-3.5 px-6 font-bold shadow-md hover:scale-[1.02] transition-transform"
                  >
                    {isContinuing ? (
                      <>
                        <Sparkles className="h-5 w-5 animate-spin" />
                        Génération du Chapitre {chapterIndex + 1}...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Passer au Chapitre {chapterIndex + 1} (Approfondir)
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 btn-primary py-3 px-6"
                  >
                    Continuer vers le Tableau de Bord
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 btn-ghost py-3 px-6 text-sm"
                >
                  Tableau de Bord
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {/* Learning Continuation Engine Section */}
      <div className="pt-2">
        {isCompleted ? (
          /* Subject Completion Banner */
          <div className="card p-8 bg-gradient-to-r from-brand-green/10 via-brand-blue/5 to-brand-green/10 border-brand-green/30 text-center space-y-4 shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-green/20 text-brand-green">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <span className="inline-block rounded-full bg-brand-green/20 px-3 py-1 text-xs font-bold text-brand-green uppercase tracking-wider mb-2">
                Parcours Terminé (Chapitre {chapterIndex}/{totalChapters})
              </span>
              <h3 className="text-2xl font-extrabold text-foreground">
                Vous avez maintenant une compréhension complète de cette leçon.
              </h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
                Félicitations ! Vous avez parcouru l'ensemble des chapitres progressifs et maîtrisé l'ensemble des notions sur <strong className="text-foreground">"{lesson.topic}"</strong>.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="btn-primary py-3 px-6 text-sm"
              >
                Retour au Tableau de Bord
              </button>
              <button
                type="button"
                onClick={() => router.push('/lessons/generate')}
                className="btn-ghost py-3 px-6 text-sm"
              >
                Générer un Autre Sujet
              </button>
            </div>
          </div>
        ) : (
          /* Continue Learning Action Card */
          <div className="card p-6 sm:p-8 bg-gradient-to-r from-brand-blue/5 via-purple-500/5 to-brand-blue/10 border-brand-blue/30 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-brand-blue/10 border border-brand-blue/20 px-3 py-0.5 text-xs font-extrabold text-brand-blue">
                    Chapitre {chapterIndex + 1} sur {totalChapters}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">Continuation d'apprentissage</span>
                </div>
                <h3 className="text-xl font-extrabold text-foreground">
                  Approfondir cette leçon : {lesson.topic}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Passe au chapitre suivant pour découvrir des notions complémentaires plus détaillées sans répéter ce que tu as déjà appris.
                </p>
              </div>

              <button
                type="button"
                onClick={handleContinueLesson}
                disabled={isContinuing}
                className="w-full sm:w-auto shrink-0 btn-primary py-3.5 px-6 flex items-center justify-center gap-2 text-base font-bold shadow-md hover:scale-[1.02] transition-transform"
              >
                {isContinuing ? (
                  <>
                    <Sparkles className="h-5 w-5 animate-spin" />
                    Génération du Chapitre {chapterIndex + 1}...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Continuer l'apprentissage
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>

            {continueError && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-500 font-medium mt-4">
                {continueError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating AI Tutor Chat */}
      <AiChatPanel lesson={lesson} language={language} />

      {/* Lightbox Modal pour Photos Web */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-card rounded-2xl overflow-hidden border border-border shadow-2xl space-y-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 z-10 rounded-full bg-black/70 p-2 text-white hover:bg-black transition-colors"
              title="Fermer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="max-h-[75vh] bg-slate-950 flex items-center justify-center overflow-hidden p-2">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.caption || 'Illustration web'}
                className="max-h-[72vh] w-auto object-contain rounded-lg"
              />
            </div>

            <div className="p-5 space-y-2 bg-card border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-brand-blue flex items-center gap-1.5 uppercase tracking-wider">
                  <Globe className="h-4 w-4" />
                  Source : {selectedPhoto.source || 'Importé du Web'}
                </span>
                <span className="text-[10px] bg-brand-blue/10 text-brand-blue font-bold px-2 py-0.5 rounded-full border border-brand-blue/20">
                  Haute Résolution
                </span>
              </div>
              <p className="text-sm font-medium text-foreground leading-relaxed">
                {selectedPhoto.caption}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const AiChatPanel = React.memo(({ lesson, language }: { lesson: Lesson, language: string }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: string, content: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatLoading, isChatOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    const newMsgs = [...chatMessages, { role: 'user', content: chatInput }];
    setChatMessages(newMsgs);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const demoProfile = getDemoProfile();
      const lessonContext = lesson ? [
        `Titre de la leçon : "${lesson.content.title}"`,
        `Explication principale : ${lesson.content.explanation}`,
        lesson.content.sections && lesson.content.sections.length > 0
          ? `Sections : ${lesson.content.sections.map(s => s.heading).join(', ')}`
          : '',
        `Fait intéressant : ${lesson.content.fun_fact}`,
      ].filter(Boolean).join('\n') : '';

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [
            { role: 'system', content: `L'élève est sur la leçon "${lesson?.topic}" (matière : ${lesson?.subject}). Contexte :\n${lessonContext}\n\nRéponds à ses questions de manière simple, concise et adaptée. Utilise des emojis pour rendre l'apprentissage ludique. TU DOIS IMPÉRATIVEMENT RÉPONDRE DANS LA LANGUE SUIVANTE : ${language === 'en' ? 'Anglais' : language === 'ar' ? 'Arabe' : 'Français'}.` },
            ...newMsgs
          ],
          userContext: { profile: demoProfile } 
        })
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages([...newMsgs, { role: 'ai', content: data.reply }]);
      } else {
        setChatMessages([...newMsgs, { role: 'ai', content: "Désolé, mon cerveau d'IA est un peu fatigué pour le moment !" }]);
      }
    } catch {
      setChatMessages([...newMsgs, { role: 'ai', content: "Erreur de connexion. Vérifie ton réseau." }]);
    }
    setIsChatLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isChatOpen ? (
        <div className="bg-card border border-border shadow-2xl rounded-2xl w-80 sm:w-96 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          <div className="bg-brand-blue p-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-bold">Tuteur IA EasyLearn</span>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="text-white/80 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="h-80 overflow-y-auto p-4 space-y-4 bg-muted/10">
            {chatMessages.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground mt-10">
                <Bot className="h-10 w-10 mx-auto text-brand-blue/40 mb-2" />
                <p>Tu n'as pas compris quelque chose ? Pose-moi une question sur "{lesson?.topic}" !</p>
              </div>
            ) : (
              chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-brand-blue text-white rounded-tr-sm' 
                      : 'bg-background border border-border text-foreground rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-background border border-border text-foreground p-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 animate-spin text-brand-blue" />
                  <span className="text-xs font-bold text-muted-foreground">Réflexion...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-3 border-t border-border bg-background">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Pose ta question..."
                className="flex-1 bg-muted/50 border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-brand-blue"
              />
              <button 
                type="submit" 
                disabled={isChatLoading || !chatInput.trim()}
                className="bg-brand-blue text-white h-9 w-9 rounded-full flex items-center justify-center shrink-0 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsChatOpen(true)}
          className="relative h-14 w-14 rounded-full bg-brand-blue text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
          aria-label="Poser une question"
          title="Poser une question au tuteur IA"
        >
          <MessageSquare className="h-6 w-6" />
          {chatMessages.length === 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-brand-yellow rounded-full border-2 border-background animate-pulse" />
          )}
        </button>
      )}
    </div>
  );
});
