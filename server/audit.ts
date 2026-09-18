import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), 'data'));
const AUDIT_FILE = path.join(DATA_DIR, 'audit_log.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface AuditLogEntry {
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  previous_value: any;
  new_value: any;
  ip_address: string;
}

export function writeAuditLog(
  actor: string,
  action: string,
  resource: string,
  prevValue: any,
  newValue: any,
  ip: string = '127.0.0.1'
): void {
  const entry: AuditLogEntry = {
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

export function readRecentAuditLogs(limit = 100): AuditLogEntry[] {
  if (!fs.existsSync(AUDIT_FILE)) return [];
  try {
    const lines = fs.readFileSync(AUDIT_FILE, 'utf-8')
      .split('\n')
      .filter(line => line.trim().length > 0);
    return lines.slice(-limit).map(l => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    }).filter(Boolean) as AuditLogEntry[];
  } catch {
    return [];
  }
}
