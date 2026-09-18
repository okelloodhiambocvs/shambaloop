import express from 'express';
import { UserRole, Review } from '../src/types.js';
import { AuthenticatedRequest } from './types.js';
import { writeAuditLog } from './audit.js';

export function registerReviewsRoutes(
  app: express.Express,
  authMiddleware: express.RequestHandler,
  getDb: () => any,
  saveDb: () => void
) {
  // Create a new review
  app.post('/api/reviews', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const { targetUserId, rating, title, comment, partnershipId, jobId, proposalId } = req.body;

    if (!targetUserId || !rating || !comment) {
      return res.status(400).json({ error: 'Target user ID, rating (1-5), and review comment are required.' });
    }

    // Rule: Prevent self-reviews
    if (targetUserId === user.id) {
      return res.status(400).json({ error: 'Self-review violation: You cannot submit a review for your own profile.' });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5 stars.' });
    }

    const db = getDb();
    db.reviews ||= [];
    const targetUser = db.users.find((u: any) => u.id === targetUserId);
    if (!targetUser || targetUser.role === UserRole.ADMIN) {
      return res.status(404).json({ error: 'Review target was not found or is an administrator.' });
    }

    // Role-based matrix rule:
    // Veterinarian -> Farmer or Investor
    // Investor -> Farmer or Veterinarian
    // Farmer -> Investor or Veterinarian
    const allowedTargetRoles = 
      user.role === UserRole.VETERINARIAN ? [UserRole.FARMER, UserRole.INVESTOR] :
      user.role === UserRole.INVESTOR ? [UserRole.FARMER, UserRole.VETERINARIAN] :
      user.role === UserRole.FARMER ? [UserRole.INVESTOR, UserRole.VETERINARIAN] :
      [];

    if (!allowedTargetRoles.includes(targetUser.role)) {
      return res.status(400).json({ 
        error: `As a ${user.role}, you can only submit reviews for ${allowedTargetRoles.join(' or ')}.` 
      });
    }

    // Rule: Prevent duplicate reviews for same target user in same engagement or within short window
    const engagementId = partnershipId || jobId || proposalId;
    const existing = db.reviews.find((r: Review) => 
      r.reviewerId === user.id && 
      r.targetUserId === targetUserId &&
      (engagementId ? (r.partnershipId === engagementId || r.jobId === engagementId || r.proposalId === engagementId) : true)
    );

    if (existing) {
      return res.status(400).json({ 
        error: 'Duplicate review prevented: You have already submitted feedback for this partner.' 
      });
    }

    const reviewId = `rev_${Date.now()}`;
    const timestamp = new Date().toISOString();

    const review: Review = {
      id: reviewId,
      reviewerId: user.id,
      reviewerName: user.name,
      reviewerRole: user.role,
      targetUserId,
      targetUserName: targetUser.name,
      targetUserRole: targetUser.role,
      partnershipId: partnershipId ? String(partnershipId) : undefined,
      jobId: jobId ? String(jobId) : undefined,
      proposalId: proposalId ? String(proposalId) : undefined,
      rating: Math.round(numRating),
      title: title ? String(title).trim().slice(0, 100) : undefined,
      comment: String(comment).trim().slice(0, 1000),
      createdAt: timestamp
    };

    db.reviews.push(review);
    saveDb();

    writeAuditLog(
      user.id,
      'review_submitted',
      `review:${reviewId}`,
      null,
      { targetUserId, targetRole: targetUser.role, rating: review.rating },
      req.ip || '127.0.0.1'
    );

    res.status(201).json({
      success: true,
      message: 'Review successfully recorded and posted to partner profile.',
      review
    });
  });

  // Get reviews written about or by the current user
  app.get('/api/reviews/my', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const db = getDb();
    db.reviews ||= [];

    const received = db.reviews.filter((r: Review) => r.targetUserId === user.id);
    const written = db.reviews.filter((r: Review) => r.reviewerId === user.id);

    // Compute average rating
    const avgRating = received.length > 0
      ? (received.reduce((acc: number, r: Review) => acc + r.rating, 0) / received.length).toFixed(1)
      : '5.0';

    res.json({
      averageRating: Number(avgRating),
      totalReceived: received.length,
      received,
      written
    });
  });

  // Get public reviews and rating summary for any specific user
  app.get('/api/reviews/user/:userId', authMiddleware, (req: AuthenticatedRequest, res) => {
    const db = getDb();
    db.reviews ||= [];
    const targetUserId = req.params.userId;
    const targetUser = db.users.find((u: any) => u.id === targetUserId);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    const received = db.reviews.filter((r: Review) => r.targetUserId === targetUserId);
    const avgRating = received.length > 0
      ? (received.reduce((acc: number, r: Review) => acc + r.rating, 0) / received.length).toFixed(1)
      : '5.0';

    res.json({
      targetUserId,
      targetUserName: targetUser.name,
      targetUserRole: targetUser.role,
      averageRating: Number(avgRating),
      totalReceived: received.length,
      reviews: received
    });
  });

  // Get candidate review targets categorized by role for the current user
  app.get('/api/reviews/candidates', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const db = getDb();
    db.reviews ||= [];
    db.users ||= [];
    db.partnerships ||= [];
    db.veterinaryJobs ||= [];

    const allowedTargetRoles = 
      user.role === UserRole.VETERINARIAN ? [UserRole.FARMER, UserRole.INVESTOR] :
      user.role === UserRole.INVESTOR ? [UserRole.FARMER, UserRole.VETERINARIAN] :
      user.role === UserRole.FARMER ? [UserRole.INVESTOR, UserRole.VETERINARIAN] :
      [];

    const alreadyReviewedTargetIds = new Set(
      db.reviews.filter((r: Review) => r.reviewerId === user.id).map((r: Review) => r.targetUserId)
    );

    const candidates = db.users
      .filter((u: any) => u.id !== user.id && allowedTargetRoles.includes(u.role) && u.role !== UserRole.ADMIN)
      .map((u: any) => {
        // Check if there is an active/completed engagement
        let context = `${u.county ? u.county + ' County • ' : ''}Verified ${u.role}`;
        let engagementId: string | undefined;

        const partnership = db.partnerships.find((p: any) => 
          (p.farmerId === user.id && p.investorId === u.id) || 
          (p.investorId === user.id && p.farmerId === u.id)
        );
        if (partnership) {
          context = `Cooperative Partnership (${partnership.status})`;
          engagementId = partnership.id;
        }

        const job = db.veterinaryJobs.find((j: any) => 
          (j.farmerId === user.id && j.assignedVetId === u.id) || 
          (j.assignedVetId === user.id && j.farmerId === u.id)
        );
        if (job) {
          context = `Veterinary Health Audit (${job.status})`;
          engagementId = job.id;
        }

        return {
          id: u.id,
          name: u.name,
          role: u.role,
          county: u.county || 'Kenya',
          context,
          engagementId,
          alreadyReviewed: alreadyReviewedTargetIds.has(u.id)
        };
      });

    res.json({
      allowedTargetRoles,
      candidates
    });
  });

  // Get eligible partners that the current user can review (backwards compatibility)
  app.get('/api/reviews/eligible-partners', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const db = getDb();
    db.reviews ||= [];
    db.partnerships ||= [];
    db.veterinaryJobs ||= [];
    db.users ||= [];

    const reviewedEngagements = new Set(db.reviews.filter((r: Review) => r.reviewerId === user.id).map((r: Review) => `${r.targetUserId}:${r.partnershipId || r.jobId || r.proposalId || ''}`));

    const eligiblePartners: Array<{ id: string; name: string; role: UserRole; context: string; engagementId: string; engagementType: 'partnership' | 'job' }> = [];

    for (const p of db.partnerships) {
      if (p.farmerId === user.id && !reviewedEngagements.has(`${p.investorId}:${p.id}`)) {
        const investor = db.users.find((u: any) => u.id === p.investorId);
        if (investor) eligiblePartners.push({ id: investor.id, name: investor.name, role: investor.role, context: `Partnership (${p.id})`, engagementId: p.id, engagementType: 'partnership' });
      }
      if (p.investorId === user.id && !reviewedEngagements.has(`${p.farmerId}:${p.id}`)) {
        const farmer = db.users.find((u: any) => u.id === p.farmerId);
        if (farmer) eligiblePartners.push({ id: farmer.id, name: farmer.name, role: farmer.role, context: `Partnership (${p.id})`, engagementId: p.id, engagementType: 'partnership' });
      }
    }

    for (const j of db.veterinaryJobs) {
      if (j.assignedVetId && j.farmerId === user.id && !reviewedEngagements.has(`${j.assignedVetId}:${j.id}`)) {
        eligiblePartners.push({ id: j.assignedVetId, name: j.assignedVetName || 'Attending Vet', role: UserRole.VETERINARIAN, context: 'Clinical farm visit', engagementId: j.id, engagementType: 'job' });
      }
      if (j.assignedVetId === user.id) {
        const farmer = db.users.find((u: any) => u.id === j.farmerId);
        if (farmer && !reviewedEngagements.has(`${farmer.id}:${j.id}`)) {
          eligiblePartners.push({ id: farmer.id, name: farmer.name, role: UserRole.FARMER, context: 'Farm clinical service', engagementId: j.id, engagementType: 'job' });
        }
      }
    }

    const unique = Array.from(new Map(eligiblePartners.map(item => [item.id, item])).values())
      .filter(item => item.id !== user.id);

    res.json(unique);
  });
}
