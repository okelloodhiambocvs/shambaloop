import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';
export default async function setup() {
  const port = await new Promise<number>(resolve => { const server = net.createServer(); server.listen(0, '127.0.0.1', () => { const address = server.address() as net.AddressInfo; server.close(() => resolve(address.port)); }); });
  const directory = mkdtempSync(path.join(tmpdir(), 'shambaloop-test-'));
  process.env.TEST_BASE_URL = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ['--import', 'tsx', 'server.ts'], { env: { ...process.env, NODE_ENV: 'test', PORT: String(port), DATA_DIR: directory }, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', chunk => { output = (output + chunk).slice(-10000); });
  child.stderr.on('data', chunk => { output = (output + chunk).slice(-10000); });
  try {
    let ready = false;
    for (let i = 0; i < 150; i++) {
      if (child.exitCode !== null) throw new Error(output);
      try { const response = await fetch(`${process.env.TEST_BASE_URL}/api/listings`); if (response.ok) { ready = true; break; } } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!ready) throw new Error(`Test server did not become ready: ${output}`);
  } catch (error) { child.kill(); throw error; }
  return async () => {
    child.kill('SIGTERM');
    await new Promise<void>(resolve => { child.once('exit', () => resolve()); setTimeout(() => { child.kill('SIGKILL'); resolve(); }, 5000).unref(); });
    rmSync(directory, { recursive: true, force: true });
  };
}
