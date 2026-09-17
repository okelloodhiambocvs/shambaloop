import type { Request } from 'express';
import { 
  User, UserRole, Listing, LeaseAgreement, LivestockPartnership,
  VerificationRequest, MpesaTransaction, Dispute, TripartiteMatch,
  FarmerProposal, FarmEvent, VeterinaryJob, VeterinaryReport,
  InvestorCriteria, FarmRecord, LedgerTransaction, WalletSummary,
  Review, UploadedFile
} from '../src/types.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
  correlationId?: string;
}

export interface DatabaseSchema {
  users: User[];
  listings: Listing[];
  agreements: LeaseAgreement[];
  partnerships: LivestockPartnership[];
  verifications: VerificationRequest[];
  transactions: MpesaTransaction[];
  passwordHashes: Record<string, string>;
  refreshTokens: string[];
  disputes?: Dispute[];
  matches?: TripartiteMatch[];
  proposals?: FarmerProposal[];
  farmEvents?: FarmEvent[];
  veterinaryJobs?: VeterinaryJob[];
  veterinaryReports?: VeterinaryReport[];
  investorCriteria?: InvestorCriteria[];
  farmRecords?: FarmRecord[];
  ledgerTransactions?: LedgerTransaction[];
  reviews?: Review[];
  uploadedFiles?: UploadedFile[];
  schemaVersion?: number;
}
