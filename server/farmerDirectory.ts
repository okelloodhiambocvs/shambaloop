import type { InvestorFarmerProfile, Listing, User } from '../src/types.js';
import { UserRole } from '../src/types.js';
import { isFixtureRecord } from '../src/domain/discovery.js';

export function findPublicFarmers(db: { users: User[]; listings: Listing[] }, filters: { query?: string; county?: string; sector?: string } = {}): InvestorFarmerProfile[] {
  const byOwner = new Map<string, Listing[]>();
  for (const listing of db.listings) {
    if (isFixtureRecord(listing) || listing.moderationStatus !== 'APPROVED') continue;
    const { ownerPhone: _privatePhone, ...publicListing } = listing;
    const items = byOwner.get(listing.ownerId) || [];
    items.push(publicListing as Listing);
    byOwner.set(listing.ownerId, items);
  }
  const query = filters.query?.trim().toLowerCase() || '';
  const county = filters.county?.trim().toLowerCase() || '';
  const sector = filters.sector?.trim().toLowerCase() || '';
  return db.users.filter(user => user.role === UserRole.FARMER && !isFixtureRecord(user)).flatMap(user => {
    const listings = byOwner.get(user.id) || [];
    const searchable = `${user.name} ${user.county} ${(user.farmSpecialties || []).join(' ')} ${listings.map(listing => `${listing.title} ${listing.description}`).join(' ')}`.toLowerCase();
    if ((query && !searchable.includes(query)) || (county && user.county.toLowerCase() !== county) || (sector && !searchable.includes(sector))) return [];
    return [{ id: user.id, name: user.name, county: user.county, verified: user.verified, createdAt: user.createdAt, farmSpecialties: user.farmSpecialties || [], seekingLandAcreage: user.seekingLandAcreage, listings }];
  });
}
