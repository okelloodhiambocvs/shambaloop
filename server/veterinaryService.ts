import express from 'express';
import { UserRole, VeterinaryJob, VeterinaryReport } from '../src/types.js';
import { AuthenticatedRequest } from './types.js';
import { writeAuditLog } from './audit.js';

const cleanText = (v: unknown, max = 500): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export function registerVeterinaryRoutes(
  app: express.Express,
  authMiddleware: express.RequestHandler,
  getDb: () => any,
  saveDb: () => void
) {
  // Get veterinary jobs (filtered by status or user role)
  app.get('/api/veterinary/jobs', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Authentication required.' });

    const db = getDb();
    db.veterinaryJobs ||= [];

    if (user.role !== UserRole.VETERINARIAN && user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Only veterinarians and administrators can access veterinary job controls.' });
    }

    let jobs: VeterinaryJob[] = [];
    if (user.role === UserRole.VETERINARIAN) {
      // Vet can see open jobs and jobs assigned to them
      jobs = db.veterinaryJobs.filter((j: VeterinaryJob) => 
        j.status === 'OPEN' || j.assignedVetId === user.id
      );
    } else {
      jobs = db.veterinaryJobs;
    }

    res.json(jobs);
  });

  // Farmer gets their veterinary job requests
  app.get('/api/farmer/veterinary-jobs', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Authentication required.' });

    const db = getDb();
    db.veterinaryJobs ||= [];
    const jobs = db.veterinaryJobs.filter((job: VeterinaryJob) => 
      job.farmerPhone === user.phone || job.farmerName === user.name
    );
    res.json(jobs);
  });

  // Farmer requests veterinary assistance
  app.post('/api/farmer/veterinary-jobs', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Authentication required.' });
    if (user.role !== UserRole.FARMER && user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Only farmers can submit veterinary service requests.' });
    }

    const { farmId, location, animalOrCropType, serviceType, urgency = 'NORMAL', assignedVetId, notes, requestedDate } = req.body;
    const normalizedLocation = cleanText(location, 200);
    const normalizedSubject = cleanText(animalOrCropType, 160);

    if (!normalizedLocation || !normalizedSubject || !serviceType) {
      return res.status(400).json({ error: 'Location, animal/crop type, and service type are required.' });
    }

    const validServices = ['CLINICAL_CHECK', 'VACCINATION', 'PREGNANCY_SCAN', 'EMERGENCY_SURGERY', 'NUTRITIONAL_AUDIT'];
    if (!validServices.includes(serviceType)) {
      return res.status(400).json({ error: `Invalid service type. Options: ${validServices.join(', ')}` });
    }

    const db = getDb();
    db.veterinaryJobs ||= [];

    const assignedVet = assignedVetId ? db.users.find((u: any) => u.id === assignedVetId && u.role === UserRole.VETERINARIAN) : undefined;
    const newJobId = `vjob_${Date.now()}`;
    const newJob: VeterinaryJob = {
      id: newJobId,
      farmId: farmId || `farm_${user.id}`,
      farmerName: user.name,
      farmerPhone: user.phone,
      location: normalizedLocation,
      animalOrCropType: normalizedSubject,
      serviceType,
      urgency: ['NORMAL', 'URGENT', 'EMERGENCY'].includes(urgency) ? urgency : 'NORMAL',
      status: assignedVet ? 'ASSIGNED' : 'OPEN',
      assignedVetId: assignedVet?.id,
      assignedVetName: assignedVet?.name,
      requestedDate: requestedDate || new Date().toISOString().split('T')[0],
      notes: notes ? cleanText(notes, 1000) : undefined
    };

    db.veterinaryJobs.unshift(newJob);
    saveDb();

    writeAuditLog(
      user.id,
      'veterinary_job_requested',
      `vet_job:${newJobId}`,
      null,
      { serviceType, location: normalizedLocation, urgency },
      req.ip || '127.0.0.1'
    );

    res.status(201).json(newJob);
  });

  // Vet accepts or updates job status
  app.patch('/api/veterinary/jobs/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    if (user.role !== UserRole.VETERINARIAN && user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Only veterinarians can update job status.' });
    }

    const { id } = req.params;
    const { status } = req.body;

    const db = getDb();
    db.veterinaryJobs ||= [];
    const job = db.veterinaryJobs.find((j: VeterinaryJob) => j.id === id);
    if (!job) {
      return res.status(404).json({ error: 'Veterinary job not found.' });
    }

    const validStatuses = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status: ${status}` });
    }

    if (job.status === 'OPEN') {
      job.assignedVetId = user.id;
      job.assignedVetName = user.name;
    } else if (job.assignedVetId && job.assignedVetId !== user.id && user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'This job is assigned to another veterinarian.' });
    }

    if (job.status === 'COMPLETED' && status !== 'COMPLETED' && user.role !== UserRole.ADMIN) {
      return res.status(409).json({ error: 'Completed jobs cannot be changed.' });
    }

    const previousStatus = job.status;
    job.status = status;
    saveDb();

    writeAuditLog(
      user.id,
      'veterinary_job_status_updated',
      `vet_job:${id}`,
      previousStatus,
      { newStatus: status },
      req.ip || '127.0.0.1'
    );

    res.json(job);
  });

  // Partnerships assigned to this veterinarian
  app.get('/api/veterinary/partnerships', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    if (user.role !== UserRole.VETERINARIAN && user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Only veterinarians can view assigned partnerships.' });
    }

    const db = getDb();
    db.veterinaryJobs ||= [];
    db.partnerships ||= [];

    if (user.role === UserRole.ADMIN) {
      return res.json(db.partnerships);
    }

    const assignedFarmIds = new Set(
      db.veterinaryJobs
        .filter((j: VeterinaryJob) => j.assignedVetId === user.id)
        .map((j: VeterinaryJob) => j.farmId)
    );

    res.json(db.partnerships.filter((p: any) => assignedFarmIds.has(p.id)));
  });

  // Get Certified Veterinary Reports
  app.get('/api/veterinary/reports', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const db = getDb();
    db.veterinaryReports ||= [];

    let reports: VeterinaryReport[] = [];
    if (user.role === UserRole.VETERINARIAN) {
      reports = db.veterinaryReports.filter((r: VeterinaryReport) => r.veterinarianId === user.id);
    } else if (user.role === UserRole.FARMER) {
      reports = db.veterinaryReports.filter((r: VeterinaryReport) => r.farmerId === user.id);
    } else if (user.role === UserRole.INVESTOR) {
      reports = db.veterinaryReports.filter((r: VeterinaryReport) => r.investorId === user.id);
    } else {
      reports = db.veterinaryReports;
    }

    res.json(reports);
  });

  // Create Certified Veterinary Report (VERIFIED VETERINARIAN ONLY)
  app.post('/api/veterinary/reports', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    if (user.role !== UserRole.VETERINARIAN && user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Access denied: Only certified veterinary professionals can write veterinary clinical reports.' });
    }

    const db = getDb();
    db.veterinaryReports ||= [];
    db.partnerships ||= [];

    const {
      partnershipId = 'part_general',
      farmId,
      animalTagId: directTagId,
      animalOrCropType,
      farmerId: directFarmerId,
      farmerName: directFarmerName,
      investorId: directInvestorId,
      investorName: directInvestorName,
      visitType = 'Routine Clinical Check',
      visitDate,
      diagnosis,
      treatment,
      medication,
      vaccination,
      pregnancyStatus = 'NOT_APPLICABLE',
      observations,
      findings,
      recommendations,
      followUpDate,
      photos = [],
      documents = [],
      status = 'FIT_FOR_PRODUCTION',
      isFinalized = false
    } = req.body;

    const partnership = db.partnerships.find((p: any) => p.id === partnershipId);
    const animalTagId = directTagId || partnership?.animalTagId || 'TAG_UNKNOWN';
    const farmerId = directFarmerId || partnership?.farmerId || 'user_2';
    const investorId = directInvestorId || partnership?.investorId || 'user_3';

    if (!findings || !recommendations) {
      return res.status(400).json({ error: 'Clinical findings and recommendations are required.' });
    }

    const newReportId = `vet_report_${Date.now()}`;
    const timestamp = new Date().toISOString();

    const report: VeterinaryReport = {
      id: newReportId,
      partnershipId,
      farmId: farmId || `farm_${farmerId}`,
      animalTagId: String(animalTagId).trim(),
      animalOrCropType: animalOrCropType ? String(animalOrCropType).trim() : undefined,
      veterinarianId: user.id,
      veterinarianName: user.name,
      farmerId,
      farmerName: directFarmerName || 'Farmer',
      investorId,
      investorName: directInvestorName || 'Investor',
      visitType: String(visitType).trim(),
      visitDate: visitDate || timestamp.split('T')[0],
      diagnosis: diagnosis ? String(diagnosis).trim() : undefined,
      treatment: treatment ? String(treatment).trim() : undefined,
      medication: medication ? String(medication).trim() : undefined,
      vaccination: vaccination ? String(vaccination).trim() : undefined,
      pregnancyStatus,
      observations: observations ? String(observations).trim() : undefined,
      findings: String(findings).trim(),
      recommendations: String(recommendations).trim(),
      followUpDate: followUpDate || undefined,
      photos: Array.isArray(photos) ? photos : [],
      documents: Array.isArray(documents) ? documents : [],
      status,
      reportStatus: isFinalized ? 'FINALIZED' : 'SUBMITTED',
      isFinalized: Boolean(isFinalized),
      finalizedAt: isFinalized ? timestamp : undefined,
      version: 1,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    db.veterinaryReports.unshift(report);
    saveDb();

    writeAuditLog(
      user.id,
      'veterinary_report_created',
      `report:${newReportId}`,
      null,
      { partnershipId, animalTagId, status },
      req.ip || '127.0.0.1'
    );

    res.status(201).json(report);
  });

  // Finalize Report (Locks from normal edit)
  app.post('/api/veterinary/reports/:id/finalize', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const { id } = req.params;

    const db = getDb();
    db.veterinaryReports ||= [];
    const report = db.veterinaryReports.find((r: VeterinaryReport) => r.id === id);
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    if (report.veterinarianId !== user.id && user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Only the authoring veterinarian can finalize this report.' });
    }

    report.isFinalized = true;
    report.reportStatus = 'FINALIZED';
    report.finalizedAt = new Date().toISOString();
    report.updatedAt = new Date().toISOString();

    saveDb();

    writeAuditLog(
      user.id,
      'veterinary_report_finalized',
      `vet_report:${id}`,
      null,
      { finalizedAt: report.finalizedAt },
      req.ip || '127.0.0.1'
    );

    res.json({
      success: true,
      message: 'Veterinary report successfully finalized. Record is now legally certified and locked against direct edits.',
      report
    });
  });

  // Versioned Amendment
  app.post('/api/veterinary/reports/:id/amend', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const { id } = req.params;
    const { reason, changes } = req.body;

    if (!reason || !changes) {
      return res.status(400).json({ error: 'Amendment reason and documented changes are required.' });
    }

    const db = getDb();
    db.veterinaryReports ||= [];
    const report = db.veterinaryReports.find((r: VeterinaryReport) => r.id === id);
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    if (report.veterinarianId !== user.id && user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Only the authoring veterinarian can issue an amendment to this certified report.' });
    }

    report.version = (report.version || 1) + 1;
    report.amendments ||= [];
    report.amendments.push({
      version: report.version,
      date: new Date().toISOString(),
      reason: String(reason).trim(),
      amendedBy: `${user.name} (${user.id})`,
      changes: String(changes).trim()
    });
    report.updatedAt = new Date().toISOString();

    saveDb();

    writeAuditLog(
      user.id,
      'veterinary_report_amendment_created',
      `vet_report:${id}`,
      null,
      { newVersion: report.version, reason },
      req.ip || '127.0.0.1'
    );

    res.json({
      success: true,
      message: `Amendment Version ${report.version} successfully appended with complete audit history.`,
      report
    });
  });

  // Downloadable structured report
  app.get('/api/reports/veterinary/:id/download', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const { id } = req.params;

    const db = getDb();
    db.veterinaryReports ||= [];
    const report = db.veterinaryReports.find((r: VeterinaryReport) => r.id === id);
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    const isAuthorized = 
      report.veterinarianId === user.id ||
      report.farmerId === user.id ||
      report.investorId === user.id ||
      user.role === UserRole.ADMIN;

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Access denied: You are not an authorized party for this veterinary record.' });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="vet_report_${report.animalTagId}_${report.id}.json"`);
    res.json({
      certificationTitle: 'SHAMBALOOP CERTIFIED VETERINARY HEALTH AUDIT',
      certificateNumber: `KVB-SL-${report.id.toUpperCase()}`,
      author: report.veterinarianName,
      veterinarianId: report.veterinarianId,
      issuedAt: report.createdAt,
      finalizedAt: report.finalizedAt || report.createdAt,
      status: report.status,
      animalTagId: report.animalTagId,
      diagnosis: report.diagnosis || 'None reported',
      clinicalFindings: report.findings,
      treatment: report.treatment || 'None',
      medication: report.medication || 'None',
      vaccination: report.vaccination || 'None',
      pregnancyStatus: report.pregnancyStatus || 'NOT_APPLICABLE',
      recommendations: report.recommendations,
      version: report.version || 1,
      amendments: report.amendments || []
    });
  });
}
