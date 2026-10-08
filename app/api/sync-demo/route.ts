import { NextResponse } from 'next/server';
import { getAuthContext, errorResponse, unauthorizedResponse } from '@/lib/api-utils';

export async function POST(request: Request) {
  const auth = await getAuthContext();
  if (!auth) return unauthorizedResponse();

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON payload');
  }

  const { demoStats, demoLessons } = body;

  // 1. Sync Stats (XP, streak, completions)
  if (demoStats) {
    const { data: existingStats } = await auth.supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', auth.userId)
      .maybeSingle();

    if (existingStats) {
      await auth.supabase.from('user_stats').update({
        total_xp: Math.max(existingStats.total_xp, demoStats.total_xp || 0),
        current_streak: Math.max(existingStats.current_streak, demoStats.current_streak || 0),
        lessons_completed: Math.max(existingStats.lessons_completed, demoStats.lessons_completed || 0),
        quizzes_completed: Math.max(existingStats.quizzes_completed, demoStats.quizzes_completed || 0)
      }).eq('user_id', auth.userId);
    }
  }

  // 2. Sync Lessons
  if (demoLessons && demoLessons.length > 0) {
    const formattedLessons = demoLessons.map((l: any) => ({
      user_id: auth.userId,
      topic: l.topic,
      subject: l.subject,
      level: l.level,
      content: l.content,
      quiz: l.quiz,
    }));
    
    // Insert lessons
    await auth.supabase.from('lessons').insert(formattedLessons);
  }

  return NextResponse.json({ success: true });
}
