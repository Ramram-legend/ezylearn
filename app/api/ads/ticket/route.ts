import { NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse, errorResponse } from '@/lib/api-utils';
import { createAdTicket } from '@/lib/credits';

export async function POST() {
  const auth = await getAuthContext();
  if (!auth) return unauthorizedResponse();

  try {
    const ticketId = await createAdTicket(auth.supabase, auth.userId);
    return NextResponse.json({ ticketId });
  } catch (error: any) {
    return errorResponse(error.message, 403);
  }
}
