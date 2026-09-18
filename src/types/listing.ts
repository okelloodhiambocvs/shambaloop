export enum ListingType {
  LAND = 'land',
  LIVESTOCK = 'livestock',
  OPPORTUNITY = 'opportunity'
}

export interface LandDetails {
  acreage: number;
  soilType?: string;
  waterSource: string;
  accessibility: string;
  idealCrops: string[];
}

export interface LivestockDetails {
  species: 'dairy' | 'poultry' | 'goat' | 'pig' | 'beef';
  tagId: string;
  breed: string;
  expectedYield?: string;
  revenueShareConfig: string;
}

export interface OpportunityDetails {
  requiredSkills: string[];
  durationMonths: number;
  expectedWorkforce: number;
  compensationType: 'Salary' | 'Profit-Share' | 'Mixed';
}

export interface Listing {
  id: string;
  type: ListingType;
  title: string;
  description: string;
  locationCounty: string;
  priceKES: number;
  revenueSplitPercent?: number;
  verified: boolean;
  moderationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  moderationNote?: string;
  imageUrl: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  landDetails?: LandDetails;
  livestockDetails?: LivestockDetails;
  opportunityDetails?: OpportunityDetails;
  createdAt: string;
}

export interface LeaseAgreement {
  id: string;
  listingId: string;
  landownerId: string;
  farmerId: string;
  acreageLeased: number;
  pricePerAcreKES: number;
  durationMonths: number;
  startDate: string;
  status: 'PENDING' | 'SIGNED' | 'COMPLETED' | 'CANCELLED';
  mpesaEscrowStatus: 'UNPAID' | 'ESCROWED' | 'DISBURSED' | 'REFUNDED' | 'DISPUTED';
  paymentsMade: number;
}

export interface LivestockPartnership {
  id: string;
  listingId: string;
  investorId: string;
  farmerId: string;
  animalTagId: string;
  animalType: string;
  breed: string;
  splitPercentInvestor: number;
  status: 'PROPOSED' | 'ACTIVE' | 'COMPLETED';
  healthLogs: HealthLog[];
  productionLogs: ProductionLog[];
}

export interface HealthLog {
  id: string;
  date: string;
  status: 'Healthy' | 'Sick' | 'Recovering' | 'Vaccinated';
  notes: string;
  recordedBy: string;
}

export interface ProductionLog {
  id: string;
  date: string;
  metric: string;
  quantity: number;
  revenueKES: number;
  investorPayoutKES: number;
  farmerPayoutKES: number;
}
