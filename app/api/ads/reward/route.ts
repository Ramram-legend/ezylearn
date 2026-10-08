import { NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse, errorResponse } from '@/lib/api-utils';
import { claimAdTicket } from '@/lib/credits';

export async function POST(req: Request) {
  const auth = await getAuthContext();
  if (!auth) return unauthorizedResponse();

  try {
    const { ticketId } = await req.json();
    if (!ticketId) {
      return errorResponse('Ticket ID manquant', 400);
    }

    await claimAdTicket(auth.supabase, auth.userId, ticketId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return errorResponse(error.message, 403);
  }
}
