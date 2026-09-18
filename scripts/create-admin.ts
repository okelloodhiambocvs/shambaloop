import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
// Run only while the app is stopped: JSON storage has one writer.
const { ADMIN_PHONE: phone, ADMIN_NAME: name, ADMIN_PASSWORD: password } = process.env;
if (!phone || !/^0[17]\d{8}$/.test(phone) || !name || !password || password.length < 12 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^a-zA-Z0-9]/.test(password)) throw new Error('Set ADMIN_PHONE (07/01 format), ADMIN_NAME, and a strong ADMIN_PASSWORD of at least 12 characters.');
const directory = path.resolve(process.env.DATA_DIR || 'data');
const file = path.join(directory, 'db.json');
fs.mkdirSync(directory, { recursive: true });
const db = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { users: [], passwordHashes: {} };
if (db.users.some((user: any) => user.phone === phone)) throw new Error('Phone already exists; no account was modified.');
const id = `user_${crypto.randomUUID()}`;
db.users.push({ id, phone, name, role: 'admin', county: 'Nairobi', verified: true, createdAt: new Date().toISOString() });
db.passwordHashes[id] = bcrypt.hashSync(password, 12);
fs.writeFileSync(`${file}.tmp`, JSON.stringify(db, null, 2), { mode: 0o600 });
fs.renameSync(`${file}.tmp`, file);
console.log('Administrator created.');
