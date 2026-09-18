import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { validSignature } from './uploadService.js';
import { UserRole, UploadedFile } from '../src/types.js';

const types: Record<string, UploadedFile['documentType']> = { passport_photo: 'PASSPORT_PHOTO', national_id_front: 'ID_FRONT', national_id_back: 'ID_BACK', chief_letter: 'CHIEF_LETTER', certifications: 'AGRICULTURAL_CERTIFICATE' };
const extensions: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'application/pdf': '.pdf' };
export function prepareDocuments(role: UserRole, input: unknown) {
  if (role === UserRole.INVESTOR) return [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Identity documentation is required.');
  return Object.keys(types).map(key => {
    const document = (input as any)[key];
    if (!document || typeof document.name !== 'string' || typeof document.dataUrl !== 'string') throw new Error(`Missing required document: ${key}.`);
    const match = /^data:(image\/(?:jpeg|png)|application\/pdf);base64,([A-Za-z0-9+/]+={0,2})$/.exec(document.dataUrl);
    if (!match) throw new Error('Documents must be JPEG, PNG, or PDF files.');
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > 2 * 1024 * 1024 || !validSignature(buffer, match[1])) throw new Error('Document content is invalid or exceeds 2 MB.');
    if (key === 'passport_photo' && match[1] === 'application/pdf') throw new Error('Passport photo must be an image.');
    return { key, buffer, mimeType: match[1], extension: extensions[match[1]], name: path.basename(document.name).replace(/[\x00-\x1f<>"\\]/g, '').slice(0, 150) };
  });
}
export function persistDocuments(userId: string, role: UserRole, documents: ReturnType<typeof prepareDocuments>): UploadedFile[] {
  const directory = path.join(process.env.DATA_DIR || path.join(process.cwd(), 'data'), 'uploads');
  fs.mkdirSync(directory, { recursive: true });
  const written: string[] = [];
  try {
    return documents.map(document => {
      const id = `doc_${crypto.randomUUID()}`;
      const destination = path.join(directory, id + document.extension);
      fs.writeFileSync(destination, document.buffer, { flag: 'wx', mode: 0o600 });
      written.push(destination);
      return { id, originalName: document.name, mimeType: document.mimeType, sizeBytes: document.buffer.length, uploaderId: userId, uploaderRole: role, url: `/api/uploads/${id}`, isPrivate: true, createdAt: new Date().toISOString(), documentType: document.key === 'certifications' && role === UserRole.VETERINARIAN ? 'KVB_LICENSE' : types[document.key] };
    });
  } catch (error) {
    for (const file of written) fs.unlinkSync(file);
    throw error;
  }
}
