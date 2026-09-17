import express from 'express';
import { UserRole, VerificationRequest } from '../src/types.js';
import { AuthenticatedRequest } from './types.js';
import { writeAuditLog } from './audit.js';
import { encryptField, decryptField } from './cryptoUtils.js';

const cleanText = (v: unknown, max = 500): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');

const maskDocumentNumber = (value: string): string => {
  const clear = decryptField(value);
  return clear.length > 4 ? `****${clear.slice(-4)}` : '****';
};

const verificationSummary = (verification: VerificationRequest) => ({
  ...verification,
  documentNumber: maskDocumentNumber(verification.documentNumber)
});

const verificationDecisionStatuses = new Set(['APPROVED', 'REJECTED', 'MORE_INFO', 'UNDER_REVIEW']);

export function registerVerificationRoutes(
  app: express.Express,
  authMiddleware: express.RequestHandler,
  adminOnlyMiddleware: express.RequestHandler,
  getDb: () => any,
  saveDb: () => void
) {
  // Legacy / Direct Verification Request endpoint (App.tsx compatibility)
  app.post('/api/verification/request', authMiddleware, (req: AuthenticatedRequest, res) => {
    const { userId, userName, userRole, documentType, documentNumber, notes } = req.body;
    const normalizedDocumentNumber = cleanText(documentNumber, 200);
    const normalizedNotes = notes === undefined ? undefined : cleanText(notes, 1000);
    
    if (!['ID_CARD', 'TITLE_DEED', 'LIVESTOCK_CERT'].includes(documentType) || !normalizedDocumentNumber) {
      return res.status(400).json({ error: 'Form parameter error. Please complete required fields.' });
    }

    const creatorId = req.user ? req.user.id : (userId || 'user_2');
    const creatorName = req.user ? req.user.name : (userName || 'Applicant');
    const creatorRole = req.user ? req.user.role : (userRole || UserRole.FARMER);

    const db = getDb();
    db.verifications ||= [];

    const newRequestId = `verify_req_${Date.now()}`;
    const verification: VerificationRequest = {
      id: newRequestId,
      userId: creatorId,
      userName: creatorName,
      userRole: creatorRole as UserRole,
      documentType,
      documentNumber: encryptField(normalizedDocumentNumber), // AES-256-GCM encryption at rest
      notes: normalizedNotes,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
      history: [{ at: new Date().toISOString(), actorId: creatorId, action: 'SUBMITTED' }]
    };

    db.verifications.push(verification);

    // Update user status
    const matchedUser = db.users.find((u: any) => u.id === creatorId);
    if (matchedUser) {
      matchedUser.verificationStatus = 'PENDING';
      matchedUser.verified = false;
    }

    saveDb();

    writeAuditLog(
      creatorId,
      'verification_requested',
      `verify_req:${newRequestId}`,
      null,
      { type: documentType },
      req.ip || '127.0.0.1'
    );

    res.status(201).json({
      ...verification,
      documentNumber: '[ENCRYPTED]'
    });
  });

  // Current user submits verification document
  app.post('/api/verification/submit', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Authentication credentials required.' });
    }

    const { documentType, documentNumber, notes, vetLicenseNumber } = req.body;
    if (!documentType || !documentNumber) {
      return res.status(400).json({ error: 'Document type and document number are required for verification.' });
    }

    const db = getDb();
    db.verifications ||= [];

    // Check for existing pending verification
    const existingPending = db.verifications.find(
      (v: VerificationRequest) => v.userId === user.id && (v.status === 'PENDING' || v.status === 'MORE_INFO')
    );
    if (existingPending) {
      return res.status(400).json({ 
        error: 'You already have an active verification submission currently under review.' 
      });
    }

    const newRequestId = `vrf_${Date.now()}`;
    const newRequest: VerificationRequest = {
      id: newRequestId,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      documentType,
      documentNumber: encryptField(String(documentNumber).trim()),
      notes: notes ? cleanText(notes, 500) : undefined,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
      history: [
        {
          at: new Date().toISOString(),
          actorId: user.id,
          action: 'SUBMITTED',
          note: 'Verification documentation submitted by applicant'
        }
      ]
    };

    db.verifications.push(newRequest);

    // Update user status to PENDING (NEVER automatically verified!)
    const matchedUser = db.users.find((u: any) => u.id === user.id);
    if (matchedUser) {
      matchedUser.verificationStatus = 'PENDING';
      matchedUser.verified = false;
      if (user.role === UserRole.VETERINARIAN && vetLicenseNumber) {
        matchedUser.vetLicenseNumber = String(vetLicenseNumber).trim();
        matchedUser.vetBoardVerified = false;
      }
    }

    saveDb();

    writeAuditLog(
      user.id,
      'verification_requested',
      `verification:${newRequestId}`,
      null,
      { documentType },
      req.ip || '127.0.0.1'
    );

    res.status(201).json({
      success: true,
      message: 'Verification documents received and queued for administrative review. Status is now PENDING.',
      request: verificationSummary(newRequest)
    });
  });

  // Current user gets their verification status & history
  app.get('/api/verification/status', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Authentication credentials required.' });
    }

    const db = getDb();
    db.verifications ||= [];
    const requests = db.verifications
      .filter((v: VerificationRequest) => v.userId === user.id)
      .map(verificationSummary);

    const currentUser = db.users.find((u: any) => u.id === user.id) || user;

    res.json({
      verified: Boolean(currentUser.verified),
      verificationStatus: currentUser.verificationStatus || (currentUser.verified ? 'VERIFIED' : 'UNVERIFIED'),
      vetLicenseNumber: currentUser.vetLicenseNumber,
      vetBoardVerified: currentUser.vetBoardVerified,
      requests
    });
  });

  // Admin gets all verifications with masked document numbers
  app.get('/api/admin/verifications', authMiddleware, adminOnlyMiddleware, (req: AuthenticatedRequest, res) => {
    const db = getDb();
    db.verifications ||= [];
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const query = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
    
    const results = db.verifications.filter((item: VerificationRequest) =>
      (!status || item.status === status) &&
      (!query || item.userName.toLowerCase().includes(query) || item.userRole.toLowerCase().includes(query))
    ).map(verificationSummary);

    res.json(results);
  });

  // Admin gets specific verification with decrypted document number
  app.get('/api/admin/verifications/:id', authMiddleware, adminOnlyMiddleware, (req: AuthenticatedRequest, res) => {
    const db = getDb();
    db.verifications ||= [];
    const item = db.verifications.find((verification: VerificationRequest) => verification.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Verification request was not found.' });
    
    res.json({ ...item, documentNumber: decryptField(item.documentNumber) });
  });

  // Admin decision endpoint (App.tsx: handleReviewVerification -> /api/admin/approve-doc)
  app.post('/api/admin/approve-doc', authMiddleware, adminOnlyMiddleware, (req: AuthenticatedRequest, res) => {
    const { requestId, status, note } = req.body;
    if (typeof requestId !== 'string' || !verificationDecisionStatuses.has(status)) {
      return res.status(400).json({ error: 'A verification request and valid decision are required.' });
    }

    const adminNote = note === undefined ? undefined : cleanText(note, 1000);
    if (status === 'MORE_INFO' && !adminNote) {
      return res.status(400).json({ error: 'A note is required when requesting additional information.' });
    }

    const db = getDb();
    db.verifications ||= [];
    const request = db.verifications.find((item: VerificationRequest) => item.id === requestId);
    if (!request) return res.status(404).json({ error: 'Verification request was not found.' });
    
    if (request.status === 'APPROVED' || request.status === 'REJECTED') {
      return res.status(409).json({ error: 'This verification has already received a final decision.' });
    }

    // Protection against self-approval
    if (request.userId === req.user!.id) {
      return res.status(403).json({ error: 'Administrators cannot approve their own verification application.' });
    }

    const previousStatus = request.status;
    request.status = status;
    request.adminNote = adminNote;
    request.reviewedAt = new Date().toISOString();
    request.reviewedBy = req.user!.id;
    request.history = [...(request.history || []), { at: request.reviewedAt, actorId: req.user!.id, action: status, note: adminNote }];

    const subscriber = db.users.find((user: any) => user.id === request.userId);
    if (subscriber) {
      if (status === 'APPROVED') {
        subscriber.verified = true;
        subscriber.verificationStatus = 'VERIFIED';
        if (subscriber.role === UserRole.VETERINARIAN) {
          subscriber.vetBoardVerified = true;
        }
      } else if (status === 'REJECTED') {
        subscriber.verified = false;
        subscriber.verificationStatus = 'REJECTED';
      } else if (status === 'MORE_INFO') {
        subscriber.verificationStatus = 'PENDING';
      }
    }

    saveDb();

    writeAuditLog(
      req.user!.id,
      'verification_decided',
      `verify_req:${request.id}`,
      { status: previousStatus },
      { status, note: adminNote },
      req.ip || '127.0.0.1'
    );

    res.json({ success: true, verification: verificationSummary(request) });
  });

  // Admin review alternative endpoint (/api/admin/verification-review)
  app.post('/api/admin/verification-review', authMiddleware, adminOnlyMiddleware, (req: AuthenticatedRequest, res) => {
    const admin = req.user!;
    const { requestId, status, adminNote } = req.body;

    if (!requestId || !status) {
      return res.status(400).json({ error: 'Request ID and review status are required.' });
    }

    if (!verificationDecisionStatuses.has(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: APPROVED, REJECTED, MORE_INFO, UNDER_REVIEW` });
    }

    const db = getDb();
    db.verifications ||= [];
    const request = db.verifications.find((v: VerificationRequest) => v.id === requestId);
    if (!request) {
      return res.status(404).json({ error: 'Verification request not found.' });
    }

    if (request.userId === admin.id) {
      return res.status(403).json({ error: 'Self-verification violation: Administrators cannot approve their own verification application.' });
    }

    const prevStatus = request.status;
    request.status = status;
    request.adminNote = adminNote || undefined;
    request.reviewedAt = new Date().toISOString();
    request.reviewedBy = `${admin.name} (${admin.id})`;
    request.history ||= [];
    request.history.push({
      at: new Date().toISOString(),
      actorId: admin.id,
      action: status as any,
      note: adminNote || `Status updated to ${status}`
    });

    const targetUser = db.users.find((u: any) => u.id === request.userId);
    if (targetUser) {
      if (status === 'APPROVED') {
        targetUser.verified = true;
        targetUser.verificationStatus = 'VERIFIED';
        if (targetUser.role === UserRole.VETERINARIAN) {
          targetUser.vetBoardVerified = true;
        }
      } else if (status === 'REJECTED') {
        targetUser.verified = false;
        targetUser.verificationStatus = 'REJECTED';
      } else if (status === 'UNDER_REVIEW') {
        targetUser.verificationStatus = 'UNDER_REVIEW';
      } else if (status === 'MORE_INFO') {
        targetUser.verificationStatus = 'PENDING';
      }
    }

    saveDb();

    writeAuditLog(
      admin.id,
      'admin_verification_decision',
      `verification:${request.id}`,
      prevStatus,
      { status, adminNote, targetUserId: request.userId },
      req.ip || '127.0.0.1'
    );

    res.json({
      success: true,
      message: `Verification application updated to ${status}.`,
      request: verificationSummary(request)
    });
  });
}
