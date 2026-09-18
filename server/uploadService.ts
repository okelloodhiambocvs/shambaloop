import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import express from 'express';
import { UserRole, UploadedFile } from '../src/types.js';
import { AuthenticatedRequest } from './types.js';
import { writeAuditLog } from './audit.js';

const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads');
const ALLOWED_MIME_TYPES: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'application/pdf': '.pdf' };
const DOCUMENT_TYPES = new Set([
  'VACCINATION_REPORT', 'FARM_PHOTO', 'FEED_RECEIPT', 'PAYMENT_RECEIPT', 
  'EVENT_DOCUMENT', 'VETERINARY_REPORT', 'INVESTMENT_VERIFICATION', 'OTHER',
  'KYC_DOCUMENT', 'CHIEF_LETTER', 'ID_FRONT', 'ID_BACK', 'PASSPORT_PHOTO', 
  'KVB_LICENSE', 'DEGREE_CERTIFICATE', 'FARM_TITLE_DEED', 'AGRICULTURAL_CERTIFICATE'
]);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const cleanText = (value: unknown, maximum: number) => typeof value === 'string' ? value.normalize('NFKC').replace(/[\u0000-\u001F\u007F<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, maximum) : '';
function validSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === 'image/jpeg') return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === 'image/png') return buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimeType === 'image/webp') return buffer.length > 12 && buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP';
  return mimeType === 'application/pdf' && buffer.length > 5 && buffer.subarray(0, 5).toString() === '%PDF-';
}

/** Establishes a relationship from persisted collaboration data; it never trusts a client-supplied user id. */
export function canAccessFarm(user: any, db: any, farmId: string) {
  if (user.role === UserRole.ADMIN) return true;
  const partnerships = db.partnerships || [], jobs = db.veterinaryJobs || [];
  if (user.role === UserRole.FARMER) return farmId === `farm_${user.id}` || partnerships.some((p: any) => p.farmerId === user.id && (p.id === farmId || `farm_${p.farmerId}` === farmId));
  if (user.role === UserRole.INVESTOR) return partnerships.some((p: any) => p.investorId === user.id && (p.id === farmId || `farm_${p.farmerId}` === farmId));
  if (user.role === UserRole.VETERINARIAN) return jobs.some((j: any) => j.assignedVetId === user.id && j.farmId === farmId && ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'INCOMPLETE'].includes(j.status));
  return false;
}

