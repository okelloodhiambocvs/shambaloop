import express from 'express';
import { UserRole, FarmRecord } from '../src/types.js';
import { AuthenticatedRequest } from './types.js';
import { writeAuditLog } from './audit.js';
import { canAccessFarm } from './uploadService.js';

export function registerFarmRecordsRoutes(
  app: express.Express,
  authMiddleware: express.RequestHandler,
  farmerOnlyMiddleware: express.RequestHandler,
  getDb: () => any,
  saveDb: () => void
) {
  // Farmer gets their chronological farm records
  app.get('/api/farmer/records', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Authentication credentials required.' });

    const db = getDb();
    db.farmRecords ||= [];

    let records: FarmRecord[] = [];
    if (user.role === UserRole.FARMER) {
      records = db.farmRecords.filter((r: FarmRecord) => r.farmerId === user.id);
    } else if (user.role === UserRole.INVESTOR) {
      // Find partnerships where this investor is a participant
      db.partnerships ||= [];
      const activePartnerFarmerIds = db.partnerships
        .filter((p: any) => p.investorId === user.id)
        .map((p: any) => p.farmerId);
      records = db.farmRecords.filter((r: FarmRecord) => activePartnerFarmerIds.includes(r.farmerId));
    } else if (user.role === UserRole.ADMIN) {
      records = db.farmRecords;
    } else {
      records = [];
    }

    // Sort chronologically descending (newest first)
    records.sort((a, b) => new Date(b.date || b.timestamp).getTime() - new Date(a.date || a.timestamp).getTime());

    res.json(records);
  });

  // Farmer creates a new chronological farm record
  app.post('/api/farmer/records', authMiddleware, farmerOnlyMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const {
      farmId,
      recordType,
      description,
      quantity,
      unit,
      date,
      quotationKES,
      actualPriceKES,
      rrpKES,
      supplierInfo,
      evidenceUrls,
      notes
    } = req.body;

    if (!recordType || !description || quantity === undefined) {
      return res.status(400).json({ 
        error: 'Record type, description, and quantity are required.' 
      });
    }

    const validRecordTypes = [
      'FEED', 'INPUTS', 'LIVESTOCK', 'EXPENSE', 
      'PRODUCTION', 'EVENT', 'VACCINATION', 'MILESTONE', 'PURCHASE', 'LOSS', 'OTHER'
    ];
    if (!validRecordTypes.includes(recordType)) {
      return res.status(400).json({
        error: `Invalid recordType. Must be one of: ${validRecordTypes.join(', ')}`
      });
    }

    if (typeof description !== 'string' || !description.trim() || !Number.isFinite(Number(quantity)) || Number(quantity) < 0 || [quotationKES, actualPriceKES, rrpKES].some(value => value !== undefined && (!Number.isFinite(Number(value)) || Number(value) < 0)) || (date && (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))))) return res.status(400).json({ error: 'Provide valid text, date, and non-negative finite quantities and prices.' });
    const normalizedFarmId = farmId ? String(farmId).trim().slice(0, 128) : `farm_${user.id}`;
    const db = getDb();
    if (!canAccessFarm(user, db, normalizedFarmId)) {
      return res.status(403).json({ error: 'You may only record activity for your own farm.' });
    }
    const newRecordId = `rec_${Date.now()}`;
    const timestamp = new Date().toISOString();

    const record: FarmRecord = {
      id: newRecordId,
      farmId: normalizedFarmId,
      farmerId: user.id,
      farmerName: user.name,
      recordType,
      description: String(description).trim().slice(0, 300),
      quantity: Number(quantity) || 0,
      unit: unit ? String(unit).trim().slice(0, 30) : undefined,
      date: date || timestamp.split('T')[0],
      quotationKES: quotationKES !== undefined ? Number(quotationKES) : undefined,
      actualPriceKES: actualPriceKES !== undefined ? Number(actualPriceKES) : undefined,
      rrpKES: rrpKES !== undefined ? Number(rrpKES) : undefined,
      supplierInfo: supplierInfo ? String(supplierInfo).trim().slice(0, 150) : undefined,
      evidenceUrls: Array.isArray(evidenceUrls) ? evidenceUrls.filter((u: any) => typeof u === 'string') : [],
      notes: notes ? String(notes).trim().slice(0, 1000) : undefined,
      timestamp,
      createdAt: timestamp,
      history: [
        {
          timestamp,
          action: 'CREATED',
          actorId: user.id,
          note: 'Record recorded in farm ledger'
        }
      ]
    };

    db.farmRecords ||= [];
    db.farmRecords.push(record);

    // If this is an operational expense with an actual price, log ledger transaction if funded
    if (recordType === 'EXPENSE' && actualPriceKES && actualPriceKES > 0) {
      db.ledgerTransactions ||= [];
      db.ledgerTransactions.push({
        id: `txn_${Date.now()}`,
        reference: `EXP_${Date.now()}`,
        userId: user.id,
        amountKES: Number(actualPriceKES),
        currency: 'KES',
        type: 'EXPENSE',
        category: 'OPERATIONAL',
        status: 'COMPLETED',
        relatedEntityId: newRecordId,
        relatedEntityType: 'FARM',
        description: `Farm Expense: ${description}`,
        payerId: user.id,
        payerName: user.name,
        timestamp
      });
    }

    saveDb();

    writeAuditLog(
      user.id,
      'farm_record_created',
      `record:${newRecordId}`,
      null,
      { recordType, description, actualPriceKES },
      req.ip || '127.0.0.1'
    );

    res.status(201).json({
      success: true,
      message: 'Farm record logged successfully to chronological history.',
      record
    });
  });
}
