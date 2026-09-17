import { UserRole } from '../src/types.js';

/**
 * JSON persistence has no database engine migration runner.  This small, ordered
 * runner makes schema changes explicit and idempotent until the documented SQL
 * migration path in SCALABILITY.md is adopted.
 */
export function applyMigrations(db: any): boolean {
  let changed = false;
  const allowedRoles = new Set([UserRole.ADMIN, UserRole.FARMER, UserRole.INVESTOR, UserRole.VETERINARIAN]);
  if (!db.schemaVersion || db.schemaVersion < 2) {
    const previousUsers = db.users || [];
    db.users = previousUsers.filter((user: any) => allowedRoles.has(user.role));
    for (const userId of Object.keys(db.passwordHashes || {})) if (!db.users.some((user: any) => user.id === userId)) delete db.passwordHashes[userId];
    db.farmRecords ||= []; db.ledgerTransactions ||= []; db.reviews ||= []; db.uploadedFiles ||= [];
    db.veterinaryJobs = (db.veterinaryJobs || []).map((job: any) => ({ ...job, farmerId: job.farmerId || db.users.find((user: any) => user.phone === job.farmerPhone)?.id, bids: job.bids || [] }));
    db.schemaVersion = 2;
    changed = true;
  }
  return changed;
}
