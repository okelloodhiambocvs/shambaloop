import { describe, test, expect } from 'vitest';
import { registrationConsent, identityDocuments } from './registrationFixture';
const base = process.env.TEST_BASE_URL!;
const post = (route: string, body: object, token?: string) => fetch(base + route, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
const password = 'CorrectPassword123!';
const phone = `07${Math.floor(10000000 + Math.random() * 90000000)}`;
const payload = { phone, name: 'Security Farmer', county: 'Nakuru', role: 'farmer', password, ...registrationConsent(password) };

describe('Registration evidence and account recovery', () => {
  test('rejects missing consent, missing documents, filename-only evidence and mismatched passwords', async () => {
    for (const override of [{ termsAccepted: false }, { privacyAccepted: false }, { documents: {} }, { documents: { ...identityDocuments, passport_photo: 'photo.png' } }, { confirmPassword: 'different' }]) {
      expect((await post('/api/auth/register', { ...payload, ...override })).status).toBe(400);
    }
  });
  test('stores private documents and requires a single-use recovery code; revokes old sessions', async () => {
    const registration = await post('/api/auth/register', payload);
    expect(registration.status).toBe(201);
    const session = await registration.json();
    const files = await (await fetch(base + '/api/uploads/my', { headers: { Authorization: `Bearer ${session.token}` } })).json();
    expect(files).toHaveLength(5);
    expect(files.every((file: any) => file.isPrivate)).toBe(true);
    expect((await fetch(base + files[0].url)).status).toBe(401);
    const document = await fetch(base + files[0].url, { headers: { Authorization: `Bearer ${session.token}` } });
    expect(document.status).toBe(200);
    expect(document.headers.get('content-type')).toContain('image/png');
    const reset = await post('/api/auth/forgot-password', { phone, newPassword: 'AttackerPassword123!' });
    expect(reset.status).toBe(200);
    expect((await post('/api/auth/login', { phone, password })).status).toBe(200);
    const { testToken } = await reset.json();
    const body = { token: testToken, newPassword: 'ChangedPassword123!', confirmPassword: 'ChangedPassword123!' };
    expect((await post('/api/auth/recover-password', { ...body, token: '0'.repeat(64) })).status).toBe(400);
    expect((await post('/api/auth/recover-password', body)).status).toBe(200);
    expect((await post('/api/auth/recover-password', body)).status).toBe(400);
    expect((await fetch(base + '/api/users/profile', { headers: { Authorization: `Bearer ${session.token}` } })).status).toBe(401);
    expect((await post('/api/auth/login', { phone, password: body.newPassword })).status).toBe(200);
  });
});
