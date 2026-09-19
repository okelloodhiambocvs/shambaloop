import { UserRole } from '../src/types.js';

/**
 * Predictable credentials for local development and automated tests only.
 * This module is imported by server-side code only and must never be enabled
 * for a production process.
 */
export const DEVELOPMENT_SEED_PASSWORDS = {
  user_admin: 'ShambaLoopAdmin#2026',
  user_3: 'ShambaLoopInvestor#2026',
  user_2: 'ShambaLoopFarmer#2026',
  user_vet: 'ShambaLoopVet#2026',
} as const;

export const DEVELOPMENT_SEED_ACCOUNTS = [
  { role: UserRole.ADMIN, name: 'Administrator', phone: '0700000000', password: DEVELOPMENT_SEED_PASSWORDS.user_admin },
  { role: UserRole.INVESTOR, name: 'Investor', phone: '0733444555', password: DEVELOPMENT_SEED_PASSWORDS.user_3 },
  { role: UserRole.FARMER, name: 'Farmer', phone: '0722111222', password: DEVELOPMENT_SEED_PASSWORDS.user_2 },
  { role: UserRole.VETERINARIAN, name: 'Veterinarian', phone: '0744555666', password: DEVELOPMENT_SEED_PASSWORDS.user_vet },
] as const;
