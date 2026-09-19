import { UserRole, MpesaAccountLink } from './user';

export interface MpesaTransaction {
  id: string;
  transactionId: string;
  phoneNumber: string;
  amountKES: number;
  purpose: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  timestamp: string;
  idempotencyKey?: string;
  stateHistory?: Array<{ from: 'SUCCESS' | 'FAILED' | 'PENDING' | null; to: 'SUCCESS' | 'FAILED' | 'PENDING'; at: string; source: 'CLIENT' | 'PROVIDER_QUERY' | 'PROVIDER_CALLBACK' }>;
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
  /** Investor whose escrow capital funds a treasury-controlled release. */
  fundingSourceUserId?: string;
  payeeId?: string;
  payeeName?: string;
  paymentProviderRef?: string;
  idempotencyKey?: string;
  timestamp: string;
  stateHistory?: Array<{ from: LedgerTransaction['status'] | null; to: LedgerTransaction['status']; at: string; source: 'CLIENT' | 'PROVIDER_QUERY' | 'PROVIDER_CALLBACK' | 'SYSTEM' }>;
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
  documentType?: 'PASSPORT_PHOTO' | 'ID_FRONT' | 'ID_BACK' | 'CHIEF_LETTER' | 'KVB_LICENSE' | 'AGRICULTURAL_CERTIFICATE' | 'VACCINATION_REPORT' | 'FARM_PHOTO' | 'FEED_RECEIPT' | 'PAYMENT_RECEIPT' | 'EVENT_DOCUMENT' | 'VETERINARY_REPORT' | 'INVESTMENT_VERIFICATION' | 'OTHER' | 'DISPUTE_EVIDENCE' | 'SOIL_TEST' | 'LAND_TITLE_DEED';
  description?: string;
  relatedReportId?: string;
  relatedInvestmentBriefId?: string;
  relatedDisputeId?: string;
}
