import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAdminContext } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

describe('getAdminContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_EMAILS = 'admin@example.com, second@example.com';
  });

  it('refuse les utilisateurs qui ne sont pas dans la liste autorisée', async () => {
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { email: 'user@example.com', email_confirmed_at: '2026-01-01' } },
          error: null,
        }),
      },
    } as never);

    const result = await getAdminContext();

    expect(result.response?.status).toBe(403);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it('accepte une adresse autorisée sans tenir compte de la casse', async () => {
    const adminClient = {};
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { email: 'ADMIN@example.com', email_confirmed_at: '2026-01-01' } },
          error: null,
        }),
      },
    } as never);
    vi.mocked(createAdminClient).mockReturnValue(adminClient as never);

    const result = await getAdminContext();

    expect(result.admin).toBe(adminClient);
    expect(result.response).toBeUndefined();
  });
});
