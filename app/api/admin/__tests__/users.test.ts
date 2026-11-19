import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PATCH } from '@/app/api/admin/users/route';
import { getAdminContext } from '@/lib/admin-auth';

vi.mock('@/lib/admin-auth', () => ({ getAdminContext: vi.fn() }));

const USER_ID = '11111111-1111-1111-1111-111111111111';

describe('PATCH /api/admin/users', () => {
  let profile: { id: string; plan: string; updated_at: string };
  let admin: { from: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    profile = { id: USER_ID, plan: 'gratuit', updated_at: '' };
    const query: Record<string, unknown> = {};
    let updateValues: Record<string, unknown> = {};
    let targetId = '';
    query.update = vi.fn((values: Record<string, unknown>) => {
      updateValues = values;
      return query;
    });
    query.eq = vi.fn((_column: string, value: string) => {
      targetId = value;
      return query;
    });
    query.select = vi.fn(() => query);
    query.maybeSingle = vi.fn(async () => {
      if (targetId !== profile.id) return { data: null, error: null };
      Object.assign(profile, updateValues);
      return { data: { id: profile.id, plan: profile.plan }, error: null };
    });
    admin = { from: vi.fn(() => query) };
    vi.mocked(getAdminContext).mockReset();
    vi.mocked(getAdminContext).mockResolvedValue({ admin: admin as never });
  });

  it('refuse un forfait non pris en charge', async () => {
    const response = await PATCH(
      new Request('http://localhost/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify({ userId: USER_ID, plan: 'premium' }),
      })
    );

    expect(response.status).toBe(400);
    expect(admin.from).not.toHaveBeenCalled();
  });

  it('met à jour le forfait du profil ciblé', async () => {
    const response = await PATCH(
      new Request('http://localhost/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify({ userId: USER_ID, plan: 'plus' }),
      })
    );

    expect(response.status).toBe(200);
    expect(profile.plan).toBe('plus');
    expect(await response.json()).toEqual({ userId: USER_ID, plan: 'plus' });
  });
});
