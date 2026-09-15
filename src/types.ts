export enum UserRole {
  LANDOWNER = 'landowner',
  FARMER = 'farmer',
  INVESTOR = 'investor',
  ADMIN = 'admin',
  VETERINARIAN = 'veterinarian',
  COOPERATIVE = 'cooperative',
  VERIFIER = 'verifier',
  SUPPORT = 'support'
}

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  role: UserRole;
  verified: boolean;
  county: string;
  avatarUrl?: string;
  createdAt: string;
  // Dynamic fields for partnership matchmaking
  investmentBudgetKES?: number;
  preferredSectors?: string[]; // e.g. ["Livestock", "Crop Production", "Leaseholds"]
  investmentGoal?: string;      // e.g. "Looking for irrigated Kiwi farm partner" or "Seeking 10-20 acres"
  farmSpecialties?: string[];  // e.g. ["Dairy Farming", "Horticulture", "Apiculture"]
  seekingLandAcreage?: number;  // e.g. 5 or 20
  
  // Security Hardening Metadata
  passwordResetRequired?: boolean;
  mfaEnabled?: boolean;
  mfaSecret?: string; // Symmetrically encrypted seed/key
  mfaType?: 'none' | 'email' | 'sms' | 'totp';
  mfaBackupCodes?: string[];
  deviceTrustExpiresAt?: string;
}

export enum ListingType {
  LAND = 'land',
  LIVESTOCK = 'livestock',
  OPPORTUNITY = 'opportunity' // Farm jobs / contracts
}

export interface LandDetails {
  acreage: number;
  soilType?: string;
  waterSource: string; // e.g. "Borehole", "River", "Rain-fed"
  accessibility: string; // e.g. "Tarmac connection", "Dirt road", etc.
  idealCrops: string[];
}

export interface LivestockDetails {
  species: 'dairy' | 'poultry' | 'goat' | 'pig' | 'beef';
  tagId: string;
  breed: string;
  expectedYield?: string; // e.g. "15-20 Liters/day" or "200 eggs/week"
  revenueShareConfig: string; // Describe split, e.g., "60-40"
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
  locationCounty: string; // e.g. "Kiambu", "Nakuru", "Nyandarua"
  priceKES: number; // For leases per acre/month, or animal valuation
  revenueSplitPercent?: number; // Represent investor's share (e.g. 60%)
  verified: boolean;
  /** Administrative state. Listings created before moderation support remain PENDING. */
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
  splitPercentInvestor: number; // e.g. 40% to investor, 60% to farmer
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

export interface VeterinaryReport {
  id: string;
  partnershipId: string;
  animalTagId: string;
  veterinarianId: string;
  veterinarianName: string;
  farmerId: string;
  investorId: string;
  visitType: string;
  findings: string;
  recommendations: string;
  status: 'FIT_FOR_PRODUCTION' | 'FOLLOW_UP_REQUIRED' | 'TREATMENT_REQUIRED' | 'NOT_FIT_FOR_PRODUCTION';
  createdAt: string;
}

export interface ProductionLog {
  id: string;
  date: string;
  metric: string; // e.g. "Milk Liters" or "Egg Trays"
  quantity: number;
  revenueKES: number;
  investorPayoutKES: number;
  farmerPayoutKES: number;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  documentType: 'ID_CARD' | 'TITLE_DEED' | 'LIVESTOCK_CERT';
  documentNumber: string;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'MORE_INFO';
  submittedAt: string;
  adminNote?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  history?: VerificationHistoryEntry[];
}

export interface VerificationHistoryEntry {
  at: string;
  actorId: string;
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'MORE_INFO';
  note?: string;
}

export interface MpesaTransaction {
  id: string;
  transactionId: string; // Sourced from simulated push e.g. "RGC56H78UI"
  phoneNumber: string;
  amountKES: number;
  purpose: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  timestamp: string;
}

export interface Dispute {
  id: string;
  leaseId?: string;
  partnershipId?: string;
  creatorId: string;
  creatorName: string;
  reason: string;
  evidenceText?: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'REFUNDED' | 'RELEASED' | 'RESOLVED';
  createdAt: string;
  updatedAt: string;
  resolutionNotes?: string;
  history?: DisputeHistoryEntry[];
}

export interface DisputeHistoryEntry {
  at: string;
  actorId: string;
  action: 'OPENED' | 'UNDER_REVIEW' | 'REFUNDED' | 'RELEASED';
  note?: string;
}

// ==========================================
// 4-DASHBOARD CORE EXTENSIONS (SHAMBALOOP)
// ==========================================

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
  farmerContribution: string; // e.g., "5 acres arable land, water reservoir, daily labor"
  investorSharePercent: number; // e.g. 40
  farmerSharePercent: number; // e.g. 60
  status: 'DRAFT' | 'SUBMITTED' | 'NEGOTIATING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

export interface InvestorCriteria {
  id: string;
  investorId: string;
  investorName: string;
  lookingFor: 'FARMER_WITH_LAND_NEEDING_CAPITAL' | 'FARM_MANAGER_EXPERTISE' | 'LAND_FOR_LEASE_PROJECT';
  budgetKES: number;
  preferredSectors: string[];
  targetCounties: string[];
  notes: string;
  status: 'ACTIVE' | 'MATCHED' | 'PAUSED';
  createdAt: string;
}

export interface FarmEvent {
  id: string;
  farmId: string;
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

export interface VeterinaryJob {
  id: string;
  farmId: string;
  farmerName: string;
  farmerPhone: string;
  location: string;
  animalOrCropType: string;
  serviceType: 'CLINICAL_CHECK' | 'VACCINATION' | 'PREGNANCY_SCAN' | 'EMERGENCY_SURGERY' | 'NUTRITIONAL_AUDIT';
  urgency: 'NORMAL' | 'URGENT' | 'EMERGENCY';
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';
  assignedVetId?: string;
  assignedVetName?: string;
  requestedDate: string;
  notes?: string;
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

