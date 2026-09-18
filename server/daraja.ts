/** Provider credentials stay on the server. A submitted number is not proof of ownership. */
export function darajaConfigured() {
  return ['DARAJA_CONSUMER_KEY', 'DARAJA_CONSUMER_SECRET', 'DARAJA_SHORTCODE', 'DARAJA_PASSKEY', 'DARAJA_CALLBACK_URL'].every(key => Boolean(process.env[key]));
}
export function normalizeMpesaPhone(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const digits = value.replace(/[+\s-]/g, '').replace(/^0/, '254');
  return /^254[17]\d{8}$/.test(digits) ? digits : null;
}
async function request(endpoint: string, payload?: object) {
  if (!darajaConfigured()) throw new Error('M-Pesa is not configured. Please contact support.');
  const base = process.env.DARAJA_ENV === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
  const authorization = Buffer.from(`${process.env.DARAJA_CONSUMER_KEY}:${process.env.DARAJA_CONSUMER_SECRET}`).toString('base64');
  const tokenResponse = await fetch(`${base}/oauth/v1/generate?grant_type=client_credentials`, { headers: { Authorization: `Basic ${authorization}` }, signal: AbortSignal.timeout(15000) });
  const token = await tokenResponse.json();
  if (!tokenResponse.ok || !token.access_token) throw new Error('M-Pesa authorization unavailable.');
  const response = await fetch(base + endpoint, { method: 'POST', headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(15000) });
  const result = await response.json();
  if (!response.ok) throw new Error('M-Pesa request unavailable. Please retry later.');
  return result;
}
function credentials() {
  const Timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  return { BusinessShortCode: process.env.DARAJA_SHORTCODE, Timestamp, Password: Buffer.from(`${process.env.DARAJA_SHORTCODE}${process.env.DARAJA_PASSKEY}${Timestamp}`).toString('base64') };
}
export async function initiateStk(phone: string, amount: number, reference: string) {
  const callback = new URL(process.env.DARAJA_CALLBACK_URL || 'https://invalid.local');
  if (callback.protocol !== 'https:') throw new Error('M-Pesa requires an HTTPS callback URL.');
  const result = await request('/mpesa/stkpush/v1/processrequest', { ...credentials(), TransactionType: 'CustomerPayBillOnline', Amount: amount, PartyA: phone, PartyB: process.env.DARAJA_SHORTCODE, PhoneNumber: phone, CallBackURL: callback.toString(), AccountReference: reference.slice(0, 12), TransactionDesc: 'ShambaLoop wallet' });
  if (String(result.ResponseCode) !== '0' || !result.CheckoutRequestID) throw new Error('M-Pesa did not accept the payment request.');
  return result;
}
export async function queryStk(checkout: string) {
  return request('/mpesa/stkpushquery/v1/query', { ...credentials(), CheckoutRequestID: checkout });
}
