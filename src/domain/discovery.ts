import { legacyFixtureIds } from './legacyFixtureIds';
import type { InvestorFarmerProfile } from '../types';

export function isFixtureRecord(record: { id: string; dataOrigin?: string }): boolean {
  return record.dataOrigin === 'fixture' || legacyFixtureIds.has(record.id);
}

/** Apply at both API and view boundaries so a stale API cannot restore sample cards. */
export function visibleFarmerProfiles(profiles: InvestorFarmerProfile[]): InvestorFarmerProfile[] {
  return profiles.filter(profile => !isFixtureRecord(profile)).map(profile => ({
    ...profile,
    listings: profile.listings.filter(listing => !isFixtureRecord(listing) && listing.moderationStatus === 'APPROVED')
  }));
}
