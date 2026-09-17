import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY || 'shambaloop_top_secret_encrypt_key_32bytes_v1';
const hashedKey = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest(); // Guarantees 32 bytes

export function encrypt(text: string): { iv: string; content: string; tag: string } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', hashedKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return {
    iv: iv.toString('hex'),
    content: encrypted,
    tag: tag
  };
}

export function decrypt(encryptedObj: { iv: string; content: string; tag: string }): string {
  const decipher = crypto.createDecipheriv('aes-256-gcm', hashedKey, Buffer.from(encryptedObj.iv, 'hex'));
  decipher.setAuthTag(Buffer.from(encryptedObj.tag, 'hex'));
  let decrypted = decipher.update(encryptedObj.content, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function encryptField(text: string): string {
  if (!text) return text;
  if (text.startsWith('enc_v1:')) return text; // Already encrypted
  const enc = encrypt(text);
  return `enc_v1:${enc.iv}:${enc.tag}:${enc.content}`;
}

export function decryptField(text: string): string {
  if (!text || !text.startsWith('enc_v1:')) return text;
  try {
    const parts = text.split(':');
    const encryptedObj = {
      iv: parts[1],
      tag: parts[2],
      content: parts[3]
    };
    return decrypt(encryptedObj);
  } catch (err) {
    console.error('[DECRYPTION ERROR]: Fallback triggered.', err);
    return text;
  }
}
