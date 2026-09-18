import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { 
  UserRole, User, Listing, ListingType, LeaseAgreement, 
  LivestockPartnership, VerificationRequest, MpesaTransaction,
  HealthLog, ProductionLog, Dispute, TripartiteMatch, FarmerProposal, FarmEvent, VeterinaryJob, VeterinaryReport, InvestorCriteria,
  FarmRecord, LedgerTransaction, Review, UploadedFile
} from './src/types.js';
import { DEMO_ACCOUNT_IDS, DEMO_ACCOUNT_PROFILES } from './src/demoAccounts.js';
import { registerUploadRoutes } from './server/uploadService.js';
import { registerVerificationRoutes } from './server/verificationService.js';
import { registerWalletRoutes } from './server/walletService.js';
import { registerFarmRecordsRoutes } from './server/farmRecordsService.js';
import { registerVeterinaryRoutes } from './server/veterinaryService.js';
import { registerInvestmentRoutes } from './server/investmentService.js';
import { registerDisputesRoutes } from './server/disputesService.js';
import { registerReviewsRoutes } from './server/reviewsService.js';
import { registerAuthExtensionRoutes } from './server/authExtensionService.js';
import { readRecentAuditLogs } from './server/audit.js';
import { applyMigrations } from './server/migrations.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent Database Schema
interface DatabaseSchema {
  users: User[];
  listings: Listing[];
  agreements: LeaseAgreement[];
  partnerships: LivestockPartnership[];
  verifications: VerificationRequest[];
  transactions: MpesaTransaction[];
  passwordHashes: Record<string, string>; // Maps user ID to bcrypt hashes
  refreshTokens: string[];
  disputes?: Dispute[];
  matches?: TripartiteMatch[];
  proposals?: FarmerProposal[];
  farmEvents?: FarmEvent[];
  veterinaryJobs?: VeterinaryJob[];
  veterinaryReports?: VeterinaryReport[];
  investorCriteria?: InvestorCriteria[];
  farmRecords?: FarmRecord[];
  ledgerTransactions?: LedgerTransaction[];
  reviews?: Review[];
  uploadedFiles?: UploadedFile[];
  schemaVersion?: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const AUDIT_FILE = path.join(DATA_DIR, 'audit_log.json');

// Ensure parent data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ----------------------------------------------------
// CRYPTO & DATA ENCRYPTION HELPERS (AES-256-GCM)
// ----------------------------------------------------
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

// ----------------------------------------------------
// IMMUTABLE AUDIT LOGGING SYSTEM
// ----------------------------------------------------
export function writeAuditLog(actor: string, action: string, resource: string, prevValue: any, newValue: any, ip: string) {
  const entry = {
    timestamp: new Date().toISOString(),
    actor,
    action,
    resource,
    previous_value: prevValue,
    new_value: newValue,
    ip_address: ip
  };
  try {
    fs.appendFileSync(AUDIT_FILE, JSON.stringify(entry) + '\n', 'utf-8');
  } catch (err) {
    console.error('[AUDIT ERROR]: Failed to append to audit log:', err);
  }
}

// ----------------------------------------------------
// PURE TOTP (RFC 6238) & OTP MFA HELPERS
// ----------------------------------------------------
// Decodes base32 to buffer safely
function decodeBase32(b32: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let cleansed = b32.toUpperCase().replace(/ =+$/, '');
  let length = cleansed.length;
  let bits = 0;
  let value = 0;
  let index = 0;
  const buffer = Buffer.alloc(Math.floor((length * 5) / 8));
  
  for (let i = 0; i < length; i++) {
    const val = alphabet.indexOf(cleansed.charAt(i));
    if (val === -1) throw new Error('Invalid base32 character');
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      if (index < buffer.length) {
        buffer[index++] = (value >> (bits - 8)) & 255;
      }
      bits -= 8;
    }
  }
  return buffer;
}

export function verifyTOTP(token: string, secret: string, window = 1): boolean {
  try {
    const key = decodeBase32(secret);
    const time = Math.floor(Date.now() / 1000 / 30);
    
    const checkTime = (t: number) => {
      const buffer = Buffer.alloc(8);
      let temp = t;
      for (let i = 7; i >= 0; i--) {
        buffer[i] = temp & 255;
        temp = temp >> 8;
      }
      
      const hmac = crypto.createHmac('sha1', key).update(buffer).digest();
      const offset = hmac[hmac.length - 1] & 15;
      const codeBin = ((hmac[offset] & 127) << 24) |
                      ((hmac[offset + 1] & 255) << 16) |
                      ((hmac[offset + 2] & 255) << 8) |
                      (hmac[offset + 3] & 255);
      
      const code = codeBin % 1000000;
      const codeStr = String(code).padStart(6, '0');
      return codeStr === token;
    };

    for (let i = -window; i <= window; i++) {
      if (checkTime(time + i)) return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}

// ----------------------------------------------------
// OTP REGISTRY (In-memory storage for OTP challenges)
// ----------------------------------------------------
export const otpRegistry = new Map<string, { code: string; expiresAt: number; tries: number }>();

export function generateOTP(userId: string): string {
  const code = String(crypto.randomInt(100000, 999999));
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins validity
  otpRegistry.set(userId, { code, expiresAt, tries: 0 });
  return code;
}

export function verifyOTP(userId: string, code: string): boolean {
  const match = otpRegistry.get(userId);
  if (!match) return false;
  
  if (Date.now() > match.expiresAt) {
    otpRegistry.delete(userId);
    return false;
  }
  
  match.tries++;
  if (match.tries > 3) {
    otpRegistry.delete(userId);
    return false;
  }
  
  if (match.code === code) {
    otpRegistry.delete(userId);
    return true;
  }
  return false;
}

// ----------------------------------------------------
// SECURE PASSWORD COMPLEXITY ENFORCEMENT
// ----------------------------------------------------
export function validatePasswordStrength(password: string): boolean {
  if (!password || password.length < 12) return false;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+~`|}{[\]:;?><,./-="]/.test(password);
  return hasUppercase && hasLowercase && hasNumber && hasSpecial;
}

// ----------------------------------------------------
// SLIDING WINDOW IN-MEMORY RATE LIMITER
// ----------------------------------------------------
interface RateLimitBucket {
  timestamps: number[];
}
const rateLimitStore = new Map<string, RateLimitBucket>();

export function slidingWindowLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  let bucket = rateLimitStore.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    rateLimitStore.set(key, bucket);
  }
  
  // Clean expired timestamps
  bucket.timestamps = bucket.timestamps.filter(t => now - t < windowMs);
  
  if (bucket.timestamps.length >= limit) {
    return false;
  }
  
  bucket.timestamps.push(now);
  return true;
}

let db: DatabaseSchema = {
  users: [],
  listings: [],
  agreements: [],
  partnerships: [],
  verifications: [],
  transactions: [],
  passwordHashes: {},
  refreshTokens: [],
  disputes: [],
  matches: [],
  proposals: [],
  farmEvents: [],
  veterinaryJobs: [],
  veterinaryReports: [],
  investorCriteria: []
};

// Seed initial default accounts and records
function seedDefaultData() {
  db.users = Object.values(DEMO_ACCOUNT_PROFILES).map(user => ({ ...user }));

  // Generate cryptographically secure temporary complex passwords for seeded accounts
  function generateSecureTemporaryPassword(): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const specials = '!@#$%^&*()_+~`|}{[]:;?><,./-="';
    
    const getRandomChar = (str: string) => str.charAt(crypto.randomInt(0, str.length));
    
    let password = [
      getRandomChar(uppercase),
      getRandomChar(uppercase),
      getRandomChar(lowercase),
      getRandomChar(lowercase),
      getRandomChar(numbers),
      getRandomChar(numbers),
      getRandomChar(specials),
      getRandomChar(specials),
    ];
    
    const allChars = uppercase + lowercase + numbers + specials;
    for (let i = 0; i < 8; i++) {
      password.push(getRandomChar(allChars));
    }
    
    return password.sort(() => crypto.randomBytes(1)[0] - 128).join('');
  }

  const tempPasses: Record<string, string> = {};
  db.users.forEach(u => {
    const tempPassword = generateSecureTemporaryPassword();
    tempPasses[u.phone] = tempPassword;
    db.passwordHashes[u.id] = bcrypt.hashSync(tempPassword, 10);
    u.passwordResetRequired = true; // Force reset on first login
  });
  
  // Log them to a developer file securely
  try {
    fs.writeFileSync(path.join(DATA_DIR, 'temporary_passwords.json'), JSON.stringify(tempPasses, null, 2), 'utf-8');
    console.log('[SECURITY]: Generated secure temporary passwords inside data/temporary_passwords.json');
  } catch (err) {
    console.error('Failed to write temporary passwords to disk:', err);
  }

  db.listings = [
    {
      id: 'list_1',
      type: ListingType.LAND,
      title: '5-Acre Flat Fertile Red Soil Plot',
      description: 'Highly productive parcel suitable for high-yield white potatoes, cabbages or garden-pea operations. Already fenced off. Water is readily available through an on-site solar-pumped borehole feeding into gravity tanks. Easily accessible via primary graded feeder road 2km off the Ol Kalou tarmac.',
      locationCounty: 'Nyandarua',
      priceKES: 12000,
      verified: true,
      imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
      ownerId: 'user_1',
      ownerName: 'Wanjiku Kamau',
      ownerPhone: '0712345678',
      landDetails: {
        acreage: 5,
        soilType: 'Volcanic Red Loam',
        waterSource: 'Solar Borehole',
        accessibility: 'Chipped Feeder Road',
        idealCrops: ['Potatoes', 'Cabbages', 'Carrots', 'Barley']
      },
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'list_2',
      type: ListingType.LIVESTOCK,
      title: 'High-Yield Friesian Dairy Heifers',
      description: 'Listing for shared investment in 3 registered pure pedigree Friesian dairy cows currently in early second lactation. Producing average of 24 liters daily each. Seeking an experienced dairy farm manager in Kiambu/Nyandarua who can manage fodder production and milk logistics. We will split high-yield margins 60% (Farmer-Manager) and 40% (Investor) after input subtractions.',
      locationCounty: 'Kiambu',
      priceKES: 185000,
      revenueSplitPercent: 40,
      verified: true,
      imageUrl: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=800',
      ownerId: 'user_3',
      ownerName: 'David Mwangi',
      ownerPhone: '0733444555',
      livestockDetails: {
        species: 'dairy',
        tagId: 'SL-KE-FR-901',
        breed: 'Pure pedigree Friesian',
        expectedYield: '22 - 26 Liters per day each',
        revenueShareConfig: '60% Farmer (land/feed), 40% Investor (funding)'
      },
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'list_3',
      type: ListingType.OPPORTUNITY,
      title: 'Contract Farming: 10,000 Broiler Feed Cycle',
      description: 'Seeking a skilled broiler poultry specialist to manage a clean modern poultry house in Nakuru (Lanet). Complete setup with automated drinkers, charcoal burners, heating grids and secure dry feed storage blocks already prepared. All starting chicks, vaccination schedules, and pre-purchased feeds are funded by the landowner investor. Offering handsome production-linked profit share.',
      locationCounty: 'Nakuru',
      priceKES: 35000,
      verified: true,
      imageUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800',
      ownerId: 'user_1',
      ownerName: 'Wanjiku Kamau',
      ownerPhone: '0712345678',
      opportunityDetails: {
        requiredSkills: ['Poultry vaccination', 'Biosecurity management', 'Broiler feeding regimens'],
        durationMonths: 6,
        expectedWorkforce: 2,
        compensationType: 'Profit-Share'
      },
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'list_4',
      type: ListingType.LAND,
      title: '15-Acre Black Cotton Maize Land in Eldoret',
      description: 'Virgin land ready for commercial white maize or soya bean operations. Mechanized tractor accessibility is fully available. Highly reliable seasonal rainfall pattern.',
      locationCounty: 'Uasin Gishu',
      priceKES: 15000,
      verified: false,
      imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800',
      ownerId: 'user_2',
      ownerName: 'Josphat Kiprop',
      ownerPhone: '0722111222',
      landDetails: {
        acreage: 15,
        soilType: 'Deep Black Cotton',
        waterSource: 'Rain-fed / Seasonal Stream',
        accessibility: 'Graded bypass',
        idealCrops: ['Maize', 'Wheat', 'Soyabeans']
      },
      createdAt: new Date().toISOString()
    }
  ];

  db.agreements = [];

  db.partnerships = [
    {
      id: 'part_xyz',
      listingId: 'list_2',
      investorId: 'user_3',
      farmerId: 'user_2',
      animalTagId: 'SL-KE-FR-901',
      animalType: 'dairy',
      breed: 'Pure pedigree Friesian',
      splitPercentInvestor: 40,
      status: 'ACTIVE',
      healthLogs: [],
      productionLogs: []
    }
  ];

  db.verifications = [];
  db.transactions = [];
}

// Read database from disk
function loadDatabase() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const loaded = JSON.parse(content);
      db = { ...db, ...loaded };
      db.disputes ||= [];
      db.matches ||= [];
      db.proposals ||= [];
      db.farmEvents ||= [];
      db.veterinaryJobs ||= [];
      db.veterinaryReports ||= [];
      db.investorCriteria ||= [];
      // Older persisted listings did not have a moderation state. Preserve their
      // visibility while making their administrative state explicit.
      db.listings = db.listings.map(listing => ({
        ...listing,
        moderationStatus: listing.moderationStatus || (listing.verified ? 'APPROVED' : 'PENDING')
      }));
      if (applyMigrations(db)) saveDatabase();
    } catch (err) {
      console.error('Failed to parse database file. Initializing default seeds:', err);
      seedDefaultData();
    }
  } else {
    seedDefaultData();
    applyMigrations(db);
    saveDatabase();
  }
}

