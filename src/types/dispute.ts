import { UserRole } from './user';

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
