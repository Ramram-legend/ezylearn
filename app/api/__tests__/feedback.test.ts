import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock };

    constructor(_apiKey: string) {}
  },
}));

import { POST } from '@/app/api/feedback/route';

function post(body: unknown) {
  return POST(new Request('http://localhost/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }));
}

describe('POST /api/feedback', () => {
  beforeEach(() => {
    vi.stubEnv('RESEND_API_KEY', 'test-key');
    sendMock.mockReset().mockResolvedValue({ data: { id: 'email-1' }, error: null });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('escapes user input in the email HTML and rejects malformed submissions', async () => {
    const response = await post({
      name: '<img src=x onerror=alert(1)>',
      email: 'learner@example.com',
      message: '<script>alert(1)</script>',
    });

    expect(response.status).toBe(200);
    const payload = sendMock.mock.calls[0][0];
    expect(payload.html).toContain('&lt;img');
    expect(payload.html).toContain('&lt;script&gt;');
    expect(payload.html).not.toContain('<script>');

    const invalidResponse = await post({ name: 'Student', email: 'invalid', message: 'Hello' });
    expect(invalidResponse.status).toBe(400);
    expect(sendMock).toHaveBeenCalledTimes(1);
  });
});
