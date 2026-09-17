import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import express from 'express';
import { UserRole, UploadedFile } from '../src/types.js';
import { AuthenticatedRequest } from './types.js';
import { writeAuditLog } from './audit.js';

const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf'
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

export interface UploadOptions {
  isPrivate?: boolean;
  allowedRoles?: UserRole[];
}

export function registerUploadRoutes(
  app: express.Express, 
  authMiddleware: express.RequestHandler,
  getDb: () => any,
  saveDb: () => void
) {
  // Upload endpoint: supports base64 payload from Take Photo or File Picker
  app.post('/api/uploads', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Authentication required to upload files.' });
    }

    const { fileName, mimeType, base64Data, isPrivate = false } = req.body;
    if (!fileName || !mimeType || !base64Data) {
      return res.status(400).json({ error: 'Missing required upload fields: fileName, mimeType, and base64Data.' });
    }

    if (!ALLOWED_MIME_TYPES[mimeType]) {
      return res.status(400).json({ 
        error: `Invalid MIME type (${mimeType}). Only JPEG, PNG, WEBP, and PDF documents are permitted.` 
      });
    }

    // Strip base64 data prefix if present (e.g., "data:image/png;base64,...")
    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
    const fileBuffer = Buffer.from(cleanBase64, 'base64');

    if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
      return res.status(413).json({ 
        error: `File exceeds maximum allowed size of 10MB. Received: ${(fileBuffer.length / (1024 * 1024)).toFixed(2)}MB` 
      });
    }

    // Generate non-guessable random file ID
    const fileId = `doc_${Date.now()}_${crypto.randomBytes(12).toString('hex')}`;
    const extension = ALLOWED_MIME_TYPES[mimeType];
    const storageFilename = `${fileId}${extension}`;
    const storagePath = path.join(UPLOAD_DIR, storageFilename);

    try {
      fs.writeFileSync(storagePath, fileBuffer);
    } catch (err) {
      console.error('[UPLOAD ERROR]: Failed to persist file:', err);
      return res.status(500).json({ error: 'Internal error while persisting uploaded file.' });
    }

    const db = getDb();
    db.uploadedFiles ||= [];

    const fileMeta: UploadedFile = {
      id: fileId,
      originalName: String(fileName).slice(0, 150),
      mimeType,
      sizeBytes: fileBuffer.length,
      uploaderId: user.id,
      uploaderRole: user.role,
      url: `/api/uploads/${fileId}`,
      isPrivate: Boolean(isPrivate),
      createdAt: new Date().toISOString()
    };

    db.uploadedFiles.push(fileMeta);
    saveDb();

    writeAuditLog(
      user.id,
      'file_uploaded',
      `upload:${fileId}`,
      null,
      { originalName: fileMeta.originalName, mimeType, size: fileMeta.sizeBytes, isPrivate },
      req.ip || '127.0.0.1'
    );

    res.status(201).json({
      success: true,
      file: fileMeta
    });
  });

  // Secure download / retrieval endpoint with authorization check
  app.get('/api/uploads/:fileId', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user;
    const { fileId } = req.params;
    const db = getDb();
    db.uploadedFiles ||= [];

    const fileMeta = db.uploadedFiles.find((f: UploadedFile) => f.id === fileId);
    if (!fileMeta) {
      return res.status(404).json({ error: 'Requested document or image not found.' });
    }

    // Access control:
    // If private: only the uploader, admins, or participants with relevant access can view
    if (fileMeta.isPrivate) {
      const isUploader = user && user.id === fileMeta.uploaderId;
      const isAdmin = user && (user.role === UserRole.ADMIN || user.role === UserRole.VERIFIER);
      if (!isUploader && !isAdmin) {
        return res.status(403).json({ error: 'Access denied. You do not have authorization to view this private document.' });
      }
    }

    const extension = ALLOWED_MIME_TYPES[fileMeta.mimeType] || '.bin';
    const filePath = path.join(UPLOAD_DIR, `${fileMeta.id}${extension}`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File binary does not exist on disk storage.' });
    }

    res.setHeader('Content-Type', fileMeta.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${fileMeta.originalName}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
}
