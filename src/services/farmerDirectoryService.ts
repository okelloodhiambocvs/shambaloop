import type { InvestorFarmerProfile } from '../types';
import { visibleFarmerProfiles } from '../domain/discovery';

export async function fetchFarmerDirectory(signal?: AbortSignal): Promise<InvestorFarmerProfile[]> {
  const response = await fetch('/api/investor/farmers', { credentials: 'same-origin', cache: 'no-store', signal });
  if (!response.ok) throw new Error(response.status === 401 ? 'Your session has expired. Please sign in again.' : 'Unable to load farmers. Please try again.');
  const data: unknown = await response.json();
  if (!Array.isArray(data) || !data.every(profile => typeof profile?.id === 'string' && typeof profile?.name === 'string' && typeof profile?.county === 'string' && Array.isArray(profile?.listings) && profile.listings.every((listing: any) => typeof listing?.id === 'string' && typeof listing?.title === 'string' && typeof listing?.description === 'string' && typeof listing?.priceKES === 'number'))) throw new Error('The farmer directory returned an invalid response. Please try again.');
  return visibleFarmerProfiles(data);
}
