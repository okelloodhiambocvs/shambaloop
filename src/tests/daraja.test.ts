import { afterEach, expect, test, vi } from 'vitest';
import { initiateStk, normalizeMpesaPhone, queryStk } from '../../server/daraja';
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
function configure() {
  for (const key of ['DARAJA_CONSUMER_KEY', 'DARAJA_CONSUMER_SECRET', 'DARAJA_SHORTCODE', 'DARAJA_PASSKEY']) vi.stubEnv(key, 'test-credential');
  vi.stubEnv('DARAJA_CALLBACK_URL', 'https://example.test/api/payments/callback');
  vi.stubEnv('DARAJA_ENV', 'sandbox');
}
test('normalizes Kenyan phones and rejects arbitrary identifiers', () => {
  expect(normalizeMpesaPhone('0712345678')).toBe('254712345678');
  expect(normalizeMpesaPhone('+254 712 345 678')).toBe('254712345678');
  expect(normalizeMpesaPhone('254999999999')).toBeNull();
  expect(normalizeMpesaPhone({ phone: '0712345678' })).toBeNull();
});
test('uses OAuth and submits STK without claiming payment completion', async () => {
  configure();
  const fetch = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'access' }))).mockResolvedValueOnce(new Response(JSON.stringify({ ResponseCode: '0', CheckoutRequestID: 'checkout-1' })));
  vi.stubGlobal('fetch', fetch);
  expect((await initiateStk('254712345678', 100, 'Wallet')).CheckoutRequestID).toBe('checkout-1');
  const [url, options] = fetch.mock.calls[1];
  expect(url).toContain('sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest');
  expect(options.headers.Authorization).toBe('Bearer access');
  expect(JSON.parse(options.body)).toMatchObject({ Amount: 100, PhoneNumber: '254712345678', CallBackURL: 'https://example.test/api/payments/callback' });
});
test('queries the exact checkout using provider authentication', async () => {
  configure();
  const fetch = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'access' }))).mockResolvedValueOnce(new Response(JSON.stringify({ ResultCode: '0' })));
  vi.stubGlobal('fetch', fetch);
  expect((await queryStk('checkout-1')).ResultCode).toBe('0');
  expect(JSON.parse(fetch.mock.calls[1][1].body).CheckoutRequestID).toBe('checkout-1');
});
test('fails closed on provider authorization errors', async () => {
  configure();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })));
  await expect(initiateStk('254712345678', 100, 'Wallet')).rejects.toThrow('authorization unavailable');
});
