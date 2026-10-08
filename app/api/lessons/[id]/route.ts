import { NextResponse } from 'next/server';
import { getAuthContext, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import type { PublicQuizQuestion } from '@/types/database';

/**
 * GET /api/lessons/:id
 * Recupere une lecon deja generee (ex : pour la reafficher, ou avant de
 * lancer son quiz). Les bonnes reponses du quiz ne sont jamais incluses ici.
 */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const auth = await getAuthContext();
  if (!auth) return unauthorizedResponse();

  const { data: lesson, error } = await auth.supabase
    .from('lessons')
    .select('id, topic, subject, level, content, quiz, created_at')
    .eq('id', params.id)
    .eq('user_id', auth.userId)
    .maybeSingle();

  if (error) return errorResponse('Impossible de recuperer la lecon.', 500);
  if (!lesson) return errorResponse('Lecon introuvable.', 404);

  const publicQuiz: PublicQuizQuestion[] = lesson.quiz.map(
    ({ question, options }: { question: string; options: string[] }) => ({ question, options })
  );

  return NextResponse.json({
    lesson: { ...lesson, quiz: publicQuiz },
  });
}