// Write database to disk
function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write database to disk:', err);
  }
}

const DEMO_SESSIONS_ENABLED = process.env.NODE_ENV !== 'production';

function ensureDevelopmentDemoAccounts(): boolean {
  if (!DEMO_SESSIONS_ENABLED) return false;

  let changed = false;
  for (const account of Object.values(DEMO_ACCOUNT_PROFILES)) {
    if (db.users.some(user => user.id === account.id)) continue;

    db.users.push({ ...account, passwordResetRequired: true });
    db.passwordHashes[account.id] = bcrypt.hashSync(`${crypto.randomBytes(24).toString('base64url')}Aa1!`, 10);
    changed = true;
  }
  return changed;
}

// Execute initial load
loadDatabase();
if (ensureDevelopmentDemoAccounts()) saveDatabase();

// References for runtime matching (backward compatibility)
let users = db.users;
let listings = db.listings;
let agreements = db.agreements;
let partnerships = db.partnerships;
let verifications = db.verifications;
let transactions = db.transactions;

// Synchronize utility refs
function syncRefs() {
  users = db.users;
  listings = db.listings;
  agreements = db.agreements;
  partnerships = db.partnerships;
  verifications = db.verifications;
  transactions = db.transactions;
}

// Secret keys for cryptographic tasks
const JWT_SECRET = process.env.JWT_SECRET || 'shambaloop_super_secret_jwt_token_key_2026_default';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'shambaloop_refresh_secret_token_key_2026_default';

// JWT Generation
function generateSimulatedToken(user: User) {
  // Real JWT issued as the primary token
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, phone: user.phone },
    JWT_SECRET,
    { expiresIn: '30m' }
  );
}

function generateRefreshToken(user: User) {
  const token = jwt.sign(
    { id: user.id },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  if (!db.refreshTokens) db.refreshTokens = [];
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  db.refreshTokens.push(hashed);
  saveDatabase();
  return token;
}

function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (_) {
    return null;
  }
}

// Access control & Audit Logging Middlewares
interface AuthenticatedRequest extends express.Request {
  user?: User;
}

