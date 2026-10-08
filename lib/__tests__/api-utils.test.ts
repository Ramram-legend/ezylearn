import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { getAuthContext, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { createClient } from '@/lib/supabase/server';
import type { Mock } from 'vitest';

const mockCreateClient = createClient as Mock;

function supabaseWith(getUser: unknown) {
  return { auth: { getUser: vi.fn().mockResolvedValue(getUser) } };
}

beforeEach(() => {
  mockCreateClient.mockReset();
});

describe('getAuthContext', () => {
  it('retourne le client et le userId quand l utilisateur est connecte', async () => {
    const client = supabaseWith({ data: { user: { id: 'user-1' } }, error: null });
    mockCreateClient.mockReturnValue(client);

    const ctx = await getAuthContext();
    expect(ctx).toEqual({ supabase: client, userId: 'user-1' });
    expect(client.auth.getUser).toHaveBeenCalledTimes(1);
  });

  it('retourne null si getUser renvoie une erreur', async () => {
    mockCreateClient.mockReturnValue(supabaseWith({ data: { user: null }, error: { message: 'fail' } }));
    expect(await getAuthContext()).toBeNull();
  });

  it('retourne null si aucun utilisateur', async () => {
    mockCreateClient.mockReturnValue(supabaseWith({ data: { user: null }, error: null }));
    expect(await getAuthContext()).toBeNull();
  });
});

describe('helpers de reponse', () => {
  it('errorResponse construit un JSON avec le statut demande', async () => {
    const res = errorResponse('Oups', 500);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Oups' });
  });

  it('errorResponse utilise 400 par defaut', async () => {
    expect(errorResponse('x').status).toBe(400);
  });

  it('unauthorizedResponse renvoie 401 avec le bon message', async () => {
    const res = unauthorizedResponse();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('Authentification requise');
  });
});
