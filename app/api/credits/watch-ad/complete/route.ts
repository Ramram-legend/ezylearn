import { NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse, errorResponse } from '@/lib/api-utils';
import { completeAdWatchSession } from '@/lib/credits';

export async function POST(req: Request) {
  const auth = await getAuthContext();
  if (!auth) return unauthorizedResponse();

  try {
    const { sessionId } = await req.json();
    if (!sessionId) {
      return errorResponse('Session ID manquant.', 400);
    }

    await completeAdWatchSession(auth.supabase, auth.userId, sessionId);
    return NextResponse.json({ success: true, message: 'Crédit accordé avec succès !' });
  } catch (error: any) {
    return errorResponse(error.message, 400);
  }
}
