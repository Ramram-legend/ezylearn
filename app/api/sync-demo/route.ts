import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContext, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { createAdminClient } from '@/lib/supabase/admin';

const demoLessonSchema = z.object({
  topic: z.string().trim().min(2).max(200),
  subject: z.string().trim().min(1).max(60),
  level: z.string().trim().min(1).max(30),
  content: z.record(z.string(), z.unknown()),
  quiz: z.array(z.object({
    question: z.string().min(1).max(1000),
    options: z.array(z.string().min(1).max(500)).min(2).max(4),
    correct_index: z.number().int().min(0).max(3),
  })).max(20),
});

const syncSchema = z.object({
  demoLessons: z.array(demoLessonSchema).max(25),
}).strict();

export async function POST(request: Request) {
  const auth = await getAuthContext();
  if (!auth) return unauthorizedResponse();

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 1_000_000) {
    return errorResponse('Le contenu à synchroniser dépasse la taille autorisée.', 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Corps de requête JSON invalide.');
  }

  const parsed = syncSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? 'Données de démonstration invalides.');
  }

  const { demoLessons } = parsed.data;
  if (demoLessons && demoLessons.length > 0) {
    const formattedLessons = demoLessons.map((l) => ({
      user_id: auth.userId,
      topic: l.topic,
      subject: l.subject,
      level: l.level,
      content: { ...l.content, demo_imported: true },
      quiz: l.quiz,
    }));
    
    const { error } = await createAdminClient().from('lessons').insert(formattedLessons);
    if (error) return errorResponse('Impossible de synchroniser les leçons.', 500);
  }

  return NextResponse.json({ success: true, importedLessons: demoLessons.length });
}
