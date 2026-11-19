import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminContext } from '@/lib/admin-auth';
import { errorResponse } from '@/lib/api-utils';
import type { Plan } from '@/types/database';

const updatePlanSchema = z.object({
  userId: z.string().uuid(),
  plan: z.enum(['gratuit', 'plus', 'famille', 'etablissement']),
});

export async function GET() {
  const auth = await getAdminContext();
  if (auth.response) return auth.response;

  const users = [];
  const pageSize = 1000;
  let page = 1;

  while (true) {
    const { data, error } = await auth.admin.auth.admin.listUsers({ page, perPage: pageSize });
    if (error) return errorResponse('Impossible de récupérer les utilisateurs.', 500);

    users.push(...data.users);
    if (data.users.length < pageSize) break;
    page += 1;
  }

  if (users.length === 0) return NextResponse.json({ users: [] });

  const { data: profiles, error } = await auth.admin
    .from('profiles')
    .select('id, display_name, plan')
    .in('id', users.map((user) => user.id));

  if (error) return errorResponse('Impossible de récupérer les profils.', 500);

  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const adminUsers = users
    .filter((user) => user.email)
    .map((user) => {
      const profile = profilesById.get(user.id);
      return {
        id: user.id,
        email: user.email!,
        displayName:
          profile?.display_name ??
          (typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null),
        plan: (profile?.plan ?? 'gratuit') as Plan,
      };
    })
    .sort((a, b) => a.email.localeCompare(b.email));

  return NextResponse.json({ users: adminUsers });
}

export async function PATCH(request: Request) {
  const auth = await getAdminContext();
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Corps de requête JSON invalide.');
  }

  const parsed = updatePlanSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? 'Données invalides.');
  }

  const { data, error } = await auth.admin
    .from('profiles')
    .update({ plan: parsed.data.plan, updated_at: new Date().toISOString() })
    .eq('id', parsed.data.userId)
    .select('id, plan')
    .maybeSingle();

  if (error) return errorResponse('Impossible de mettre à jour le forfait.', 500);
  if (!data) return errorResponse('Utilisateur introuvable.', 404);

  return NextResponse.json({ userId: data.id, plan: data.plan });
}
