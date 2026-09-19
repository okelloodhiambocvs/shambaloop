import { cp, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

const source = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), 'data'));
const destinationRoot = path.resolve(process.env.BACKUP_DIR || path.join(process.cwd(), 'backups'));
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const destination = path.join(destinationRoot, `shambaloop-${timestamp}`);

try {
  await stat(source);
  await mkdir(destination, { recursive: true });
  await cp(source, destination, { recursive: true, errorOnExist: true, force: false });
  console.log(JSON.stringify({ event: 'backup_completed', source, destination, timestamp }));
} catch (error) {
  console.error(JSON.stringify({ event: 'backup_failed', source, destination, message: error instanceof Error ? error.message : String(error) }));
  process.exitCode = 1;
}
