import { safeFetch } from '../utils/apiHandler';
import type { Dispute, FarmRecord, LedgerTransaction, Review, UploadedFile, WalletSummary } from '../types';

const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('sl_token') || ''}` });
const api = <T>(url: string, init?: RequestInit) => safeFetch<T>(url, { ...init, headers: { ...headers(), ...(init?.headers || {}) } });

export const sharedWorkspaceApi = {
  records: () => api<FarmRecord[]>('/api/farmer/records'),
  documents: (farmId: string) => api<UploadedFile[]>(`/api/farms/${encodeURIComponent(farmId)}/documents`),
  upload: (body: Record<string, unknown>) => api<{ file: UploadedFile }>('/api/uploads', { method: 'POST', body: JSON.stringify(body) }),
  wallet: () => api<WalletSummary>('/api/wallet/summary'),
  depositIntent: (amountKES: number, idempotencyKey: string) => api<{ transaction: LedgerTransaction }>('/api/wallet/deposit', { method: 'POST', body: JSON.stringify({ amountKES, idempotencyKey }) }),
  disputes: () => api<Dispute[]>('/api/disputes'),
  raiseDispute: (body: Record<string, unknown>) => api<{ dispute: Dispute }>('/api/disputes', { method: 'POST', body: JSON.stringify(body) }),
  reviews: () => api<{ received: Review[]; written: Review[]; averageRating: number }>('/api/reviews/my'),
  eligibleReviews: () => api<Array<{ id: string; name: string; role: string; context: string; engagementId: string; engagementType: 'partnership' | 'job' }>>('/api/reviews/eligible-partners'),
  submitReview: (body: Record<string, unknown>) => api<{ review: Review }>('/api/reviews', { method: 'POST', body: JSON.stringify(body) }),
  bidOnJob: (jobId: string, body: { note?: string; proposedFeeKES?: number }) => api(`/api/veterinary/jobs/${encodeURIComponent(jobId)}/bids`, { method: 'POST', body: JSON.stringify(body) }),
  updateJob: (jobId: string, body: Record<string, unknown>) => api(`/api/veterinary/jobs/${encodeURIComponent(jobId)}`, { method: 'PATCH', body: JSON.stringify(body) }),
};

export const readFileAsBase64 = (file: File) => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(new Error('Unable to read selected file.')); reader.onload = () => resolve(String(reader.result)); reader.readAsDataURL(file); });