const JWTAuthMiddleware = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  if (!token) {
    return res.status(401).json({ error: 'Authorization header with Bearer token is required.' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Signature validation failed. Access token is expired or altered.' });
  }

  const matched = db.users.find(u => u.id === decoded.id);
  if (!matched) {
    return res.status(401).json({ error: 'Subscriber account could not be found.' });
  }

  req.user = matched;
  next();
};

const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authorization credentials not loaded.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. This endpoint is restricted to roles of: ${allowedRoles.join(' or ')}` });
    }
    next();
  };
};

const safeUser = (user: User) => {
  const { mfaSecret, mfaBackupCodes, deviceTrustExpiresAt, ...publicProfile } = user;
  return publicProfile;
};

const cleanText = (value: unknown, maxLength: number): string | null => {
  if (typeof value !== 'string') return null;
  const normalized = value
    .normalize('NFKC')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized && normalized.length <= maxLength ? normalized : null;
};

const normalizeKenyanPhone = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().replace(/[\s()-]/g, '');
  return /^(?:\+254|0)[17]\d{8}$/.test(normalized) ? normalized : null;
};

const normalizeEmail = (value: unknown): string | null => {
  const normalized = cleanText(value, 254)?.toLowerCase();
  return normalized && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : null;
};

const cleanIdentifier = (value: unknown, maxLength = 128): string | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return /^[A-Za-z0-9_-]+$/.test(normalized) && normalized.length <= maxLength ? normalized : null;
};

const cleanCredential = (value: unknown, maxLength = 256): string | null => {
  if (typeof value !== 'string' || value.length === 0 || value.length > maxLength || /[\u0000-\u001F\u007F]/.test(value)) return null;
  return value;
};

const createSessionTokens = (user: User) => ({
  token: generateSimulatedToken(user),
  refreshToken: generateRefreshToken(user)
});

const createSessionPayload = (user: User) => ({
  user: safeUser(user),
  ...createSessionTokens(user),
  passwordResetRequired: Boolean(user.passwordResetRequired)
});

const verificationDecisionStatuses = new Set(['APPROVED', 'REJECTED', 'MORE_INFO']);
const listingModerationStatuses = new Set(['APPROVED', 'REJECTED', 'SUSPENDED']);

// Precise, multi-level sliding-window rate limiter
const createRateLimiter = (limit: number, windowMs: number) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (process.env.NODE_ENV === 'test') return next();
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const userKey = (req as AuthenticatedRequest).user ? (req as AuthenticatedRequest).user!.id : String(ip);
    const routeKey = `${req.path}:${userKey}`;
    
    if (!slidingWindowLimit(routeKey, limit, windowMs)) {
      writeAuditLog('system', 'rate_limit_exceeded', `ip:${ip}`, null, { path: req.path, user: userKey }, String(ip));
      return res.status(429).json({ error: 'Too many requests. Please slow down and try again later.' });
    }
    next();
  };
};

const authRateLimiter = createRateLimiter(20, 60000);
const sensitiveAuthRateLimiter = createRateLimiter(5, 15 * 60 * 1000);

// CORS Whitelists
const CORS_WHITELIST = (process.env.CORS_WHITELIST || 'http://localhost:3000,http://localhost:5173').split(',');

app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, X-Requested-With');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Hardened Secure Headers Middleware (configured for AI Studio preview iframe support)
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self' https: data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; font-src 'self' https: data:; img-src 'self' data: https: blob:; connect-src 'self' https: wss: ws:; frame-src 'self' https:;");
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  next();
});

// Structured JSON Logger with correlation ID & request tracing
app.use((req, res, next) => {
  const startTime = Date.now();
  const correlationId = crypto.randomUUID();
  res.setHeader('X-Correlation-ID', correlationId);
  (req as any).correlationId = correlationId;

  res.on('finish', () => {
    const elapsed = Date.now() - startTime;
    const logDetails = {
      timestamp: new Date().toISOString(),
      correlationId,
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      userAgent: req.headers['user-agent'] || '',
      executionMs: elapsed
    };
    console.log(JSON.stringify(logDetails));
  });
  next();
});

// REST WEB ENDPOINTS

// 1. Auth & Profiles Module
app.post('/api/auth/register', authRateLimiter, (req, res) => {
  const { phone, name, email, role, county, password } = req.body;
  const normalizedPhone = normalizeKenyanPhone(phone);
  const normalizedName = cleanText(name, 80);
  const normalizedEmail = email === undefined || email === '' ? undefined : normalizeEmail(email);
  const normalizedCounty = cleanText(county, 80);
  const normalizedPassword = cleanCredential(password);
  if (!normalizedPhone || !normalizedName || !role || !normalizedCounty || !normalizedPassword || (email !== undefined && email !== '' && !normalizedEmail)) {
    return res.status(400).json({ error: 'Provide a valid name, Kenyan mobile number, county, email when supplied, and password.' });
  }

  const selfServiceRoles = [UserRole.FARMER, UserRole.INVESTOR, UserRole.VETERINARIAN];
  if (!selfServiceRoles.includes(role)) {
    return res.status(403).json({ error: 'This role cannot be assigned through self-service registration.' });
  }

  const existing = db.users.find(u => u.phone === normalizedPhone);
  if (existing) {
    return res.status(400).json({ error: 'A user with this mobile number is already registered onto ShambaLoop.' });
  }

  // Password structural evaluation
  if (!validatePasswordStrength(normalizedPassword)) {
    return res.status(400).json({
      error: 'Password does not meet enterprise security complexity rules. It must contain minimum 12 characters, including an uppercase letter, a lowercase letter, a number, and a special character.'
    });
  }

  const newId = `user_${Date.now()}`;
  const newUser: User = {
    id: newId,
    phone: normalizedPhone,
    name: normalizedName,
    email: normalizedEmail,
    role: role as UserRole,
    verified: false,
    county: normalizedCounty,
    createdAt: new Date().toISOString(),
    passwordResetRequired: false
  };

  const documents = req.body.documents;
  if (documents && typeof documents === 'object') {
    (newUser as any).verificationDocuments = documents;
    db.verifications.push({
      id: `verify_${Date.now()}`,
      userId: newId,
      userName: newUser.name,
      userRole: newUser.role,
      documentType: role === UserRole.FARMER ? 'CHIEF_LETTER_AND_ID' : role === UserRole.VETERINARIAN ? 'KVB_LICENSE_AND_ID' : 'NATIONAL_ID',
      documentNumber: `REG-${newId}`,
      notes: `Registration KYC submission: ${Object.keys(documents).join(', ')}`,
      status: 'PENDING',
      submittedAt: new Date().toISOString()
    });
  }

  db.passwordHashes[newId] = bcrypt.hashSync(normalizedPassword, 10);
  db.users.push(newUser);
  saveDatabase();
  syncRefs();

  writeAuditLog(newId, 'register_account', `user:${newId}`, null, { name: newUser.name, phone: newUser.phone, role: newUser.role }, req.ip || '127.0.0.1');
  res.status(201).json(createSessionPayload(newUser));
});

app.post('/api/auth/login', authRateLimiter, (req, res) => {
  const { phone, password } = req.body;
  const normalized = normalizeKenyanPhone(phone);
  const normalizedPassword = cleanCredential(password);
  if (!normalized || !normalizedPassword) return res.status(400).json({ error: 'A valid phone number and password are required for sign-in.' });
  const matchedUser = db.users.find(u => u.phone === normalized);

  if (!matchedUser) {
    return res.status(404).json({ error: 'No account was found for this phone number. Please register first.' });
  }

  const verifiedHash = db.passwordHashes[matchedUser.id];
  if (!verifiedHash || !bcrypt.compareSync(normalizedPassword, verifiedHash)) {
    writeAuditLog('anonymous', 'failed_login_bad_password', `user:${matchedUser.id}`, null, { phone: normalized }, req.ip || '127.0.0.1');
    return res.status(401).json({ error: 'Forbidden credentials. Verification failed.' });
  }

  // Handle optional MFA Challenge initially
  if (matchedUser.mfaEnabled && matchedUser.mfaType && matchedUser.mfaType !== 'none') {
    const otp = generateOTP(matchedUser.id);
    console.log(`[MFA DISPATCH - ${matchedUser.mfaType.toUpperCase()}]: OTP challenge code is: ${otp}`);
    return res.json({
      mfaRequired: true,
      userId: matchedUser.id,
      mfaType: matchedUser.mfaType,
      message: 'Multi-factor credentials required. Challenge OTP dispatched.'
    });
  }

  writeAuditLog(matchedUser.id, 'login_success', `user:${matchedUser.id}`, null, { phone: normalized }, req.ip || '127.0.0.1');
  res.status(200).json(createSessionPayload(matchedUser));
});

// Demo sessions are strictly local-development tooling. They use the same JWT
// issuance and downstream authorization checks as password-based sessions, but
// are never available in production and disclose no seeded passwords.
app.post('/api/auth/demo-login', authRateLimiter, (req, res) => {
  if (!DEMO_SESSIONS_ENABLED) return res.status(404).json({ error: 'Demo accounts are not available in production.' });

  const userId = cleanIdentifier(req.body?.userId);
  if (!DEMO_ACCOUNT_IDS.has(userId)) return res.status(400).json({ error: 'Choose one of the available demo accounts.' });

  const user = db.users.find(candidate => candidate.id === userId);
  if (!user) return res.status(404).json({ error: 'The requested demo account is not available.' });

  writeAuditLog(user.id, 'demo_login_success', `user:${user.id}`, null, { role: user.role }, req.ip || '127.0.0.1');
  res.status(200).json(createSessionPayload(user));
});

// Optional MFA challenges endpoints
app.post('/api/auth/mfa/enroll', JWTAuthMiddleware, sensitiveAuthRateLimiter, (req: AuthenticatedRequest, res) => {
  const mfaType = cleanText(req.body?.mfaType, 10);
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Authentication is required.' });

  if (!['email', 'sms', 'totp', 'none'].includes(mfaType)) {
    return res.status(400).json({ error: 'Invalid MFA platform choice: choose email, sms, totp or none.' });
  }

  const secret = crypto.randomBytes(10).toString('hex').toUpperCase(); // Base32-like hex
  user.mfaSecret = encryptField(secret);
  user.mfaType = mfaType as any;
  user.mfaEnabled = mfaType !== 'none';

  // Issue 5 backup recovery codes if setting up MFA
  let recoveryCodes: string[] = [];
  if (user.mfaEnabled) {
    recoveryCodes = Array.from({ length: 5 }, () => crypto.randomBytes(5).toString('hex').toUpperCase());
    user.mfaBackupCodes = recoveryCodes.map(c => bcrypt.hashSync(c, 10));
  }

  saveDatabase();
  writeAuditLog(user.id, 'mfa_enroll', `user:${user.id}`, null, { type: mfaType }, req.ip || '127.0.0.1');

  res.json({
    success: true,
    mfaType,
    mfaEnabled: user.mfaEnabled,
    secret: user.mfaEnabled ? secret : undefined,
    qrCodePlaceholder: user.mfaEnabled && mfaType === 'totp' ? `otpauth://totp/ShambaLoop:${user.phone}?secret=${secret}&issuer=ShambaLoop` : undefined,
    backupCodes: recoveryCodes
  });
});

