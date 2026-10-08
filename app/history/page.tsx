'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Search, ArrowRight, CheckCircle, Calendar, Sparkles } from 'lucide-react';
import { getDemoLessons } from '@/lib/demo-engine';
import type { Lesson } from '@/types/database';
import { useLanguage } from '@/hooks/useLanguage';

export default function HistoryPage() {
  const { t } = useLanguage();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');

  useEffect(() => {
    fetch('/api/lessons/history')
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data) => {
        if (data?.lessons) setLessons(data.lessons);
      })
      .catch(() => {
        window.location.href = '/';
      });
  }, []);

  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch = lesson.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          lesson.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || lesson.subject.toLowerCase() === selectedSubject.toLowerCase();
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-foreground">
            {t('history_title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('history_subtitle')}
          </p>
        </div>

        <Link
          href="/lessons/generate"
          className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-foreground shadow-lg"
        >
          <Sparkles className="h-4 w-4" />
          {t('generate_new_lesson')}
        </Link>
      </div>

      {/* Search & Subject Filter Controls */}
      <div className="glass-card rounded-2xl p-4 border border-border flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par sujet ou mot-clé..."
            className="w-full rounded-xl border border-border bg-card/90 pl-10 pr-4 py-2.5 text-sm text-muted-foreground placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="w-full sm:w-48 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-muted-foreground focus:border-indigo-500 focus:outline-none"
        >
          <option value="all">Toutes les matières</option>
          <option value="Biologie">Biologie</option>
          <option value="Physique & Espace">Physique & Espace</option>
          <option value="Informatique">Informatique</option>
          <option value="Histoire">Histoire</option>
        </select>
      </div>

      {/* Lessons List Grid */}
      {filteredLessons.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center text-muted-foreground border border-border">
          Aucune leçon ne correspond à votre recherche.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map((lesson) => (
            <Link
              key={lesson.id}
              href={`/lessons/${lesson.id}`}
              className="glass-card glass-card-hover rounded-3xl p-6 border border-border flex flex-col justify-between space-y-4 group"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-indigo-400 mb-3">
                  <span className="rounded-md bg-indigo-500/10 px-2.5 py-1 border border-indigo-500/20 font-bold">
                    {lesson.subject}
                  </span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(lesson.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                <h3 className="font-heading text-xl font-bold text-foreground group-hover:text-indigo-300 transition-colors">
                  {lesson.topic}
                </h3>
              </div>

              <div className="pt-4 border-t border-border/80 flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" /> Quiz disponible
                </span>
                <span className="font-bold text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Revoir le cours <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

    </div>
  );
}
