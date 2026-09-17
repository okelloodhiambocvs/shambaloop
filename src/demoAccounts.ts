import { User, UserRole } from './types';

type DemoRole = UserRole.ADMIN | UserRole.FARMER | UserRole.INVESTOR | UserRole.VETERINARIAN;

/**
 * Development-only profiles used to inspect the role workspaces. Passwords are
 * intentionally not stored here; the server issues demo sessions only outside
 * production using the same signed-session path as a normal login.
 */
export const DEMO_ACCOUNT_PROFILES: Record<DemoRole, User> = {
  [UserRole.ADMIN]: {
    id: 'user_admin', phone: '0700000000', name: 'Sylvanus Oroko', email: 'admin@shambaloop.com',
    role: UserRole.ADMIN, verified: true, county: 'Nairobi',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', createdAt: '2026-06-15T00:00:00.000Z'
  },
  [UserRole.FARMER]: {
    id: 'user_2', phone: '0722111222', name: 'Josphat Kiprop', email: 'kiprop.farm@gmail.com',
    role: UserRole.FARMER, verified: true, county: 'Uasin Gishu',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    createdAt: '2026-06-15T00:00:00.000Z', farmSpecialties: ['Dairy Farming', 'Maize Production', 'Heifer breeding'], seekingLandAcreage: 20
  },
  [UserRole.INVESTOR]: {
    id: 'user_3', phone: '0733444555', name: 'David Mwangi', email: 'mwangi.diaspora@yahoo.com',
    role: UserRole.INVESTOR, verified: true, county: 'Nairobi',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    createdAt: '2026-06-15T00:00:00.000Z', investmentBudgetKES: 1200000,
    preferredSectors: ['Livestock', 'Leaseholds'], investmentGoal: 'Seeking high-yield dairy cows or 10-25 acres of fertile cabbage shamba'
  },
  [UserRole.VETERINARIAN]: {
    id: 'user_vet', phone: '0744555666', name: 'Dr. Akinyi Otieno', email: 'vet@shambaloop.ke',
    role: UserRole.VETERINARIAN, verified: true, county: 'Kiambu', createdAt: '2026-06-15T00:00:00.000Z',
    farmSpecialties: ['Dairy health', 'Vaccination', 'Breeding checks']
  }
};

export const DEMO_ACCOUNT_IDS = new Set(Object.values(DEMO_ACCOUNT_PROFILES).map(user => user.id));
