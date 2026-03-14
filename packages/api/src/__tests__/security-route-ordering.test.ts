import { describe, it, expect, beforeAll } from 'vitest';
import { createProductionApp, request } from './helpers';

describe('Security: Route Ordering - Password Validation (C2)', () => {
  let app: ReturnType<typeof createProductionApp>;

  beforeAll(() => {
    app = createProductionApp();
  });

  it('POST /api/auth/reset-password with weak password should return 400', async () => {
    const res = await request(app, 'POST', '/api/auth/reset-password', {
      body: {
        newPassword: 'abc',
      },
    });

    expect(res.status).toBe(400);
    const json = res.json as { error: string };
    expect(json.error).toBe('Password too weak');
  });

  it('POST /api/auth/reset-password without password should return 400 with password error', async () => {
    const res = await request(app, 'POST', '/api/auth/reset-password', {
      body: {},
    });

    expect(res.status).toBe(400);
    const json = res.json as { error: string };
    // Missing password fails the same validation gate as a weak password
    expect(json.error).toBe('Password too weak');
  });

  it('POST /api/auth/reset-password with strong password should pass validation', async () => {
    const res = await request(app, 'POST', '/api/auth/reset-password', {
      body: {
        newPassword: 'Str0ng!Pass#2024',
        token: 'invalid-token',
      },
    });

    // The password passed validation, so the error (if any) should NOT be about
    // password strength. better-auth will reject the invalid token, but that is
    // a different error entirely.
    const json = res.json as Record<string, unknown> | null;
    if (json?.error) {
      expect(json.error).not.toBe('Password too weak');
    }
  });
});