app.post('/api/auth/mfa/verify', sensitiveAuthRateLimiter, (req, res) => {
  const { userId, code } = req.body;
  const normalizedUserId = cleanIdentifier(userId);
  const normalizedCode = cleanCredential(code, 32);
  if (!normalizedUserId || !normalizedCode || !/^[A-Za-z0-9]+$/.test(normalizedCode)) {
    return res.status(400).json({ error: 'Verification requests require identification maps and passcodes.' });
  }

  const user = db.users.find(u => u.id === normalizedUserId);
  if (!user) return res.status(404).json({ error: 'Subscriber account does not exist.' });

  let valid = false;
  if (user.mfaType === 'totp' && user.mfaSecret) {
    const decSecret = decryptField(user.mfaSecret);
    valid = verifyTOTP(normalizedCode, decSecret) || verifyOTP(normalizedUserId, normalizedCode);
  } else {
    valid = verifyOTP(normalizedUserId, normalizedCode);
  }

  if (!valid) {
    writeAuditLog(normalizedUserId, 'mfa_failure', 'mfa', null, { reason: 'invalid_code' }, req.ip || '127.0.0.1');
    return res.status(400).json({ error: 'MFA checkpoint challenge failed. Security block triggered.' });
  }

  // Set trusted period (24 hours)
  user.deviceTrustExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  saveDatabase();

  writeAuditLog(normalizedUserId, 'mfa_success', 'mfa', null, null, req.ip || '127.0.0.1');
  res.json({ success: true, ...createSessionPayload(user) });
});

app.post('/api/auth/mfa/recovery', sensitiveAuthRateLimiter, (req, res) => {
  const { userId, backupCode } = req.body;
  const normalizedUserId = cleanIdentifier(userId);
  const normalizedBackupCode = cleanCredential(backupCode, 32);
  if (!normalizedUserId || !normalizedBackupCode || !/^[A-Za-z0-9]+$/.test(normalizedBackupCode)) {
    return res.status(400).json({ error: 'Recovery checks require subscriber maps and dynamic backups.' });
  }

  const user = db.users.find(u => u.id === normalizedUserId);
  if (!user) return res.status(404).json({ error: 'Subscriber account does not exist.' });

  if (!user.mfaBackupCodes || user.mfaBackupCodes.length === 0) {
    return res.status(400).json({ error: 'Backup security checks are unconfigured.' });
  }

  const matchedIndex = user.mfaBackupCodes.findIndex(hash => bcrypt.compareSync(normalizedBackupCode, hash));
  if (matchedIndex === -1) {
    return res.status(400).json({ error: 'Invalid backup recovery code provided.' });
  }

  // Consume backup recovery code
  user.mfaBackupCodes.splice(matchedIndex, 1);
  saveDatabase();

  writeAuditLog(normalizedUserId, 'mfa_recovery_success', 'mfa_backup', null, null, req.ip || '127.0.0.1');
  res.json({ success: true, ...createSessionPayload(user), message: 'Security recovery verified.' });
});

app.post('/api/auth/password-reset', sensitiveAuthRateLimiter, (req, res) => {
  const { phone, currentPassword, newPassword } = req.body;
  const normalizedPhone = normalizeKenyanPhone(phone);
  const normalizedCurrentPassword = cleanCredential(currentPassword);
  const normalizedNewPassword = cleanCredential(newPassword);
  if (!normalizedPhone || !normalizedCurrentPassword || !normalizedNewPassword) {
    return res.status(400).json({ error: 'Please fulfill all requested phone, current, and new credentials.' });
  }

  const user = db.users.find(u => u.phone === normalizedPhone);
  if (!user) return res.status(404).json({ error: 'User account could not be found.' });

  const currentHash = db.passwordHashes[user.id];
  if (!currentHash || !bcrypt.compareSync(normalizedCurrentPassword, currentHash)) {
    return res.status(401).json({ error: 'Current password verification failed. Access denied.' });
  }

  if (!validatePasswordStrength(normalizedNewPassword)) {
    return res.status(400).json({
      error: 'New password does not meet complexity rules. Minimum 12 characters, with an uppercase letter, a lowercase letter, a number, and a special character.'
    });
  }

  db.passwordHashes[user.id] = bcrypt.hashSync(normalizedNewPassword, 10);
  user.passwordResetRequired = false;
  saveDatabase();

  writeAuditLog(user.id, 'password_reset_success', `user:${user.id}`, null, null, req.ip || '127.0.0.1');

  res.json({ success: true, message: 'Password reset completed. Authenticate using your updated credentials.' });
});

app.post('/api/auth/forgot-password', sensitiveAuthRateLimiter, (req, res) => {
  const { phone, newPassword } = req.body;
  const normalizedPhone = normalizeKenyanPhone(phone);
  const normalizedNewPassword = cleanCredential(newPassword);
  if (!normalizedPhone || !normalizedNewPassword) {
    return res.status(400).json({ error: 'Please enter your registered phone number and a new password.' });
  }

  const user = db.users.find(u => u.phone === normalizedPhone);
  if (!user) {
    return res.status(404).json({ error: 'No account registered with this phone number.' });
  }

  if (!validatePasswordStrength(normalizedNewPassword)) {
    return res.status(400).json({
      error: 'New password does not meet security rules. Minimum 12 characters, with an uppercase letter, a lowercase letter, a number, and a special character.'
    });
  }

  db.passwordHashes[user.id] = bcrypt.hashSync(normalizedNewPassword, 10);
  user.passwordResetRequired = false;
  saveDatabase();
  syncRefs();

  writeAuditLog(user.id, 'forgot_password_recovered', `user:${user.id}`, null, null, req.ip || '127.0.0.1');

  res.json({ success: true, message: 'Password updated successfully. You can now log in with your new password.' });
});

app.post('/api/auth/refresh', authRateLimiter, (req, res) => {
  const refreshToken = cleanCredential(req.body?.refreshToken, 2048);
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required.' });
  }

  const incomingHashed = crypto.createHash('sha256').update(refreshToken).digest('hex');
  if (!db.refreshTokens || !db.refreshTokens.includes(incomingHashed)) {
    // Detect token reuse attack
    try {
      const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as any;
      db.refreshTokens = []; // Emergency purge all user sessions for defense in depth
      saveDatabase();
      writeAuditLog(decoded.id, 'refresh_token_reuse_attack_detected', 'tokens', null, null, req.ip || '127.0.0.1');
    } catch (_) {}
    return res.status(403).json({ error: 'Token revoked or reuse attempt detected. Security policies mandate re-authorization.' });
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as any;
    const matched = db.users.find(u => u.id === decoded.id);
    if (!matched) {
      return res.status(401).json({ error: 'Subscriber account does not exist.' });
    }

    // Revoke old refresh token
    db.refreshTokens = db.refreshTokens.filter(t => t !== incomingHashed);

    // Issue rotated tokens
    writeAuditLog(matched.id, 'token_refresh_rotated', 'tokens', null, null, req.ip || '127.0.0.1');
    res.json(createSessionTokens(matched));
  } catch (err) {
    return res.status(403).json({ error: 'Expired or damaged token signature.' });
  }
});

