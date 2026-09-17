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
    const { targetUserId, targetUserName, targetUserRole, rating, title, comment, partnershipId, jobId, proposalId } = req.body;

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

    // Rule: Prevent duplicate reviews for same target user in same engagement
    const engagementId = partnershipId || jobId || proposalId;
    const existing = db.reviews.find((r: Review) => 
      r.reviewerId === user.id && 
      r.targetUserId === targetUserId &&
      ((engagementId && (r.partnershipId === engagementId || r.jobId === engagementId || r.proposalId === engagementId)) || (!engagementId))
    );

    if (existing) {
      return res.status(400).json({ 
        error: 'Duplicate review prevented: You have already submitted feedback for this partner engagement.' 
      });
    }

    const targetUser = db.users.find((u: any) => u.id === targetUserId);
    const reviewId = `rev_${Date.now()}`;
    const timestamp = new Date().toISOString();

    const review: Review = {
      id: reviewId,
      reviewerId: user.id,
      reviewerName: user.name,
      reviewerRole: user.role,
      targetUserId,
      targetUserName: targetUser ? targetUser.name : (targetUserName || 'Agribusiness Partner'),
      targetUserRole: targetUser ? targetUser.role : (targetUserRole || UserRole.FARMER),
      partnershipId,
      jobId,
      proposalId,
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
      { targetUserId, rating: review.rating },
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

  // Get eligible partners that the current user can review
  app.get('/api/reviews/eligible-partners', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const db = getDb();
    db.reviews ||= [];
    db.partnerships ||= [];
    db.matches ||= [];
    db.veterinaryJobs ||= [];
    db.agreements ||= [];

    const reviewedTargetIds = new Set(
      db.reviews.filter((r: Review) => r.reviewerId === user.id).map((r: Review) => r.targetUserId)
    );

    const eligiblePartners: Array<{ id: string; name: string; role: UserRole; context: string }> = [];

    // Check partnerships / matches
    for (const p of db.partnerships) {
      if (p.farmerId === user.id && !reviewedTargetIds.has(p.investorId)) {
        eligiblePartners.push({ id: p.investorId, name: 'Victoria Mwangi (Investor)', role: UserRole.INVESTOR, context: 'Active Dairy Partnership' });
      }
      if (p.investorId === user.id && !reviewedTargetIds.has(p.farmerId)) {
        eligiblePartners.push({ id: p.farmerId, name: 'Josphat Kiprop (Farmer)', role: UserRole.FARMER, context: 'Commercial Dairy Farm Partner' });
      }
    }

    // Check veterinary jobs
    for (const j of db.veterinaryJobs) {
      if (j.assignedVetId && j.farmerPhone === user.phone && !reviewedTargetIds.has(j.assignedVetId)) {
        eligiblePartners.push({ id: j.assignedVetId, name: j.assignedVetName || 'Attending Vet', role: UserRole.VETERINARIAN, context: 'Clinical Farm Visit' });
      }
      if (j.assignedVetId === user.id) {
        const farmer = db.users.find((u: any) => u.phone === j.farmerPhone);
        if (farmer && !reviewedTargetIds.has(farmer.id)) {
          eligiblePartners.push({ id: farmer.id, name: farmer.name, role: UserRole.FARMER, context: 'Farm Service Recipient' });
        }
      }
    }

    // Default eligible partners for demo accounts if empty
    if (eligiblePartners.length === 0) {
      if (user.role === UserRole.FARMER) {
        eligiblePartners.push({ id: 'user_3', name: 'Victoria Mwangi', role: UserRole.INVESTOR, context: 'Dairy Partnership' });
        eligiblePartners.push({ id: 'user_4', name: 'Dr. Naomi Wanjiku', role: UserRole.VETERINARIAN, context: 'Veterinary Clinical Visit' });
      } else if (user.role === UserRole.INVESTOR) {
        eligiblePartners.push({ id: 'user_2', name: 'Josphat Kiprop', role: UserRole.FARMER, context: 'Dairy Farm Production' });
        eligiblePartners.push({ id: 'user_4', name: 'Dr. Naomi Wanjiku', role: UserRole.VETERINARIAN, context: 'Livestock Health Certification' });
      } else if (user.role === UserRole.VETERINARIAN) {
        eligiblePartners.push({ id: 'user_2', name: 'Josphat Kiprop', role: UserRole.FARMER, context: 'Livestock Care' });
        eligiblePartners.push({ id: 'user_3', name: 'Victoria Mwangi', role: UserRole.INVESTOR, context: 'Agricultural Investment Health Audit' });
      }
    }

    // Deduplicate by partner id
    const unique = Array.from(new Map(eligiblePartners.map(item => [item.id, item])).values())
      .filter(item => item.id !== user.id);

    res.json(unique);
  });
}