export function registerUploadRoutes(app: express.Express, authMiddleware: express.RequestHandler, getDb: () => any, saveDb: () => void) {
  app.post('/api/uploads', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const { fileName, mimeType, base64Data, farmId, documentType = 'OTHER', description, relatedReportId, relatedInvestmentBriefId } = req.body;
    const originalName = cleanText(fileName, 150), extension = typeof mimeType === 'string' ? ALLOWED_MIME_TYPES[mimeType] : undefined;
    if (!originalName || typeof base64Data !== 'string' || !extension) return res.status(400).json({ error: 'An allowed fileName, mimeType, and base64Data are required.' });
    if (path.extname(originalName).toLowerCase() !== extension || !DOCUMENT_TYPES.has(documentType)) return res.status(400).json({ error: 'File extension or document type is invalid.' });
    const encoded = base64Data.replace(/^data:[^;]+;base64,/, '');
    if (!/^[A-Za-z0-9+\/=\r\n]+$/.test(encoded)) return res.status(400).json({ error: 'File payload is not valid base64.' });
    const fileBuffer = Buffer.from(encoded, 'base64');
    if (!fileBuffer.length || fileBuffer.length > MAX_FILE_SIZE_BYTES) return res.status(fileBuffer.length > MAX_FILE_SIZE_BYTES ? 413 : 400).json({ error: 'File must be non-empty and no larger than 10MB.' });
    if (!validSignature(fileBuffer, mimeType)) return res.status(400).json({ error: 'File content does not match its declared type.' });
    const db = getDb(); db.uploadedFiles ||= [];
    const scopedFarmId = farmId ? cleanText(farmId, 128) : undefined;
    const canUploadFarmDocument = scopedFarmId && (user.role === UserRole.ADMIN || ((user.role === UserRole.FARMER || user.role === UserRole.VETERINARIAN) && canAccessFarm(user, db, scopedFarmId)));
    if (scopedFarmId && !canUploadFarmDocument) return res.status(403).json({ error: 'You are not authorized to attach a document to this farm.' });
    if (relatedReportId && !db.veterinaryReports?.some((r: any) => r.id === relatedReportId && r.veterinarianId === user.id)) return res.status(403).json({ error: 'Only the report author may attach report evidence.' });
    if (relatedInvestmentBriefId && !(user.role === UserRole.INVESTOR && db.investorCriteria?.some((c: any) => c.id === relatedInvestmentBriefId && c.investorId === user.id))) return res.status(403).json({ error: 'Only the owning investor may attach investment verification files.' });
    const id = `doc_${Date.now()}_${crypto.randomBytes(12).toString('hex')}`;
    try { fs.writeFileSync(path.join(UPLOAD_DIR, `${id}${extension}`), fileBuffer, { flag: 'wx' }); } catch { return res.status(500).json({ error: 'Unable to persist the uploaded file.' }); }
    const file: UploadedFile = { id, originalName, mimeType, sizeBytes: fileBuffer.length, uploaderId: user.id, uploaderRole: user.role, url: `/api/uploads/${id}`, isPrivate: Boolean(scopedFarmId || relatedReportId || relatedInvestmentBriefId), createdAt: new Date().toISOString(), farmId: scopedFarmId, documentType, description: cleanText(description, 500) || undefined, relatedReportId: cleanText(relatedReportId, 128) || undefined, relatedInvestmentBriefId: cleanText(relatedInvestmentBriefId, 128) || undefined };
    db.uploadedFiles.push(file); saveDb();
    writeAuditLog(user.id, 'file_uploaded', `upload:${id}`, null, { farmId: file.farmId, documentType, mimeType, sizeBytes: file.sizeBytes }, req.ip || '127.0.0.1');
    res.status(201).json({ success: true, file });
  });

  app.get('/api/uploads/my', authMiddleware, (req: AuthenticatedRequest, res) => {
    const db = getDb(), user = req.user!;
    const myFiles = (db.uploadedFiles || []).filter((file: UploadedFile) => file.uploaderId === user.id);
    res.json(myFiles);
  });

  app.get('/api/farms/:farmId/documents', authMiddleware, (req: AuthenticatedRequest, res) => {
    const db = getDb(), user = req.user!;
    if (!canAccessFarm(user, db, req.params.farmId)) return res.status(403).json({ error: 'You are not related to this farm.' });
    res.json((db.uploadedFiles || []).filter((file: UploadedFile) => file.farmId === req.params.farmId));
  });

  app.get('/api/uploads/:fileId', authMiddleware, (req: AuthenticatedRequest, res) => {
    const db = getDb(), user = req.user!, file = (db.uploadedFiles || []).find((item: UploadedFile) => item.id === req.params.fileId);
    if (!file) return res.status(404).json({ error: 'Requested document or image not found.' });
    const authorized = user.role === UserRole.ADMIN || file.uploaderId === user.id || Boolean(file.farmId && canAccessFarm(user, db, file.farmId)) || Boolean(file.relatedReportId && db.veterinaryReports?.some((r: any) => r.id === file.relatedReportId && [r.veterinarianId, r.farmerId, r.investorId].includes(user.id))) || Boolean(file.relatedInvestmentBriefId && user.role === UserRole.INVESTOR && db.investorCriteria?.some((c: any) => c.id === file.relatedInvestmentBriefId && c.investorId === user.id));
    if (!authorized) return res.status(403).json({ error: 'You are not authorized to download this document.' });
    const filePath = path.join(UPLOAD_DIR, `${file.id}${ALLOWED_MIME_TYPES[file.mimeType]}`);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File storage entry is unavailable.' });
    res.setHeader('Content-Type', file.mimeType); res.setHeader('Content-Disposition', `attachment; filename="${file.originalName.replace(/[\r\n"]/g, '')}"`); res.setHeader('X-Content-Type-Options', 'nosniff');
    fs.createReadStream(filePath).pipe(res);
  });
}
