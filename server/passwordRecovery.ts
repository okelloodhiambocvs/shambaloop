import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import type express from 'express';

const digest = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
export function registerPasswordRecovery(app: express.Express, limiter: express.RequestHandler, getDb: () => any, save: () => void, normalizePhone: (value: any) => string | null, validPassword: (value: string) => boolean) {
  app.post('/api/auth/forgot-password', limiter, async (req, res) => {
    const phone = normalizePhone(req.body.phone);
    if (!phone) return res.status(400).json({ error: 'Enter a valid registered mobile number.' });
    if (!process.env.RECOVERY_WEBHOOK_URL && process.env.NODE_ENV !== 'test') return res.status(503).json({ error: 'Password recovery delivery is not configured. Please contact support.' });
    const db = getDb();
    const user = db.users.find((entry: any) => entry.phone === phone);
    const token = crypto.randomBytes(32).toString('hex');
    if (user) {
      db.passwordResets ||= {};
      db.passwordResets[user.id] = { hash: digest(token), expires: Date.now() + 15 * 60 * 1000 };
      save();
      if (process.env.RECOVERY_WEBHOOK_URL) {
        try {
          const url = new URL(process.env.RECOVERY_WEBHOOK_URL);
          if (url.protocol !== 'https:') throw new Error('HTTPS required');
          const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RECOVERY_WEBHOOK_SECRET || ''}` }, body: JSON.stringify({ phone, token, expiresInMinutes: 15 }), signal: AbortSignal.timeout(10000) });
          if (!response.ok) throw new Error('Delivery failed');
        } catch { delete db.passwordResets[user.id]; save(); return res.status(503).json({ error: 'Recovery delivery unavailable. Please retry later.' }); }
      }
    }
    res.json({ success: true, message: 'If an account exists, a recovery code has been sent to its registered number.', ...(process.env.NODE_ENV === 'test' && user ? { testToken: token } : {}) });
  });
  app.post('/api/auth/recover-password', limiter, (req, res) => {
    const { token, newPassword, confirmPassword } = req.body;
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token) || typeof newPassword !== 'string' || !validPassword(newPassword) || newPassword !== confirmPassword) return res.status(400).json({ error: 'Provide a valid recovery code and matching strong passwords.' });
    const db = getDb();
    const entry = Object.entries(db.passwordResets || {}).find(([, value]: any) => value.hash === digest(token) && value.expires > Date.now());
    if (!entry) return res.status(400).json({ error: 'Recovery code is invalid or expired.' });
    const user = db.users.find((item: any) => item.id === entry[0]);
    if (!user) return res.status(400).json({ error: 'Recovery code is invalid or expired.' });
    db.passwordHashes[user.id] = bcrypt.hashSync(newPassword, 12);
    user.passwordResetRequired = false;
    user.sessionVersion = (user.sessionVersion || 0) + 1;
    delete db.passwordResets[user.id];
    db.refreshTokens = [];
    save();
    res.json({ success: true, message: 'Password reset. Sign in with your new password.' });
  });
}
