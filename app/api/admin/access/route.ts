import { NextResponse } from 'next/server';
import { getAdminContext } from '@/lib/admin-auth';

export async function GET() {
  const auth = await getAdminContext();
  if (auth.response) return auth.response;

  return NextResponse.json({ isAdmin: true });
}