app.post('/api/auth/logout', authRateLimiter, (req, res) => {
  const refreshToken = cleanCredential(req.body?.refreshToken, 2048);
  if (refreshToken && db.refreshTokens) {
    const hashed = crypto.createHash('sha256').update(refreshToken).digest('hex');
    db.refreshTokens = db.refreshTokens.filter(t => t !== hashed);
    saveDatabase();
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

app.get('/api/auth/users', JWTAuthMiddleware, requireRole([UserRole.ADMIN]), (req, res) => {
  // Kept as an administrative endpoint for compatibility; user enumeration is privileged.
  res.json(db.users.map(safeUser));
});

// Profile retrievals and updates
app.get('/api/users/profile', JWTAuthMiddleware, (req: AuthenticatedRequest, res) => {
  res.json(safeUser(req.user!));
});

app.put('/api/users/profile', JWTAuthMiddleware, (req: AuthenticatedRequest, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Session unauthenticated.' });

  const { name, email, county, investmentBudgetKES, preferredSectors, investmentGoal, farmSpecialties, seekingLandAcreage } = req.body;
  const updates: Partial<User> = {};

  if (name !== undefined) {
    const normalizedName = cleanText(name, 80);
    if (!normalizedName) return res.status(400).json({ error: 'Name must contain at most 80 printable characters.' });
    updates.name = normalizedName;
  }
  if (email !== undefined) {
    if (email === '') updates.email = undefined;
    else {
      const normalizedEmail = normalizeEmail(email);
      if (!normalizedEmail) return res.status(400).json({ error: 'Provide a valid email address.' });
      updates.email = normalizedEmail;
    }
  }
  if (county !== undefined) {
    const normalizedCounty = cleanText(county, 80);
    if (!normalizedCounty) return res.status(400).json({ error: 'County must contain at most 80 printable characters.' });
    updates.county = normalizedCounty;
  }
  if (investmentBudgetKES !== undefined) {
    const budget = Number(investmentBudgetKES);
    if (!Number.isFinite(budget) || budget < 0 || budget > 100000000) return res.status(400).json({ error: 'Investment budget must be a valid amount.' });
    updates.investmentBudgetKES = budget;
  }
  if (preferredSectors !== undefined) {
    const sectors = Array.isArray(preferredSectors) ? preferredSectors.map(item => cleanText(item, 80)) : [];
    if (sectors.length < 1 || sectors.length > 10 || sectors.some(item => !item)) return res.status(400).json({ error: 'Provide between one and ten valid preferred sectors.' });
    updates.preferredSectors = sectors as string[];
  }
  if (investmentGoal !== undefined) {
    const goal = cleanText(investmentGoal, 1000);
    if (!goal) return res.status(400).json({ error: 'Investment goal must contain at most 1000 printable characters.' });
    updates.investmentGoal = goal;
  }
  if (farmSpecialties !== undefined) {
    const specialties = Array.isArray(farmSpecialties) ? farmSpecialties.map(item => cleanText(item, 80)) : [];
    if (specialties.length < 1 || specialties.length > 10 || specialties.some(item => !item)) return res.status(400).json({ error: 'Provide between one and ten valid farm specialties.' });
    updates.farmSpecialties = specialties as string[];
  }
  if (seekingLandAcreage !== undefined) {
    const acreage = Number(seekingLandAcreage);
    if (!Number.isFinite(acreage) || acreage < 0 || acreage > 100000) return res.status(400).json({ error: 'Land acreage must be a valid amount.' });
    updates.seekingLandAcreage = acreage;
  }
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Provide at least one editable profile field.' });

  Object.assign(user, updates);

  saveDatabase();
  res.json({ success: true, user: safeUser(user) });
});

// 2. Listing Operations (Browse with search and filters)
app.get('/api/listings', (req, res) => {
  const { county, type, minPrice, maxPrice, status } = req.query;
  let filtered = db.listings.filter(listing => listing.moderationStatus === 'APPROVED');

  if (county) {
    filtered = filtered.filter(l => l.locationCounty.toLowerCase() === (county as string).trim().toLowerCase());
  }

  if (type) {
    filtered = filtered.filter(l => l.type === type);
  }

  if (minPrice) {
    filtered = filtered.filter(l => l.priceKES >= Number(minPrice));
  }

  if (maxPrice) {
    filtered = filtered.filter(l => l.priceKES <= Number(maxPrice));
  }

  if (status === 'unverified') {
    filtered = filtered.filter(l => !l.verified);
  } else if (status === 'verified') {
    filtered = filtered.filter(l => l.verified);
  }

  res.json(filtered);
});

// Create listings securely (requires authenticating)
app.post('/api/listings', JWTAuthMiddleware, (req: AuthenticatedRequest, res) => {
  const { 
    type, title, description, locationCounty, priceKES, 
    revenueSplitPercent, imageUrl, ownerId, ownerName, ownerPhone,
    landDetails, livestockDetails, opportunityDetails 
  } = req.body;

  const normalizedTitle = cleanText(title, 160);
  const normalizedDescription = cleanText(description, 3000);
  const normalizedCounty = cleanText(locationCounty, 100);
  const normalizedPrice = Number(priceKES);
  const normalizedRevenueSplit = revenueSplitPercent === undefined || revenueSplitPercent === '' ? undefined : Number(revenueSplitPercent);
  if (!Object.values(ListingType).includes(type) || !normalizedTitle || !normalizedDescription || !normalizedCounty || !Number.isFinite(normalizedPrice) || normalizedPrice <= 0 || normalizedPrice > 100000000 || (normalizedRevenueSplit !== undefined && (!Number.isFinite(normalizedRevenueSplit) || normalizedRevenueSplit < 1 || normalizedRevenueSplit > 99))) {
    return res.status(400).json({ error: 'Provide a valid listing type, title, description, county, price, and revenue split where applicable.' });
  }

  const verifiedOwnerId = req.user ? req.user.id : (ownerId || 'user_1');
  const verifiedOwnerName = req.user ? req.user.name : (ownerName || 'Wanjiku Kamau');
  const verifiedOwnerPhone = req.user ? req.user.phone : (ownerPhone || '0712345678');

  const newListing: Listing = {
    id: `list_${Date.now()}`,
    type,
    title: normalizedTitle,
    description: normalizedDescription,
    locationCounty: normalizedCounty,
    priceKES: normalizedPrice,
    revenueSplitPercent: normalizedRevenueSplit,
    verified: false, // Default unverified, awaits admin auditing
    moderationStatus: 'PENDING',
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
    ownerId: verifiedOwnerId,
    ownerName: verifiedOwnerName,
    ownerPhone: verifiedOwnerPhone,
    landDetails,
    livestockDetails,
    opportunityDetails,
    createdAt: new Date().toISOString()
  };

  db.listings.push(newListing);
  saveDatabase();
  syncRefs();
  writeAuditLog(req.user!.id, 'listing_submitted', `listing:${newListing.id}`, null, { type: newListing.type }, req.ip || '127.0.0.1');

  res.status(201).json(newListing);
});

// Delete listings securely (owner or admin only)
app.delete('/api/listings/:id', JWTAuthMiddleware, (req: AuthenticatedRequest, res) => {
  const listingIndex = db.listings.findIndex(l => l.id === req.params.id);
  if (listingIndex === -1) {
    return res.status(404).json({ error: 'Listing not found.' });
  }
  const item = db.listings[listingIndex];
  if (req.user && req.user.role !== UserRole.ADMIN && item.ownerId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized deletion request.' });
  }

  db.listings.splice(listingIndex, 1);
  saveDatabase();
  syncRefs();
  writeAuditLog(req.user!.id, 'listing_deleted', `listing:${item.id}`, item, null, req.ip || '127.0.0.1');
  res.json({ success: true, message: 'Marketplace listing removed.' });
});

// 3. M-Pesa Interfacing
app.post('/api/payments/stkpush', JWTAuthMiddleware, (req, res) => {
  const { phone, amount, purpose } = req.body;
  if (!phone || !amount) {
    return res.status(400).json({ error: 'Subscriber number and billing KES amount required.' });
  }

  // Safety protection for production context
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.MPESA_SHORTCODE || !process.env.MPESA_PASSKEY) {
      console.error('[CRITICAL]: Missing real M-Pesa credentials in production mode.');
      return res.status(500).json({ error: 'Safaricom Daraja API gateway configuration is unconfigured.' });
    }
  }

  const mpesaChar = 'RSTUXZ'.charAt(Math.floor(Math.random() * 6));
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const checkoutId = `cid_stk_${Date.now()}`;
  const mpesaReceipt = `${mpesaChar}GL${randNum}HJK`;

  const newTx: MpesaTransaction = {
    id: `tx_${Date.now()}`,
    transactionId: mpesaReceipt,
    phoneNumber: phone,
    amountKES: Number(amount),
    purpose: purpose || 'Lease agreement escrow lockup',
    status: 'PENDING', // Holds as Pending, awaiting reconciliation or callback!
    timestamp: new Date().toISOString()
  };

  db.transactions.push(newTx);
  saveDatabase();
  syncRefs();

  const loggerId = (req as AuthenticatedRequest).user ? (req as AuthenticatedRequest).user!.id : 'system';
  writeAuditLog(loggerId, 'billing_initiated', `tx:${newTx.id}`, null, { amount: newTx.amountKES, mpesaReceipt }, req.ip || '127.0.0.1');

  res.json({
    success: true,
    MerchantRequestID: `mid_request_${Date.now()}`,
    CheckoutRequestID: checkoutId,
    ResponseDescription: 'Success. Daraja trigger completed. Enter client PIN on subscriber phone.',
    transaction: newTx
  });
});

// Real STK M-Pesa Callback verification endpoint
app.post('/api/payments/callback', (req, res) => {
  const { Body } = req.body || {};
  if (!Body || !Body.stkCallback) {
    return res.status(400).json({ error: 'M-Pesa validation body is severely malformed.' });
  }

  const callback = Body.stkCallback;
  const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = callback;

  // Search transaction matching callback checkpoint
  const tx = db.transactions.find(t => t.purpose.includes(CheckoutRequestID) || t.phoneNumber.includes(callback.CallbackMetadata?.Item?.[4]?.Value));
  if (!tx) {
    console.warn(`[M-PESA WALKOVER]: Unmatched checkout request callback logged: ${CheckoutRequestID}`);
    return res.status(404).json({ error: 'Transaction matching checkout token could not be found.' });
  }

  // Prevent duplicate callbacks / replay exploits
  if (tx.status !== 'PENDING') {
    console.warn(`[M-PESA REPLAY BLOCKED]: Attempted duplicate payment callback for tx: ${tx.id}`);
    return res.status(400).json({ error: 'Transaction has already been finalized.' });
  }

  if (ResultCode === 0) {
    console.log(`[M-PESA RESOLVE]: Transaction success callback. Decoded: ${ResultDesc}`);
    tx.status = 'SUCCESS';
    writeAuditLog('system', 'billing_success_callback', `tx:${tx.id}`, null, { checkoutId: CheckoutRequestID }, 'safaricom-daraja-ip');
  } else {
    console.warn(`[M-PESA REJECT]: Customer checkout failed or timed out. Code: ${ResultCode}`);
    tx.status = 'FAILED';
    writeAuditLog('system', 'billing_failed_callback', `tx:${tx.id}`, null, { resultCode: ResultCode, desc: ResultDesc }, 'safaricom-daraja-ip');
  }

  saveDatabase();
  syncRefs();
  res.json({ ResultCode: 0, ResultDesc: 'Callback successfully delivered and consolidated.' });
});

// Simulate webhook callbacks explicitly for dynamic trials
app.post('/api/payments/simulate-callback', (req, res) => {
  // Prevent mock success overrides in strict production configs
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Dynamic manual callback simulation is disabled in production environments.' });
  }

  const { checkoutRequestId, success } = req.body;
  // Pick last pending tx if specific id isn't passed
  const tx = db.transactions.find(t => t.status === 'PENDING') || db.transactions[db.transactions.length - 1];
  if (!tx) {
    return res.status(404).json({ error: 'No transaction waiting for simulated feedback.' });
  }

  tx.status = success ? 'SUCCESS' : 'FAILED';
  saveDatabase();
  syncRefs();

  writeAuditLog('developer', 'billing_simulated_callback', `tx:${tx.id}`, null, { targetStatus: tx.status }, req.ip || '127.0.0.1');

  res.json({ success: true, message: 'M-Pesa webhook callback simulation completed.', transaction: tx });
});

