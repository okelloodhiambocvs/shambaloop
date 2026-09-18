export enum UserRole {
  FARMER = 'farmer',
  INVESTOR = 'investor',
  ADMIN = 'admin',
  VETERINARIAN = 'veterinarian'
}

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  role: UserRole;
  verified: boolean;
  verificationStatus?: 'UNVERIFIED' | 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
  isEmailVerified?: boolean;
  vetLicenseNumber?: string;
  vetBoardVerified?: boolean;
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

  // Safaricom Daraja M-Pesa Account Linking
  mpesaLink?: MpesaAccountLink;
}

export interface MpesaAccountLink {
  phoneNumber: string;
  accountHolderName: string;
  idNumber?: string;
  accountType: 'PERSONAL' | 'TILL' | 'PAYBILL';
  verified: boolean;
  linkedAt: string;
  status: 'CONNECTED' | 'PENDING_VERIFICATION' | 'DISCONNECTED';
  darajaStatus: string;
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
  farmId?: string;
  animalTagId: string;
  animalOrCropType?: string;
  veterinarianId: string;
  veterinarianName: string;
  farmerId: string;
  farmerName?: string;
  investorId: string;
  investorName?: string;
  visitType: string;
  visitDate?: string;
  diagnosis?: string;
  treatment?: string;
  medication?: string;
  vaccination?: string;
  pregnancyStatus?: 'PREGNANT' | 'NOT_PREGNANT' | 'NOT_APPLICABLE' | 'UNKNOWN';
  observations?: string;
  findings: string;
  recommendations: string;
  followUpDate?: string;
  photos?: string[];
  documents?: string[];
  status: 'FIT_FOR_PRODUCTION' | 'FOLLOW_UP_REQUIRED' | 'TREATMENT_REQUIRED' | 'NOT_FIT_FOR_PRODUCTION';
  reportStatus?: 'DRAFT' | 'SUBMITTED' | 'FINALIZED';
  isFinalized?: boolean;
  finalizedAt?: string;
  version?: number;
  originalReportId?: string;
  amendments?: { version: number; date: string; reason: string; amendedBy: string; changes: string }[];
  createdAt: string;
  updatedAt?: string;
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
  documentType: 'ID_CARD' | 'TITLE_DEED' | 'LIVESTOCK_CERT' | 'CHIEF_LETTER_AND_ID' | 'KVB_LICENSE_AND_ID' | 'NATIONAL_ID' | 'DEGREE_CERTIFICATE' | 'PASSPORT_PHOTO';
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
  jobId?: string;
  creatorId: string;
  creatorName: string;
  creatorRole?: UserRole;
  respondentId?: string;
  respondentName?: string;
  respondentRole?: UserRole;
  title?: string;
  reason: string;
  evidenceText?: string;
  evidenceUrls?: string[];
  status: 'OPEN' | 'UNDER_REVIEW' | 'REFUNDED' | 'RELEASED' | 'RESOLVED' | 'CLOSED' | 'ESCALATED';
  createdAt: string;
  updatedAt: string;
  resolutionNotes?: string;
  messages?: { senderId: string; senderName: string; senderRole: UserRole; message: string; evidenceUrls?: string[]; timestamp: string }[];
  history?: DisputeHistoryEntry[];
}

export interface DisputeHistoryEntry {
  at: string;
  actorId: string;
  action: 'OPENED' | 'UNDER_REVIEW' | 'REFUNDED' | 'RELEASED' | 'RESOLVED' | 'CLOSED' | 'ESCALATED';
  note?: string;
}

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
  rrpKES?: number; // Recommended Retail Price
  supplierInfo?: string;
  evidenceUrls?: string[];
  notes?: string;
  timestamp: string;
  createdAt: string;
  history?: { timestamp: string; action: string; actorId: string; note?: string }[];
}

export interface LedgerTransaction {
  id: string;
  reference: string;
  userId: string;
  amountKES: number;
  currency: 'KES';
  type: 'DEPOSIT' | 'ALLOCATION' | 'RELEASE' | 'PAYOUT' | 'EXPENSE' | 'RETURN' | 'WITHDRAWAL';
  category: 'OPERATIONAL' | 'PERSONAL_EARNINGS' | 'INVESTMENT_CAPITAL';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  relatedEntityId?: string;
  relatedEntityType?: 'FARM' | 'PROPOSAL' | 'JOB' | 'MILESTONE' | 'COLLABORATION';
  description: string;
  purpose?: string;
  payerId?: string;
  payerName?: string;
  payeeId?: string;
  payeeName?: string;
  paymentProviderRef?: string;
  idempotencyKey?: string;
  timestamp: string;
}

export interface WalletSummary {
  userId: string;
  role: UserRole;
  availableBalanceKES: number;
  pendingInKES: number;
  approvedKES: number;
  releasedKES: number;
  operationalFarmFundsKES?: number;
  farmerEarningsKES?: number;
  investmentCapitalKES?: number;
  committedFundsKES?: number;
  allocatedFundsKES?: number;
  releasedFundsKES?: number;
  farmExpensesKES?: number;
  returnsKES?: number;
  pendingJobPaymentsKES?: number;
  earningsKES?: number;
  recentTransactions: LedgerTransaction[];
  mpesaLink?: MpesaAccountLink;
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: UserRole;
  targetUserId: string;
  targetUserName: string;
  targetUserRole: UserRole;
  partnershipId?: string;
  jobId?: string;
  proposalId?: string;
  rating: number; // 1 to 5
  title?: string;
  comment: string;
  createdAt: string;
}

export interface UploadedFile {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploaderId: string;
  uploaderRole: UserRole;
  url: string;
  isPrivate: boolean;
  createdAt: string;
  farmId?: string;
  documentType?: 'VACCINATION_REPORT' | 'FARM_PHOTO' | 'FEED_RECEIPT' | 'PAYMENT_RECEIPT' | 'EVENT_DOCUMENT' | 'VETERINARY_REPORT' | 'INVESTMENT_VERIFICATION' | 'OTHER';
  description?: string;
  relatedReportId?: string;
  relatedInvestmentBriefId?: string;
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

/** Public farmer information that an authenticated investor may use for discovery. */
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

export interface VeterinaryJob {
  id: string;
  farmId: string;
  farmerName: string;
  farmerPhone: string;
  location: string;
  animalOrCropType: string;
  serviceType: 'CLINICAL_CHECK' | 'VACCINATION' | 'PREGNANCY_SCAN' | 'EMERGENCY_SURGERY' | 'NUTRITIONAL_AUDIT';
  urgency: 'NORMAL' | 'URGENT' | 'EMERGENCY';
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'INCOMPLETE' | 'CANCELLED';
  assignedVetId?: string;
  assignedVetName?: string;
  requestedDate: string;
  notes?: string;
  farmerId?: string;
  bids?: { veterinarianId: string; veterinarianName: string; note?: string; proposedFeeKES?: number; createdAt: string }[];
  completedAt?: string;
  completionNotes?: string;
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

