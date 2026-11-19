import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

type AdminContextResult =
  | { admin: SupabaseClient; response?: never }
  | { admin?: never; response: NextResponse };

export async function getAdminContext(): Promise<AdminContextResult> {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      response: NextResponse.json({ error: 'Authentification requise.' }, { status: 401 }),
    };
  }

  const allowedEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (
    !user.email ||
    !user.email_confirmed_at ||
    !allowedEmails.includes(user.email.trim().toLowerCase())
  ) {
    return {
      response: NextResponse.json({ error: 'Accès réservé à l’administration.' }, { status: 403 }),
    };
  }

  return { admin: createAdminClient() };
}
