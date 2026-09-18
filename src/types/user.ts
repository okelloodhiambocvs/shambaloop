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
  investmentBudgetKES?: number;
  preferredSectors?: string[];
  investmentGoal?: string;
  farmSpecialties?: string[];
  seekingLandAcreage?: number;
  passwordResetRequired?: boolean;
  mfaEnabled?: boolean;
  mfaSecret?: string;
  mfaType?: 'none' | 'email' | 'sms' | 'totp';
  mfaBackupCodes?: string[];
  deviceTrustExpiresAt?: string;
  mpesaLink?: MpesaAccountLink;
}

export interface MpesaAccountLink {
  phoneNumber: string;
  accountHolderName: string;
  idNumber?: string;
  accountType: 'PERSONAL' | 'TILL' | 'PAYBILL';
  verified: boolean;
  linkedAt: string;
  status: 'CONNECTED' | 'PENDING_VERIFICATION' | 'PENDING' | 'DISCONNECTED';
  darajaStatus: string;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  documentType: 'ID_CARD' | 'TITLE_DEED' | 'LIVESTOCK_CERT' | 'CHIEF_LETTER_AND_ID' | 'KVB_LICENSE_AND_ID' | 'NATIONAL_ID' | 'DEGREE_CERTIFICATE' | 'PASSPORT_PHOTO';
  documentIds?: string[];
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
  rating: number;
  title?: string;
  comment: string;
  createdAt: string;
}
