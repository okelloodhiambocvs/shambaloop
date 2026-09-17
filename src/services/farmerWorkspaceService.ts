import { safeFetch } from '../utils/apiHandler';
import type { Dispute, FarmRecord, LedgerTransaction, Review, UploadedFile, WalletSummary } from '../types';

const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('sl_token') || ''}` });
const request = <T>(url: string, init?: RequestInit) => safeFetch<T>(url, { ...init, headers: { ...authHeaders(), ...(init?.headers || {}) } });

export const farmerWorkspaceApi = {
  records: () => request<FarmRecord[]>('/api/farmer/records'),
  createRecord: (body: Omit<FarmRecord, 'id' | 'farmerId' | 'farmerName' | 'timestamp' | 'createdAt'>) => request<{ record: FarmRecord }>('/api/farmer/records', { method: 'POST', body: JSON.stringify(body) }),
  documents: (farmId: string) => request<UploadedFile[]>(`/api/farms/${encodeURIComponent(farmId)}/documents`),
  upload: (body: Record<string, unknown>) => request<{ file: UploadedFile }>('/api/uploads', { method: 'POST', body: JSON.stringify(body) }),
  wallet: () => request<WalletSummary>('/api/wallet/summary'),
  createDepositIntent: (amountKES: number, idempotencyKey: string) => request<{ transaction: LedgerTransaction }>('/api/wallet/deposit', { method: 'POST', body: JSON.stringify({ amountKES, idempotencyKey }) }),
  disputes: () => request<Dispute[]>('/api/disputes'),
  raiseDispute: (body: Record<string, unknown>) => request<{ dispute: Dispute }>('/api/disputes', { method: 'POST', body: JSON.stringify(body) }),
  reviews: () => request<{ received: Review[]; written: Review[]; averageRating: number }>('/api/reviews/my'),
  eligibleReviews: () => request<Array<{ id: string; name: string; role: string; context: string; engagementId: string; engagementType: 'partnership' | 'job' }>>('/api/reviews/eligible-partners'),
  submitReview: (body: Record<string, unknown>) => request<{ review: Review }>('/api/reviews', { method: 'POST', body: JSON.stringify(body) }),
};

export async function fileAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(new Error('Could not read the selected file.')); reader.onload = () => resolve(String(reader.result)); reader.readAsDataURL(file); });
}
