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
