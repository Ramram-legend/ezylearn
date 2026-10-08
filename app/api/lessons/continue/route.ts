import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContext, errorResponse } from '@/lib/api-utils';
import { generateLessonContinuation } from '@/lib/ai';
import type { PublicQuizQuestion } from '@/types/database';

const continueSchema = z.object({
  lessonId: z.string().min(1, 'ID de la leçon requis.'),
  age: z.number().int().optional(),
  interests: z.array(z.string()).optional(),
  language: z.enum(['fr', 'en', 'ar']).optional(),
});

/**
 * POST /api/lessons/continue
 * Génère le chapitre suivant dans la chaîne d'apprentissage d'un sujet.
 * Body : { lessonId: string, age?: number, interests?: string[] }
 */
export async function POST(request: Request) {
  const auth = await getAuthContext();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Corps de requête JSON invalide.');
  }

  const parsed = continueSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? 'Requête invalide.');
  }

  const { lessonId, age: bodyAge, interests: bodyInterests, language = 'fr' } = parsed.data;

  // 1. Récupérer la leçon actuelle (soit depuis la DB, soit depuis le corps si invité)
  let parentLesson: any = null;
  let profile = {
    age: bodyAge ?? 14,
    age_group: 'college_lycee' as const,
    interests: bodyInterests ?? ['Sciences', 'Histoire'],
  };

  if (auth) {
    const { data: dbLesson } = await auth.supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .maybeSingle();

    if (dbLesson) {
      parentLesson = dbLesson;
    }

    const { data: profileData } = await auth.supabase
      .from('profiles')
      .select('age, age_group, interests')
      .eq('id', auth.userId)
      .maybeSingle();

    if (profileData) {
      profile = {
        age: profileData.age || profile.age,
        age_group: profileData.age_group || profile.age_group,
        interests: profileData.interests?.length ? profileData.interests : profile.interests,
      };
    }

    // Vérification des crédits
    const { checkGenerationRights, consumeGenerationCredit } = await import('@/lib/credits');
    const rights = await checkGenerationRights(auth.supabase, auth.userId);
    
    if (!rights.allowed) {
      return errorResponse('Plafond atteint. Passez Premium ou regardez une publicité pour obtenir des crédits bonus.', 402);
    }
  }

  const topic = parentLesson?.topic || 'Sujet Général';
  const subject = parentLesson?.subject || 'Sciences';
  const level = parentLesson?.level || 'Intermédiaire';
  const currentChapterIndex = parentLesson?.content?.chapter_index || 1;
  const totalChapters = parentLesson?.content?.total_chapters || 4;

  // 2. Générer le chapitre suivant via l'IA
  let generated;
  try {
    generated = await generateLessonContinuation({
      topic,
      subject,
      level,
      age: profile.age,
      interests: profile.interests,
      currentChapterIndex,
      totalChapters,
      previousSummary: parentLesson?.content?.explanation,
      language,
    });
  } catch (err) {
    return errorResponse(
      `Échec de la génération du chapitre suivant : ${err instanceof Error ? err.message : 'erreur inconnue'}`,
      502
    );
  }

  // 3. Sauvegarder le nouveau chapitre
  let lessonData;
  if (auth) {
    const { data: lesson, error: insertError } = await auth.supabase
      .from('lessons')
      .insert({
        user_id: auth.userId,
        topic,
        subject,
        level,
        content: {
          ...generated.content,
          parent_lesson_id: lessonId,
        },
        quiz: generated.quiz,
      })
      .select('id, topic, subject, level, content, quiz, created_at')
      .single();

    if (insertError || !lesson) {
      return errorResponse("Impossible d'enregistrer le chapitre généré.", 500);
    }

    lessonData = lesson;

    // Consommer le crédit
    const { consumeGenerationCredit } = await import('@/lib/credits');
    try {
      await consumeGenerationCredit(auth.supabase, auth.userId);
    } catch (e) {
      console.error("Erreur de consommation de crédit:", e);
    }
  } else {
    // Mode invité
    lessonData = {
      id: `lesson-guest-${Date.now()}`,
      topic,
      subject,
      level,
      content: {
        ...generated.content,
        parent_lesson_id: lessonId,
      },
      quiz: generated.quiz,
      created_at: new Date().toISOString(),
    };
  }

  const publicQuiz: PublicQuizQuestion[] = lessonData.quiz.map(
    ({ question, options }: { question: string; options: string[] }) => ({ question, options })
  );

  return NextResponse.json({
    lesson: {
      id: lessonData.id,
      topic: lessonData.topic,
      subject: lessonData.subject,
      level: lessonData.level,
      content: lessonData.content,
      quiz: publicQuiz,
      created_at: lessonData.created_at,
    },
  });
}
