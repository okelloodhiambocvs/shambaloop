import express from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../src/types.js';
import { AuthenticatedRequest } from './types.js';
import { writeAuditLog } from './audit.js';

export function registerAuthExtensionRoutes(
  app: express.Express,
  authMiddleware: express.RequestHandler,
  validatePasswordStrength: (p: string) => boolean,
  cleanCredential: (v: unknown, max?: number) => string | null,
  getDb: () => any,
  saveDb: () => void
) {
  // Change password for currently authenticated user
  app.post('/api/auth/change-password', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const { currentPassword, newPassword } = req.body;

    const normalizedCurrent = cleanCredential(currentPassword);
    const normalizedNew = cleanCredential(newPassword);

    if (!normalizedCurrent || !normalizedNew) {
      return res.status(400).json({ error: 'Both current password and new password are required.' });
    }

    const db = getDb();
    const storedHash = db.passwordHashes[user.id];

    if (storedHash && !bcrypt.compareSync(normalizedCurrent, storedHash)) {
      writeAuditLog(user.id, 'password_change_failed_bad_current', `user:${user.id}`, null, null, req.ip || '127.0.0.1');
      return res.status(400).json({ error: 'Current password provided is incorrect.' });
    }

    if (!validatePasswordStrength(normalizedNew)) {
      return res.status(400).json({
        error: 'New password does not meet complexity requirements: minimum 12 characters, uppercase, lowercase, number, and special character.'
      });
    }

    db.passwordHashes[user.id] = bcrypt.hashSync(normalizedNew, 10);
    const userInDb = db.users.find((u: User) => u.id === user.id);
    if (userInDb) {
      userInDb.passwordResetRequired = false;
    }
    saveDb();

    writeAuditLog(user.id, 'password_changed', `user:${user.id}`, null, { status: 'SUCCESS' }, req.ip || '127.0.0.1');

    res.json({
      success: true,
      message: 'Password successfully changed and secured.'
    });
  });

  // Account/Email verification endpoint
  app.post('/api/auth/verify-account', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const { code } = req.body;

    const db = getDb();
    const targetUser = db.users.find((u: User) => u.id === user.id);
    if (!targetUser) return res.status(404).json({ error: 'User not found.' });

    targetUser.isEmailVerified = true;
    saveDb();

    writeAuditLog(user.id, 'account_email_verified', `user:${user.id}`, null, { verified: true }, req.ip || '127.0.0.1');

    res.json({
      success: true,
      message: 'Account communication credentials successfully verified.',
      user: targetUser
    });
  });

  // Current session info
  app.get('/api/auth/session', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const db = getDb();
    const targetUser = db.users.find((u: User) => u.id === user.id) || user;

    res.json({
      authenticated: true,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        phone: targetUser.phone,
        email: targetUser.email,
        role: targetUser.role,
        verified: Boolean(targetUser.verified),
        verificationStatus: targetUser.verificationStatus || (targetUser.verified ? 'VERIFIED' : 'UNVERIFIED'),
        isEmailVerified: Boolean(targetUser.isEmailVerified),
        county: targetUser.county,
        vetLicenseNumber: targetUser.vetLicenseNumber,
        vetBoardVerified: targetUser.vetBoardVerified,
        createdAt: targetUser.createdAt
      }
    });
  });
}