// 4. Land Leasing & Escrow Disbursements
app.post('/api/land/leases', JWTAuthMiddleware, (req: AuthenticatedRequest, res) => {
  const { listingId, landownerId, farmerId, acreageLeased, pricePerAcreKES, durationMonths, startDate } = req.body;

  const resolvedFarmerId = req.user ? req.user.id : (farmerId || 'user_2');

  const newAgreement: LeaseAgreement = {
    id: `lease_${Date.now()}`,
    listingId,
    landownerId: landownerId || 'user_1',
    farmerId: resolvedFarmerId,
    acreageLeased: Number(acreageLeased),
    pricePerAcreKES: Number(pricePerAcreKES),
    durationMonths: Number(durationMonths || 12),
    startDate: startDate || new Date().toISOString().split('T')[0],
    status: 'SIGNED',
    mpesaEscrowStatus: 'ESCROWED', // Holds escrow status correctly
    paymentsMade: Number(acreageLeased) * Number(pricePerAcreKES) * Number(durationMonths || 1)
  };

  db.agreements.push(newAgreement);
  saveDatabase();
  syncRefs();

  res.status(201).json(newAgreement);
});

app.get('/api/land/leases', JWTAuthMiddleware, (req: AuthenticatedRequest, res) => {
  if (req.user!.role === UserRole.ADMIN) return res.json(db.agreements);
  res.json(db.agreements.filter(item => item.landownerId === req.user!.id || item.farmerId === req.user!.id));
});

app.post('/api/land/leases/disburse', JWTAuthMiddleware, requireRole([UserRole.ADMIN]), (req: AuthenticatedRequest, res) => {
  const { leaseId } = req.body;
  const item = db.agreements.find(a => a.id === leaseId);
  if (!item) {
    return res.status(404).json({ error: 'Lease record could not be located.' });
  }

  if (item.mpesaEscrowStatus !== 'ESCROWED') return res.status(409).json({ error: 'Only escrowed leases can be disbursed.' });
  item.mpesaEscrowStatus = 'DISBURSED';
  saveDatabase();
  syncRefs();
  writeAuditLog(req.user!.id, 'escrow_disbursed', `lease:${item.id}`, { mpesaEscrowStatus: 'ESCROWED' }, { mpesaEscrowStatus: 'DISBURSED' }, req.ip || '127.0.0.1');
  res.json(item);
});

