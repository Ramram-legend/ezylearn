import { NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse, errorResponse } from '@/lib/api-utils';
import { startAdWatchSession } from '@/lib/credits';

export async function POST() {
  const auth = await getAuthContext();
  if (!auth) return unauthorizedResponse();

  try {
    const sessionId = await startAdWatchSession(auth.supabase, auth.userId);
    return NextResponse.json({ sessionId });
  } catch (error: any) {
    return errorResponse(error.message, 400);
  }
}
