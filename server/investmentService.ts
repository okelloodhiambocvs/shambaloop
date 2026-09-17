import express from 'express';
import { UserRole, FarmerProposal, InvestorCriteria } from '../src/types.js';
import { AuthenticatedRequest } from './types.js';
import { writeAuditLog } from './audit.js';

export function registerInvestmentRoutes(
  app: express.Express,
  authMiddleware: express.RequestHandler,
  getDb: () => any,
  saveDb: () => void
) {
  // Investor saves/updates their Investment Brief
  app.put('/api/investor/criteria', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    if (user.role !== UserRole.INVESTOR && user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Only investors can configure investment briefs.' });
    }

    const {
      title,
      lookingFor,
      budgetKES,
      preferredSectors,
      targetCounties,
      notes,
      objectives,
      timelineMonths,
      resourcesProvided,
      partnerRequirements,
      documents,
      images,
      milestones,
      status = 'ACTIVE'
    } = req.body;

    const budget = Number(budgetKES);
    if (!budget || isNaN(budget) || budget <= 0) {
      return res.status(400).json({ error: 'Valid investment budget (KES) is required.' });
    }

    const db = getDb();
    db.investorCriteria ||= [];

    let criteria = db.investorCriteria.find((c: InvestorCriteria) => c.investorId === user.id);
    const timestamp = new Date().toISOString();

    if (!criteria) {
      criteria = {
        id: `crit_${Date.now()}`,
        investorId: user.id,
        investorName: user.name,
        title: title ? String(title).trim().slice(0, 150) : `${user.name}'s Commercial Agribusiness Fund`,
        lookingFor: lookingFor || 'FARMER_WITH_LAND_NEEDING_CAPITAL',
        budgetKES: budget,
        preferredSectors: Array.isArray(preferredSectors) ? preferredSectors : ['Dairy', 'Crops'],
        targetCounties: Array.isArray(targetCounties) ? targetCounties : ['Nakuru', 'Kiambu'],
        notes: notes ? String(notes).trim().slice(0, 1000) : '',
        objectives: objectives ? String(objectives).trim().slice(0, 1000) : undefined,
        timelineMonths: timelineMonths ? Number(timelineMonths) : 12,
        resourcesProvided: resourcesProvided ? String(resourcesProvided).trim().slice(0, 500) : undefined,
        partnerRequirements: partnerRequirements ? String(partnerRequirements).trim().slice(0, 500) : undefined,
        documents: Array.isArray(documents) ? documents : [],
        images: Array.isArray(images) ? images : [],
        milestones: Array.isArray(milestones) ? milestones : [],
        status,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      db.investorCriteria.push(criteria);
    } else {
      criteria.title = title ? String(title).trim().slice(0, 150) : criteria.title;
      criteria.lookingFor = lookingFor || criteria.lookingFor;
      criteria.budgetKES = budget;
      criteria.preferredSectors = Array.isArray(preferredSectors) ? preferredSectors : criteria.preferredSectors;
      criteria.targetCounties = Array.isArray(targetCounties) ? targetCounties : criteria.targetCounties;
      criteria.notes = notes !== undefined ? String(notes).trim().slice(0, 1000) : criteria.notes;
      criteria.objectives = objectives !== undefined ? String(objectives).trim().slice(0, 1000) : criteria.objectives;
      criteria.timelineMonths = timelineMonths ? Number(timelineMonths) : criteria.timelineMonths;
      criteria.resourcesProvided = resourcesProvided !== undefined ? String(resourcesProvided).trim().slice(0, 500) : criteria.resourcesProvided;
      criteria.partnerRequirements = partnerRequirements !== undefined ? String(partnerRequirements).trim().slice(0, 500) : criteria.partnerRequirements;
      criteria.documents = Array.isArray(documents) ? documents : criteria.documents;
      criteria.images = Array.isArray(images) ? images : criteria.images;
      criteria.milestones = Array.isArray(milestones) ? milestones : criteria.milestones;
      criteria.status = status;
      criteria.updatedAt = timestamp;
    }

    saveDb();

    writeAuditLog(
      user.id,
      'investment_brief_saved',
      `investor_criteria:${criteria.id}`,
      null,
      { budgetKES: budget, lookingFor: criteria.lookingFor },
      req.ip || '127.0.0.1'
    );

    res.json({
      success: true,
      message: 'Investment Brief successfully updated and published for qualified farmers.',
      criteria
    });
  });

  // Investor retrieves their own Investment Brief
  app.get('/api/investor/criteria', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const db = getDb();
    db.investorCriteria ||= [];

    let criteria = db.investorCriteria.find((c: InvestorCriteria) => c.investorId === user.id);
    if (!criteria && user.role === UserRole.INVESTOR) {
      criteria = {
        id: `crit_${Date.now()}`,
        investorId: user.id,
        investorName: user.name,
        title: `${user.name}'s Commercial Agribusiness Fund`,
        lookingFor: 'FARMER_WITH_LAND_NEEDING_CAPITAL',
        budgetKES: user.investmentBudgetKES || 2500000,
        preferredSectors: user.preferredSectors || ['Dairy', 'Horticulture'],
        targetCounties: ['Nakuru', 'Nyandarua', 'Kiambu'],
        notes: 'Seeking experienced agricultural partners with at least 5 acres arable land and reliable water source.',
        objectives: 'Establish scalable high-yield dairy and greenhouse horticulture production.',
        timelineMonths: 12,
        resourcesProvided: 'Full working capital for inputs, veterinary coverage, and cold-chain off-taker linkages.',
        partnerRequirements: 'Arable land ownership or secure lease, day-to-day farm management commitment.',
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      };
      db.investorCriteria.push(criteria);
      saveDb();
    }

    res.json(criteria || null);
  });

  // Farmers and authenticated users discover open Investment Briefs ("Find Investors")
  app.get('/api/investments/open', authMiddleware, (req: AuthenticatedRequest, res) => {
    const db = getDb();
    db.investorCriteria ||= [];

    // Return active briefs from verified investors
    const briefs = db.investorCriteria.filter((c: InvestorCriteria) => c.status === 'ACTIVE');
    res.json(briefs);
  });

  // Farmer submits a proposal for an investor's brief
  app.post('/api/farmer/proposals', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    if (user.role !== UserRole.FARMER && user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Only farmers can submit investment proposals.' });
    }

    const {
      investorId,
      title,
      sector = 'Dairy',
      farmDescription,
      capitalRequestedKES,
      farmerContribution,
      investorSharePercent = 40,
      farmerSharePercent = 60,
      timelineMonths = 12,
      expectedStartDate
    } = req.body;

    const capital = Number(capitalRequestedKES);
    if (!title || !farmDescription || !farmerContribution || !capital || capital <= 0) {
      return res.status(400).json({ 
        error: 'Title, farm description, farmer contribution, and valid capitalRequestedKES are required.' 
      });
    }

    const db = getDb();
    db.proposals ||= [];

    let targetInvestorName = 'Active Investor Partner';
    if (investorId) {
      const investorUser = db.users.find((u: any) => u.id === investorId);
      if (investorUser) targetInvestorName = investorUser.name;
    }

    const newProposalId = `prop_${Date.now()}`;
    const timestamp = new Date().toISOString();

    const proposal: FarmerProposal = {
      id: newProposalId,
      farmerId: user.id,
      farmerName: user.name,
      farmerPhone: user.phone,
      investorId,
      investorName: targetInvestorName,
      title: String(title).trim().slice(0, 150),
      sector,
      farmDescription: String(farmDescription).trim().slice(0, 1000),
      capitalRequestedKES: capital,
      farmerContribution: String(farmerContribution).trim().slice(0, 500),
      investorSharePercent: Number(investorSharePercent) || 40,
      farmerSharePercent: Number(farmerSharePercent) || 60,
      timelineMonths: Number(timelineMonths) || 12,
      expectedStartDate: expectedStartDate || timestamp.split('T')[0],
      status: 'SUBMITTED', // Starts at SUBMITTED
      createdAt: timestamp,
      updatedAt: timestamp
    };

    db.proposals.push(proposal);
    saveDb();

    writeAuditLog(
      user.id,
      'proposal_submitted',
      `proposal:${newProposalId}`,
      null,
      { title, capitalRequestedKES: capital, investorId },
      req.ip || '127.0.0.1'
    );

    res.status(201).json({
      success: true,
      message: 'Proposal successfully submitted for investor review. Initial status is SUBMITTED.',
      proposal
    });
  });

  // Farmer views their submitted proposals
  app.get('/api/farmer/proposals', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const db = getDb();
    db.proposals ||= [];

    let proposals: FarmerProposal[] = [];
    if (user.role === UserRole.FARMER) {
      proposals = db.proposals.filter((p: FarmerProposal) => p.farmerId === user.id);
    } else if (user.role === UserRole.INVESTOR) {
      proposals = db.proposals.filter((p: FarmerProposal) => p.investorId === user.id || !p.investorId);
    } else {
      proposals = db.proposals;
    }

    // Sort descending by date
    proposals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(proposals);
  });

  // Investor views proposals addressed to them
  app.get('/api/investor/proposals', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const db = getDb();
    db.proposals ||= [];

    const proposals = db.proposals.filter((p: FarmerProposal) => p.investorId === user.id);
    proposals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(proposals);
  });

  // Investor updates proposal status (UNDER_REVIEW, SHORTLISTED, ACCEPTED, REJECTED, NEGOTIATING)
  app.patch('/api/investor/proposals/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    if (user.role !== UserRole.INVESTOR && user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Only investors can review and transition proposal status.' });
    }

    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['UNDER_REVIEW', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'NEGOTIATING'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status transition. Allowed: ${validStatuses.join(', ')}` });
    }

    const db = getDb();
    db.proposals ||= [];
    const proposal = db.proposals.find((p: FarmerProposal) => p.id === id);
    if (!proposal) return res.status(404).json({ error: 'Proposal not found.' });

    const prevStatus = proposal.status;
    proposal.status = status;
    proposal.updatedAt = new Date().toISOString();

    // If ACCEPTED, also create an active Tripartite Match / Collaboration
    if (status === 'ACCEPTED') {
      db.matches ||= [];
      const matchExists = db.matches.some((m: any) => m.farmerId === proposal.farmerId && m.investorId === user.id);
      if (!matchExists) {
        db.matches.push({
          id: `match_${Date.now()}`,
          investorId: user.id,
          investorName: user.name,
          farmerId: proposal.farmerId,
          farmerName: proposal.farmerName,
          sector: proposal.sector,
          agreementTitle: proposal.title,
          capitalKES: proposal.capitalRequestedKES,
          allocatedCapitalKES: proposal.capitalRequestedKES,
          status: 'ACTIVE',
          startDate: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        });
      }
    }

    saveDb();

    writeAuditLog(
      user.id,
      'proposal_status_transitioned',
      `proposal:${id}`,
      prevStatus,
      { newStatus: status },
      req.ip || '127.0.0.1'
    );

    res.json({
      success: true,
      message: `Proposal status updated from ${prevStatus} to ${status}.`,
      proposal
    });
  });
}