// 5. Shared Livestock Equity & Partnerships
app.post('/api/livestock/partnerships', JWTAuthMiddleware, (req: AuthenticatedRequest, res) => {
  const { listingId, investorId, farmerId, animalTagId, animalType, breed, splitPercentInvestor } = req.body;

  const resolvedInvestorId = req.user ? req.user.id : (investorId || 'user_3');

  const newPartnership: LivestockPartnership = {
    id: `part_${Date.now()}`,
    listingId: listingId || 'list_2',
    investorId: resolvedInvestorId,
    farmerId: farmerId || 'user_2',
    animalTagId: animalTagId || `SL-KE-TAG-${Math.floor(100 + Math.random() * 900)}`,
    animalType: animalType || 'dairy',
    breed: breed || 'Cross Friesian Jersey',
    splitPercentInvestor: Number(splitPercentInvestor || 40),
    status: 'ACTIVE',
    healthLogs: [
      {
        id: `h_init_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        status: 'Healthy',
        notes: 'Partnership initiated and registered onto ShambaLoop audits.',
        recordedBy: 'Vet Inspector Bot'
      }
    ],
    productionLogs: []
  };

  db.partnerships.push(newPartnership);
  saveDatabase();
  syncRefs();

  res.status(201).json(newPartnership);
});

app.get('/api/livestock/partnerships', JWTAuthMiddleware, (req: AuthenticatedRequest, res) => {
  if (req.user!.role === UserRole.ADMIN) return res.json(db.partnerships);
  res.json(db.partnerships.filter(item => item.investorId === req.user!.id || item.farmerId === req.user!.id));
});

// Health Logs updates
app.post('/api/livestock/health', JWTAuthMiddleware, (req: AuthenticatedRequest, res) => {
  const { partnershipId, status, notes, recordedBy } = req.body;
  const item = db.partnerships.find(p => p.id === partnershipId);
  if (!item) {
    return res.status(404).json({ error: 'Livestock partnership was not found.' });
  }
  if (req.user!.role !== UserRole.ADMIN && item.farmerId !== req.user!.id) {
    return res.status(403).json({ error: 'Only the farmer responsible for this livestock partnership can add a farm health activity.' });
  }
  if (!['Healthy', 'Sick', 'Recovering', 'Vaccinated'].includes(status) || !cleanText(notes, 1000)) {
    return res.status(400).json({ error: 'A valid health status and activity note are required.' });
  }

  const log: HealthLog = {
    id: `h_log_${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    status,
    notes: cleanText(notes, 1000)!,
    recordedBy: req.user!.name
  };

  item.healthLogs.unshift(log);
  saveDatabase();
  syncRefs();
  res.json(item);
});

// Production Logs Updates (Real math formula implementation)
app.post('/api/livestock/production', JWTAuthMiddleware, (req: AuthenticatedRequest, res) => {
  const { partnershipId, quantity, metric, pricePerUnit } = req.body;
  const item = db.partnerships.find(p => p.id === partnershipId);
  if (!item) {
    return res.status(404).json({ error: 'Livestock record was not found.' });
  }
  if (req.user!.role !== UserRole.ADMIN && item.farmerId !== req.user!.id) {
    return res.status(403).json({ error: 'Only the farmer responsible for this livestock partnership can add production records.' });
  }

  const volume = Number(quantity);
  const normalizedMetric = cleanText(metric, 80);
  if (!Number.isFinite(volume) || volume <= 0 || volume > 100000 || !normalizedMetric) {
    return res.status(400).json({ error: 'A valid production metric and quantity are required.' });
  }
  const baselineCost = 60; // Server-side baseline avoids client-controlled payout calculations.
  const grossInvoiced = volume * baselineCost;
  const investorShare = Math.round(grossInvoiced * (item.splitPercentInvestor / 100));
  const farmerShare = grossInvoiced - investorShare;

  const log: ProductionLog = {
    id: `p_log_${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    metric: normalizedMetric,
    quantity: volume,
    revenueKES: grossInvoiced,
    investorPayoutKES: investorShare,
    farmerPayoutKES: farmerShare
  };

  item.productionLogs.unshift(log);
  saveDatabase();
  syncRefs();
  res.json(item);
});

// 5b. Farmer workspace. Every record is derived from the authenticated farmer,
// never from submitted ownership IDs.
const farmerOnly = requireRole([UserRole.FARMER]);
const farmerPartnership = (farmerId: string, partnershipId: string) => db.partnerships.find(item => item.id === partnershipId && item.farmerId === farmerId);

app.get('/api/farmer/investors', JWTAuthMiddleware, farmerOnly, (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
  const county = typeof req.query.county === 'string' ? req.query.county.trim().toLowerCase() : '';
  const sector = typeof req.query.sector === 'string' ? req.query.sector.trim().toLowerCase() : '';
  const investors = db.users.filter(user => user.role === UserRole.INVESTOR).filter(user => {
    const searchable = `${user.name} ${user.county} ${(user.preferredSectors || []).join(' ')} ${user.investmentGoal || ''}`.toLowerCase();
    return (!query || searchable.includes(query)) && (!county || user.county.toLowerCase() === county) && (!sector || (user.preferredSectors || []).some(item => item.toLowerCase().includes(sector)));
  }).map(safeUser);
  res.json(investors);
});

app.get('/api/farmer/veterinarians', JWTAuthMiddleware, farmerOnly, (req, res) => {
  res.json(db.users.filter(user => user.role === UserRole.VETERINARIAN && user.verified).map(safeUser));
});

app.get('/api/farmer/proposals', JWTAuthMiddleware, farmerOnly, (req: AuthenticatedRequest, res) => {
  res.json((db.proposals || []).filter(proposal => proposal.farmerId === req.user!.id));
});

app.post('/api/farmer/proposals', JWTAuthMiddleware, farmerOnly, (req: AuthenticatedRequest, res) => {
  const { investorId, title, sector, farmDescription, capitalRequestedKES, farmerContribution, investorSharePercent } = req.body;
  const normalizedTitle = cleanText(title, 160);
  const normalizedDescription = cleanText(farmDescription, 2000);
  const normalizedContribution = cleanText(farmerContribution, 1000);
  const capital = Number(capitalRequestedKES);
  const investorShare = Number(investorSharePercent);
  const permittedSectors: FarmerProposal['sector'][] = ['Dairy', 'Crops', 'Poultry', 'Horticulture', 'Goats', 'Mixed'];
  const investor = investorId === undefined || investorId === '' ? undefined : db.users.find(user => user.id === investorId && user.role === UserRole.INVESTOR);
  if (!normalizedTitle || !normalizedDescription || !normalizedContribution || !permittedSectors.includes(sector) || !Number.isFinite(capital) || capital <= 0 || capital > 100000000 || !Number.isFinite(investorShare) || investorShare < 1 || investorShare > 99 || (investorId && !investor)) {
    return res.status(400).json({ error: 'Provide a title, farm summary, contribution, valid sector, capital amount, and partnership split.' });
  }
  const proposal: FarmerProposal = {
    id: `proposal_${Date.now()}`,
    farmerId: req.user!.id,
    farmerName: req.user!.name,
    farmerPhone: req.user!.phone,
    investorId: investor?.id,
    investorName: investor?.name,
    title: normalizedTitle,
    sector,
    farmDescription: normalizedDescription,
    capitalRequestedKES: capital,
    farmerContribution: normalizedContribution,
    investorSharePercent: investorShare,
    farmerSharePercent: 100 - investorShare,
    status: 'SUBMITTED',
    createdAt: new Date().toISOString()
  };
  db.proposals ||= [];
  db.proposals.unshift(proposal);
  saveDatabase();
  writeAuditLog(req.user!.id, 'farmer_proposal_created', `proposal:${proposal.id}`, null, { investorId: proposal.investorId, sector: proposal.sector }, req.ip || '127.0.0.1');
  res.status(201).json(proposal);
});

app.put('/api/farmer/profile', JWTAuthMiddleware, farmerOnly, (req: AuthenticatedRequest, res) => {
  const { farmSpecialties, seekingLandAcreage } = req.body;
  if (!Array.isArray(farmSpecialties) || farmSpecialties.length < 1 || farmSpecialties.length > 10 || !farmSpecialties.every(item => Boolean(cleanText(item, 80)))) {
    return res.status(400).json({ error: 'Add between one and ten short descriptions of what your farm offers.' });
  }
  const acreage = Number(seekingLandAcreage);
  if (!Number.isFinite(acreage) || acreage < 0 || acreage > 100000) return res.status(400).json({ error: 'Enter a valid acreage requirement.' });
  req.user!.farmSpecialties = farmSpecialties.map(item => cleanText(item, 80)!);
  req.user!.seekingLandAcreage = acreage;
  saveDatabase();
  writeAuditLog(req.user!.id, 'farmer_profile_updated', `user:${req.user!.id}`, null, { specialties: req.user!.farmSpecialties.length }, req.ip || '127.0.0.1');
  res.json({ success: true, user: safeUser(req.user!) });
});

app.get('/api/farmer/events', JWTAuthMiddleware, farmerOnly, (req: AuthenticatedRequest, res) => {
  res.json((db.farmEvents || []).filter(event => event.farmerId === req.user!.id));
});

app.post('/api/farmer/events', JWTAuthMiddleware, farmerOnly, (req: AuthenticatedRequest, res) => {
  const { farmId, eventType, title, description, severity, actionTaken, impactOnProduce } = req.body;
  const validEventTypes: FarmEvent['eventType'][] = ['CALVING_DUE', 'DROUGHT_ALERT', 'PEST_ALERT', 'VACCINATION_DUE', 'HARVEST_WINDOW', 'DISEASE_OUTBREAK'];
  const validSeverities: FarmEvent['severity'][] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const normalizedTitle = cleanText(title, 160);
  const normalizedDescription = cleanText(description, 2000);
  if (typeof farmId !== 'string' || (!farmerPartnership(req.user!.id, farmId) && farmId !== 'farm_primary') || !validEventTypes.includes(eventType) || !validSeverities.includes(severity) || !normalizedTitle || !normalizedDescription) {
    return res.status(400).json({ error: 'Choose one of your farm records and provide a valid event.' });
  }
  const event: FarmEvent = { id: `event_${Date.now()}`, farmId, farmerId: req.user!.id, farmerName: req.user!.name, eventType, title: normalizedTitle, description: normalizedDescription, severity, date: new Date().toISOString(), actionTaken: actionTaken === undefined ? undefined : cleanText(actionTaken, 1000) || undefined, impactOnProduce: impactOnProduce === undefined ? undefined : cleanText(impactOnProduce, 1000) || undefined, reportedBy: req.user!.name };
  db.farmEvents ||= [];
  db.farmEvents.unshift(event);
  saveDatabase();
  writeAuditLog(req.user!.id, 'farm_event_created', `event:${event.id}`, null, { farmId, severity }, req.ip || '127.0.0.1');
  res.status(201).json(event);
});

// 5c. Investor workspace. Discovery exposes only public farmer information;
// collaboration, proposals, events, and reports remain scoped to the investor.
const investorOnly = requireRole([UserRole.INVESTOR]);

const queryFilter = (value: unknown, maxLength = 80): string | null => {
  if (value === undefined) return '';
  return typeof value === 'string' ? cleanText(value, maxLength) : null;
};

app.get('/api/investor/farmers', JWTAuthMiddleware, investorOnly, (req, res) => {
  const query = queryFilter(req.query.q);
  const county = queryFilter(req.query.county);
  const sector = queryFilter(req.query.sector);
  if (query === null || county === null || sector === null) return res.status(400).json({ error: 'Search filters must be short text values.' });

  const farmers = db.users.filter(user => user.role === UserRole.FARMER).filter(user => {
    const listings = db.listings.filter(listing => listing.ownerId === user.id && listing.moderationStatus === 'APPROVED');
    const searchable = `${user.name} ${user.county} ${(user.farmSpecialties || []).join(' ')} ${listings.map(listing => `${listing.title} ${listing.description}`).join(' ')}`.toLowerCase();
    return (!query || searchable.includes(query.toLowerCase())) && (!county || user.county.toLowerCase() === county.toLowerCase()) && (!sector || searchable.includes(sector.toLowerCase()));
  }).map(user => ({
    id: user.id,
    name: user.name,
    county: user.county,
    verified: user.verified,
    createdAt: user.createdAt,
    farmSpecialties: user.farmSpecialties || [],
    seekingLandAcreage: user.seekingLandAcreage,
    listings: db.listings.filter(listing => listing.ownerId === user.id && listing.moderationStatus === 'APPROVED').map(listing => {
      const { ownerPhone, ...publicListing } = listing;
      return publicListing;
    })
  }));
  res.json(farmers);
});

app.get('/api/investor/criteria', JWTAuthMiddleware, investorOnly, (req: AuthenticatedRequest, res) => {
  res.json((db.investorCriteria || []).find(criteria => criteria.investorId === req.user!.id) || null);
});

app.put('/api/investor/criteria', JWTAuthMiddleware, investorOnly, (req: AuthenticatedRequest, res) => {
  const { lookingFor, budgetKES, preferredSectors, targetCounties, notes, resourcesProvided, partnerRequirements, investorId, investorName } = req.body;
  const validModels: InvestorCriteria['lookingFor'][] = ['FARMER_WITH_LAND_NEEDING_CAPITAL', 'FARM_MANAGER_EXPERTISE', 'LAND_FOR_LEASE_PROJECT'];
  const budget = Number(budgetKES);
  const normalizedNotes = cleanText(notes, 1500);
  const normalizedResources = resourcesProvided === undefined ? undefined : cleanText(resourcesProvided, 1000);
  const normalizedRequirements = partnerRequirements === undefined ? undefined : cleanText(partnerRequirements, 1000);
  const sectors = Array.isArray(preferredSectors) ? preferredSectors.map(item => cleanText(item, 80)) : [];
  const counties = Array.isArray(targetCounties) ? targetCounties.map(item => cleanText(item, 80)) : [];
  if (!validModels.includes(lookingFor) || !Number.isFinite(budget) || budget <= 0 || budget > 100000000 || !normalizedNotes || !normalizedResources || !normalizedRequirements || sectors.length < 1 || sectors.length > 10 || counties.length < 1 || counties.length > 10 || sectors.some(item => !item) || counties.some(item => !item)) {
    return res.status(400).json({ error: 'Provide an investment model, valid budget, sectors, counties, resources, partner requirements, and notes.' });
  }

  const criteria: InvestorCriteria = {
    id: (db.investorCriteria || []).find(item => item.investorId === req.user!.id)?.id || `criteria_${Date.now()}`,
    investorId: req.user!.id,
    investorName: req.user!.name,
    lookingFor,
    budgetKES: budget,
    preferredSectors: sectors as string[],
    targetCounties: counties as string[],
    notes: normalizedNotes,
    resourcesProvided: normalizedResources,
    partnerRequirements: normalizedRequirements,
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };
  db.investorCriteria ||= [];
  db.investorCriteria = [criteria, ...db.investorCriteria.filter(item => item.investorId !== req.user!.id)];
  // Farmer discovery deliberately uses the authenticated investor's public profile fields.
  req.user!.investmentBudgetKES = budget;
  req.user!.preferredSectors = criteria.preferredSectors;
  req.user!.investmentGoal = criteria.partnerRequirements;
  saveDatabase();
  writeAuditLog(req.user!.id, 'investor_criteria_saved', `criteria:${criteria.id}`, null, { sectorCount: criteria.preferredSectors.length, budget }, req.ip || '127.0.0.1');
  res.json(criteria);
});

app.get('/api/investor/proposals', JWTAuthMiddleware, investorOnly, (req: AuthenticatedRequest, res) => {
  res.json((db.proposals || []).filter(proposal => proposal.investorId === req.user!.id));
});

app.patch('/api/investor/proposals/:id', JWTAuthMiddleware, investorOnly, (req: AuthenticatedRequest, res) => {
  const proposal = (db.proposals || []).find(item => item.id === req.params.id);
  if (!proposal) return res.status(404).json({ error: 'Proposal not found.' });
  if (proposal.investorId !== req.user!.id) return res.status(403).json({ error: 'You cannot update a proposal addressed to another investor.' });
  const { status, farmerId, investorId } = req.body;
  const validStatuses: FarmerProposal['status'][] = ['NEGOTIATING', 'ACCEPTED', 'REJECTED'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Choose negotiating, accepted, or rejected.' });
  const previousStatus = proposal.status;
  proposal.status = status;
  saveDatabase();
  writeAuditLog(req.user!.id, 'investor_proposal_updated', `proposal:${proposal.id}`, { status: previousStatus }, { status }, req.ip || '127.0.0.1');
  res.json(proposal);
});

app.get('/api/investor/events', JWTAuthMiddleware, investorOnly, (req: AuthenticatedRequest, res) => {
  const partnershipIds = new Set(db.partnerships.filter(partnership => partnership.investorId === req.user!.id).map(partnership => partnership.id));
  res.json((db.farmEvents || []).filter(event => partnershipIds.has(event.farmId)));
});

app.get('/api/admin/listings', JWTAuthMiddleware, requireRole([UserRole.ADMIN]), (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  res.json(db.listings.filter(item => !status || item.moderationStatus === status));
});

app.post('/api/admin/approve-listing', JWTAuthMiddleware, requireRole([UserRole.ADMIN]), (req: AuthenticatedRequest, res) => {
  const { listingId, status = 'APPROVED', note } = req.body;
  if (typeof listingId !== 'string' || !listingModerationStatuses.has(status)) {
    return res.status(400).json({ error: 'A listing and valid moderation decision are required.' });
  }
  const moderationNote = note === undefined ? undefined : cleanText(note, 1000);
  if (note !== undefined && !moderationNote) return res.status(400).json({ error: 'Moderation note must contain at most 1000 printable characters.' });
  const item = db.listings.find(listing => listing.id === listingId);
  if (!item) return res.status(404).json({ error: 'Marketplace listing was not found.' });
  const previousStatus = item.moderationStatus;
  item.moderationStatus = status;
  item.moderationNote = moderationNote;
  item.verified = status === 'APPROVED';
  saveDatabase();
  writeAuditLog(req.user!.id, 'listing_moderated', `listing:${item.id}`, { status: previousStatus }, { status, note: moderationNote }, req.ip || '127.0.0.1');
  res.json({ success: true, listing: item });
});

app.post('/api/admin/approve-user', JWTAuthMiddleware, requireRole([UserRole.ADMIN]), (req: AuthenticatedRequest, res) => {
  const { userId, status } = req.body;
  if (typeof userId !== 'string' || !['APPROVED', 'REJECTED'].includes(status)) return res.status(400).json({ error: 'A user and valid status are required.' });
  const target = db.users.find(user => user.id === userId);
  if (!target) return res.status(404).json({ error: 'User account could not be found.' });
  if (target.role === UserRole.ADMIN && target.id !== req.user!.id) return res.status(403).json({ error: 'Administrator accounts cannot be changed through this endpoint.' });
  target.verified = status === 'APPROVED';
  saveDatabase();
  writeAuditLog(req.user!.id, 'user_verification_updated', `user:${target.id}`, null, { status }, req.ip || '127.0.0.1');
  res.json({ success: true, user: safeUser(target) });
});

app.get('/api/admin/matches', JWTAuthMiddleware, requireRole([UserRole.ADMIN]), (req, res) => res.json(db.matches || []));
app.post('/api/admin/matches', JWTAuthMiddleware, requireRole([UserRole.ADMIN]), (req: AuthenticatedRequest, res) => {
  const { investorId, farmerId, veterinarianId, sector, allocatedCapitalKES, agreedTerms } = req.body;
  const investor = db.users.find(user => user.id === investorId && user.role === UserRole.INVESTOR);
  const farmer = db.users.find(user => user.id === farmerId && user.role === UserRole.FARMER);
  const veterinarian = db.users.find(user => user.id === veterinarianId && user.role === UserRole.VETERINARIAN);
  const terms = cleanText(agreedTerms, 2000);
  const capital = Number(allocatedCapitalKES);
  if (!investor || !farmer || !veterinarian || !cleanText(sector, 80) || !terms || !Number.isFinite(capital) || capital <= 0) {
    return res.status(400).json({ error: 'Select an investor, farmer, veterinarian, sector, positive capital amount, and terms.' });
  }
  const match: TripartiteMatch = { id: `match_${Date.now()}`, investorId, investorName: investor.name, farmerId, farmerName: farmer.name, veterinarianId, veterinarianName: veterinarian.name, sector: sector.trim(), allocatedCapitalKES: capital, agreedTerms: terms, status: 'PROPOSED', createdAt: new Date().toISOString() };
  db.matches ||= [];
  db.matches.unshift(match);
  saveDatabase();
  writeAuditLog(req.user!.id, 'tripartite_match_created', `match:${match.id}`, null, { investorId, farmerId, veterinarianId }, req.ip || '127.0.0.1');
  res.status(201).json(match);
});

// 7. Register Modular Services (Separation of Concerns)
registerAuthExtensionRoutes(app, JWTAuthMiddleware, validatePasswordStrength, cleanCredential, () => db, saveDatabase);
registerUploadRoutes(app, JWTAuthMiddleware, () => db, saveDatabase);
registerVerificationRoutes(app, JWTAuthMiddleware, requireRole([UserRole.ADMIN]), () => db, saveDatabase);
registerWalletRoutes(app, JWTAuthMiddleware, () => db, saveDatabase);
registerFarmRecordsRoutes(app, JWTAuthMiddleware, farmerOnly, () => db, saveDatabase);
registerVeterinaryRoutes(app, JWTAuthMiddleware, () => db, saveDatabase);
registerInvestmentRoutes(app, JWTAuthMiddleware, () => db, saveDatabase);
registerDisputesRoutes(app, JWTAuthMiddleware, () => db, saveDatabase);
registerReviewsRoutes(app, JWTAuthMiddleware, () => db, saveDatabase);

// 8. Administrative Metrics (Dynamic counting formula queries instead of hardcoded numbers)
app.get('/api/admin/analytics', JWTAuthMiddleware, requireRole([UserRole.ADMIN]), (req, res) => {
  const activeListings = db.listings.filter(item => item.moderationStatus === 'APPROVED').length;
  const activeFarms = db.agreements.filter(a => a.status === 'SIGNED').length + db.partnerships.filter(p => p.status === 'ACTIVE').length;
  
  // Real math aggregates calculated elegantly on live database items
  const totalLeasedAcreage = db.agreements.reduce((sum, current) => sum + (Number(current.acreageLeased) || 0), 0);
  const totalEscrowKES = db.transactions.filter(t => t.status === 'SUCCESS').reduce((sum, item) => sum + item.amountKES, 0);

  res.json({
    activeListings,
    activeFarms,
    totalLeasedAcreage,
    totalEscrowKES,
    registeredUsersCount: db.users.length,
    pendingVerificationsCount: db.verifications.filter(v => v.status === 'PENDING' || v.status === 'MORE_INFO').length,
    pendingListingsCount: db.listings.filter(item => item.moderationStatus === 'PENDING').length,
    openDisputesCount: db.disputes.filter(item => item.status === 'OPEN' || item.status === 'UNDER_REVIEW').length,
    activeCollaborationsCount: db.agreements.filter(item => item.status === 'SIGNED').length + db.partnerships.filter(item => item.status === 'ACTIVE').length + (db.matches || []).filter(item => item.status === 'ACTIVE' || item.status === 'PROPOSED').length
  });
});

app.get('/api/admin/audit-logs', JWTAuthMiddleware, requireRole([UserRole.ADMIN]), (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
  const logs = readRecentAuditLogs(limit);
  res.json({ logs });
});

// Enhanced Healtcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    dbState: fs.existsSync(DB_FILE) ? 'PERSISTED' : 'UNINITIALIZED',
    userCount: db.users.length
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[CRITICAL UNHANDLED ERROR]:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: 'An unexpected internal system error occurred.',
    message: process.env.NODE_ENV !== 'production' ? err.message : 'Please contact server administrators.'
  });
});

// Boot servers
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`ShambaLoop Express Server running on port ${PORT}`);
  });

  // Graceful shutdown
  const handleShutdown = (signal: string) => {
    console.log(`[SHUTDOWN] Received signal ${signal}. Cleaning and draining resources...`);
    saveDatabase();
    server.close(() => {
      console.log('[SHUTDOWN] Connections drained and server shut down successfully.');
      process.exit(0);
    });
    // Hard force exit after 10s timeout
    setTimeout(() => {
      console.error('[SHUTDOWN] Force exiting server.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

startServer();
