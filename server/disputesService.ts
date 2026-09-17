import express from 'express';
import { UserRole, Dispute } from '../src/types.js';
import { AuthenticatedRequest } from './types.js';
import { writeAuditLog } from './audit.js';

export function registerDisputesRoutes(
  app: express.Express,
  authMiddleware: express.RequestHandler,
  getDb: () => any,
  saveDb: () => void
) {
  // Get disputes for authenticated user (IDOR safe: only participant or admin)
  app.get('/api/disputes', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const db = getDb();
    db.disputes ||= [];

    let disputes: Dispute[] = [];
    if (user.role === UserRole.ADMIN) {
      disputes = db.disputes;
    } else {
      disputes = db.disputes.filter((d: Dispute) => 
        d.creatorId === user.id || d.respondentId === user.id
      );
    }

    disputes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(disputes);
  });

  // Create a new dispute
  app.post('/api/disputes', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const { 
      agreementId,
      leaseId,
      respondentId, 
      respondentName, 
      respondentRole, 
      title, 
      reason, 
      evidenceText, 
      evidenceUrls, 
      partnershipId, 
      jobId 
    } = req.body;

    const targetLeaseId = leaseId || agreementId;
    if (!respondentId || !title || !reason) {
      return res.status(400).json({ error: 'Dispute title and detailed reason are required.' });
    }

    const db = getDb();
    db.disputes ||= [];

    // If linked to a lease agreement, check participation and update escrow to DISPUTED
    let linkedAgreement: any = null;
    if (targetLeaseId) {
      db.agreements ||= [];
      linkedAgreement = db.agreements.find((a: any) => a.id === targetLeaseId);
      if (linkedAgreement) {
        if (user.role !== UserRole.ADMIN && linkedAgreement.landownerId !== user.id && linkedAgreement.farmerId !== user.id) {
          return res.status(403).json({ error: 'Only participants of the lease agreement can open a dispute.' });
        }
        linkedAgreement.mpesaEscrowStatus = 'DISPUTED';
      }
    }

    let targetRespondentName = respondentName;
    let targetRespondentRole = respondentRole;

    if (respondentId) {
      const respUser = db.users.find((u: any) => u.id === respondentId);
      if (!respUser || respondentId === user.id) return res.status(400).json({ error: 'A dispute must name a different, valid platform participant.' });
      const isRelated = db.partnerships?.some((p: any) => (p.id === partnershipId || p.id === targetLeaseId) && [p.farmerId, p.investorId].includes(user.id) && [p.farmerId, p.investorId].includes(respondentId)) ||
        db.veterinaryJobs?.some((j: any) => (j.id === jobId) && [j.farmerId, j.assignedVetId].includes(user.id) && [j.farmerId, j.assignedVetId].includes(respondentId)) ||
        linkedAgreement && [linkedAgreement.landownerId, linkedAgreement.farmerId].includes(respondentId);
      if (!isRelated && user.role !== UserRole.ADMIN) return res.status(403).json({ error: 'Disputes must be linked to a shared agreement, partnership, or job.' });
      targetRespondentName = respUser.name;
      targetRespondentRole = respUser.role;
    }

    const disputeId = `disp_${Date.now()}`;
    const timestamp = new Date().toISOString();

    const newDispute: Dispute = {
      id: disputeId,
      creatorId: user.id,
      creatorName: user.name,
      creatorRole: user.role,
      respondentId: respondentId || undefined,
      respondentName: targetRespondentName || 'Partner Party',
      respondentRole: targetRespondentRole || undefined,
      title: title ? String(title).trim().slice(0, 150) : 'Partnership Grievance',
      reason: String(reason).trim().slice(0, 2000),
      evidenceText: evidenceText ? String(evidenceText).trim() : undefined,
      evidenceUrls: Array.isArray(evidenceUrls) ? evidenceUrls : [],
      partnershipId,
      jobId,
      leaseId: targetLeaseId,
      status: 'OPEN',
      createdAt: timestamp,
      updatedAt: timestamp,
      messages: [
        {
          senderId: user.id,
          senderName: user.name,
          senderRole: user.role,
          message: String(reason).trim(),
          evidenceUrls: Array.isArray(evidenceUrls) ? evidenceUrls : [],
          timestamp
        }
      ],
      history: [
        {
          at: timestamp,
          actorId: user.id,
          action: 'OPENED',
          note: 'Dispute registered in ShambaLoop Dispute Room'
        }
      ]
    };

    db.disputes.push(newDispute);
    saveDb();

    writeAuditLog(
      user.id,
      'dispute_opened',
      `dispute:${disputeId}`,
      null,
      { title: newDispute.title, respondentId },
      req.ip || '127.0.0.1'
    );

    res.status(201).json({
      ...newDispute,
      success: true,
      message: 'Dispute logged in Dispute Room. Case is now OPEN for mediation.',
      dispute: newDispute
    });
  });

  // Add response / evidence message to existing dispute
  app.post('/api/disputes/:id/message', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const { id } = req.params;
    const { message, evidenceUrls } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    const db = getDb();
    db.disputes ||= [];
    const dispute = db.disputes.find((d: Dispute) => d.id === id);
    if (!dispute) return res.status(404).json({ error: 'Dispute not found.' });

    // Participant verification
    const isParticipant = dispute.creatorId === user.id || dispute.respondentId === user.id || user.role === UserRole.ADMIN;
    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied: You are not an involved party in this dispute case.' });
    }

    const timestamp = new Date().toISOString();
    dispute.messages ||= [];
    dispute.messages.push({
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      message: String(message).trim().slice(0, 2000),
      evidenceUrls: Array.isArray(evidenceUrls) ? evidenceUrls : [],
      timestamp
    });

    if (dispute.status === 'OPEN' && dispute.respondentId === user.id) {
      dispute.status = 'UNDER_REVIEW';
    }
    dispute.updatedAt = timestamp;

    saveDb();

    writeAuditLog(
      user.id,
      'dispute_message_added',
      `dispute:${id}`,
      null,
      { messageLength: message.length },
      req.ip || '127.0.0.1'
    );

    res.json({
      success: true,
      message: 'Response and supporting documentation appended to dispute thread.',
      dispute
    });
  });

  // Admin resolution of dispute
  app.post('/api/disputes/:id/resolve', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    if (user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Only administrators or accredited mediators can resolve disputes.' });
    }

    const { id } = req.params;
    const { status, resolution, resolutionReason, resolutionNotes } = req.body;

    const db = getDb();
    db.disputes ||= [];
    const dispute = db.disputes.find((d: Dispute) => d.id === id);
    if (!dispute) return res.status(404).json({ error: 'Dispute not found.' });

    let finalStatus = status || 'RESOLVED';
    let agreement: any = null;

    if (dispute.leaseId) {
      db.agreements ||= [];
      agreement = db.agreements.find((a: any) => a.id === dispute.leaseId);
    }

    if (resolution === 'refund_farmer') {
      finalStatus = 'REFUNDED';
      if (agreement) agreement.mpesaEscrowStatus = 'REFUNDED';
    } else if (resolution === 'disburse_landowner') {
      finalStatus = 'RELEASED';
      if (agreement) agreement.mpesaEscrowStatus = 'DISBURSED';
    }

    dispute.status = finalStatus;
    const notes = resolutionNotes || resolutionReason || 'Case mediated and resolved by ShambaLoop Governance Team.';
    dispute.resolutionNotes = String(notes).trim().slice(0, 2000);
    dispute.updatedAt = new Date().toISOString();
    dispute.history ||= [];
    dispute.history.push({
      at: new Date().toISOString(),
      actorId: user.id,
      action: finalStatus as any,
      note: dispute.resolutionNotes
    });

    saveDb();

    writeAuditLog(
      user.id,
      'dispute_resolved',
      `dispute:${id}`,
      agreement?.id || null,
      { resolutionStatus: finalStatus, resolutionNotes: dispute.resolutionNotes },
      req.ip || '127.0.0.1'
    );

    res.json({
      success: true,
      message: `Dispute status updated to ${finalStatus}.`,
      dispute,
      agreement
    });
  });
}
