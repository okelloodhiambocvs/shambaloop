import { UserRole } from './user';
import { Listing } from './listing';

export interface FarmRecord {
  id: string;
  farmId: string;
  farmerId: string;
  farmerName?: string;
  recordType: 'FEED' | 'INPUTS' | 'LIVESTOCK' | 'EXPENSE' | 'PRODUCTION' | 'EVENT' | 'VACCINATION' | 'MILESTONE' | 'PURCHASE' | 'LOSS' | 'OTHER';
  description: string;
  quantity: number;
  unit?: string;
  date: string;
  quotationKES?: number;
  actualPriceKES?: number;
  rrpKES?: number;
  supplierInfo?: string;
  evidenceUrls?: string[];
  notes?: string;
  timestamp: string;
  createdAt: string;
  history?: { timestamp: string; action: string; actorId: string; note?: string }[];
}

export interface FarmerProposal {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  investorId?: string;
  investorName?: string;
  title: string;
  sector: 'Dairy' | 'Crops' | 'Poultry' | 'Horticulture' | 'Goats' | 'Mixed';
  farmDescription: string;
  capitalRequestedKES: number;
  farmerContribution: string;
  investorSharePercent: number;
  farmerSharePercent: number;
  timelineMonths?: number;
  expectedStartDate?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'NEGOTIATING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  updatedAt?: string;
}

export interface InvestorCriteria {
  id: string;
  investorId: string;
  investorName: string;
  title?: string;
  lookingFor: 'FARMER_WITH_LAND_NEEDING_CAPITAL' | 'FARM_MANAGER_EXPERTISE' | 'LAND_FOR_LEASE_PROJECT';
  budgetKES: number;
  preferredSectors: string[];
  targetCounties: string[];
  notes: string;
  objectives?: string;
  timelineMonths?: number;
  resourcesProvided?: string;
  partnerRequirements?: string;
  documents?: string[];
  images?: string[];
  milestones?: { title: string; targetMonth: number; budgetPercent: number }[];
  status: 'ACTIVE' | 'MATCHED' | 'PAUSED';
  createdAt: string;
  updatedAt?: string;
}

export interface InvestorFarmerProfile {
  id: string;
  name: string;
  county: string;
  verified: boolean;
  createdAt: string;
  farmSpecialties?: string[];
  seekingLandAcreage?: number;
  listings: Listing[];
}

export interface FarmEvent {
  id: string;
  farmId: string;
  farmerId?: string;
  farmerName: string;
  eventType: 'CALVING_DUE' | 'DROUGHT_ALERT' | 'PEST_ALERT' | 'VACCINATION_DUE' | 'HARVEST_WINDOW' | 'DISEASE_OUTBREAK';
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  date: string;
  actionTaken?: string;
  reportedBy: string;
  impactOnProduce?: string;
}

export interface TripartiteMatch {
  id: string;
  investorId: string;
  investorName: string;
  farmerId: string;
  farmerName: string;
  vetId?: string;
  vetName?: string;
  veterinarianId?: string;
  veterinarianName?: string;
  agreementTitle?: string;
  sector: string;
  capitalKES?: number;
  allocatedCapitalKES?: number;
  agreedTerms?: string;
  status: 'PROPOSED' | 'ACTIVE' | 'REVIEW' | 'COMPLETED';
  startDate?: string;
  createdAt?: string;
}

export type InvestmentLifecycleStatus =
  | 'INVESTMENT_CREATED'
  | 'PROPOSAL_SELECTED'
  | 'AGREEMENT_CONFIRMED'
  | 'FUNDING_PENDING'
  | 'FUNDED'
  | 'FARM_ACTIVE'
  | 'MILESTONES_IN_PROGRESS'
  | 'PRODUCTION'
  | 'REVENUE_GENERATED'
  | 'SETTLEMENT'
  | 'COMPLETED';

export interface FarmMilestone {
  id: string;
  farmId: string;
  title: string;
  description: string;
  category: 'PREPARATION' | 'PROCUREMENT' | 'VETERINARY' | 'PRODUCTION' | 'HARVEST' | 'SETTLEMENT' | 'GENERAL';
  targetDate: string;
  completedDate?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED_FOR_REVIEW' | 'VERIFIED_AND_RELEASED' | 'REJECTED';
  allocatedFundsKES: number;
  releasedFundsKES: number;
  evidenceNotes?: string;
  evidenceUrl?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface FarmTimelineEvent {
  id: string;
  farmId: string;
  timestamp: string;
  eventType: string;
  title: string;
  description: string;
  responsibleUser: string;
  responsibleRole: UserRole;
  evidence?: string;
  financialImpactKES?: number;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'NOT_APPLICABLE';
}
