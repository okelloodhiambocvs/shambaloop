import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const directory = mkdtempSync(path.join(tmpdir(), 'shambaloop-smoke-'));
const child = spawn(process.execPath, ['dist/server.cjs'], { env: { ...process.env, NODE_ENV: 'production', PORT: '31987', DATA_DIR: directory, JWT_SECRET: crypto.randomBytes(32).toString('hex'), REFRESH_TOKEN_SECRET: crypto.randomBytes(32).toString('hex'), DB_ENCRYPTION_KEY: crypto.randomBytes(32).toString('hex') }, stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32' });
let output = '';
child.stdout.on('data', data => { output += data; }); child.stderr.on('data', data => { output += data; });
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw new Error(output);
    try { if ((await fetch('http://127.0.0.1:31987/api/health')).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, output);
  assert.equal((await fetch('http://127.0.0.1:31987/')).status, 200);
  assert.deepEqual(await (await fetch('http://127.0.0.1:31987/api/listings')).json(), []);
  assert.equal((await fetch('http://127.0.0.1:31987/api/auth/demo-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: 'user_admin' }) })).status, 404);
  console.log('Production npm start, health, HTML, empty marketplace, and disabled demo access passed.');
} finally {
  try { process.platform === 'win32' ? child.kill() : process.kill(-child.pid, 'SIGTERM'); } catch {}
  await new Promise(resolve => { child.once('exit', resolve); setTimeout(resolve, 3000).unref(); });
  rmSync(directory, { recursive: true, force: true });
}
