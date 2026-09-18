import { describe, test, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { UserRole } from '../types';

const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = 'shambaloop_super_secret_jwt_token_key_2026_default';

const makeToken = (id: string, role: UserRole) => jwt.sign({ id, role }, JWT_SECRET);

describe('Reviews, Wallet Purpose, and FMS Documentation Integration Tests', () => {
  const farmerToken = makeToken('user_2', UserRole.FARMER);
  const investorToken = makeToken('user_3', UserRole.INVESTOR);
  const vetToken = makeToken('user_vet', UserRole.VETERINARIAN);

  describe('Cross-Role Review Candidates (/api/reviews/candidates)', () => {
    test('Farmer discovers review candidates containing investors and veterinarians', async () => {
      const res = await fetch(`${BASE_URL}/api/reviews/candidates`, {
        headers: { Authorization: `Bearer ${farmerToken}` }
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.candidates)).toBe(true);
      expect(data.candidates.length).toBeGreaterThan(0);

      const roles = data.candidates.map((c: any) => c.role);
      expect(roles).toContain(UserRole.INVESTOR);
      expect(roles).toContain(UserRole.VETERINARIAN);
      expect(roles).not.toContain(UserRole.FARMER);
    });

    test('Investor discovers review candidates containing farmers and veterinarians', async () => {
      const res = await fetch(`${BASE_URL}/api/reviews/candidates`, {
        headers: { Authorization: `Bearer ${investorToken}` }
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.candidates)).toBe(true);
      expect(data.candidates.length).toBeGreaterThan(0);

      const roles = data.candidates.map((c: any) => c.role);
      expect(roles).toContain(UserRole.FARMER);
      expect(roles).toContain(UserRole.VETERINARIAN);
      expect(roles).not.toContain(UserRole.INVESTOR);
    });

    test('Veterinarian discovers review candidates containing farmers and investors', async () => {
      const res = await fetch(`${BASE_URL}/api/reviews/candidates`, {
        headers: { Authorization: `Bearer ${vetToken}` }
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.candidates)).toBe(true);
      expect(data.candidates.length).toBeGreaterThan(0);

      const roles = data.candidates.map((c: any) => c.role);
      expect(roles).toContain(UserRole.FARMER);
      expect(roles).toContain(UserRole.INVESTOR);
      expect(roles).not.toContain(UserRole.VETERINARIAN);
    });
  });

  describe('Review Submission Matrix (/api/reviews)', () => {
    test('Farmer can review an Investor', async () => {
      const res = await fetch(`${BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerToken}`
        },
        body: JSON.stringify({
          targetUserId: 'user_3',
          rating: 5,
          title: 'Reliable Partner',
          comment: 'Outstanding milestone support and prompt capital release for dairy production.'
        })
      });
      // 201 or 400 if duplicate
      expect([201, 400]).toContain(res.status);
      if (res.status === 201) {
        const data = await res.json();
        expect(data.review.targetUserId).toBe('user_3');
        expect(data.review.rating).toBe(5);
        expect(data.review.reviewerRole).toBe(UserRole.FARMER);
      }
    });

    test('Rejects invalid rating out of bounds', async () => {
      const res = await fetch(`${BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerToken}`
        },
        body: JSON.stringify({
          targetUserId: 'user_3',
          rating: 6,
          comment: 'Invalid rating test'
        })
      });
      expect(res.status).toBe(400);
    });

    test('Rejects self-reviews', async () => {
      const res = await fetch(`${BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerToken}`
        },
        body: JSON.stringify({
          targetUserId: 'user_2',
          rating: 5,
          comment: 'Trying to review myself'
        })
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Self-review violation');
    });
  });

  describe('Wallet Purpose Identification (/api/wallet/deposit & /api/wallet/summary)', () => {
    test('Farmer initiates deposit with purpose FEED_PURCHASE', async () => {
      const res = await fetch(`${BASE_URL}/api/wallet/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerToken}`
        },
        body: JSON.stringify({
          amountKES: 2500,
          idempotencyKey: `test_dep_${Date.now()}_${Math.random()}`,
          purpose: 'FEED_PURCHASE'
        })
      });
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.transaction.amountKES).toBe(2500);
      expect(data.transaction.purpose).toBe('FEED_PURCHASE');
    });

    test('Investor initiates deposit with purpose INVESTMENT_CAPITAL', async () => {
      const res = await fetch(`${BASE_URL}/api/wallet/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${investorToken}`
        },
        body: JSON.stringify({
          amountKES: 50000,
          idempotencyKey: `test_inv_${Date.now()}_${Math.random()}`,
          purpose: 'INVESTMENT_CAPITAL'
        })
      });
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.transaction.amountKES).toBe(50000);
      expect(data.transaction.purpose).toBe('INVESTMENT_CAPITAL');
    });

    test('Wallet summary returns calculated balances and transactions', async () => {
      const res = await fetch(`${BASE_URL}/api/wallet/summary`, {
        headers: { Authorization: `Bearer ${farmerToken}` }
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.recentTransactions).toBeDefined();
      expect(Array.isArray(data.recentTransactions)).toBe(true);
      expect(typeof data.availableBalanceKES).toBe('number');
    });
  });

  describe('FMS Document Upload & Storage (/api/uploads & /api/farms/:farmId/documents)', () => {
    test('Farmer uploads a verified PDF document and retrieves it', async () => {
      // Valid PDF magic header %PDF-1.4
      const pdfContent = Buffer.from('%PDF-1.4\n%ShambaLoop Test Vaccination Certificate\n%%EOF');
      const base64Data = pdfContent.toString('base64');

      const uploadRes = await fetch(`${BASE_URL}/api/uploads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerToken}`
        },
        body: JSON.stringify({
          fileName: 'vaccination_batch_99.pdf',
          mimeType: 'application/pdf',
          base64Data,
          farmId: 'farm_user_2',
          documentType: 'VACCINATION_REPORT',
          description: 'Certified Foot and Mouth Immunization Record'
        })
      });
      expect(uploadRes.status).toBe(201);
      const uploadData = await uploadRes.json();
      expect(uploadData.file).toBeDefined();
      expect(uploadData.file.originalName).toBe('vaccination_batch_99.pdf');
      expect(uploadData.file.documentType).toBe('VACCINATION_REPORT');

      // Retrieve documents for the farm
      const listRes = await fetch(`${BASE_URL}/api/farms/farm_user_2/documents`, {
        headers: { Authorization: `Bearer ${farmerToken}` }
      });
      expect(listRes.status).toBe(200);
      const listData = await listRes.json();
      expect(Array.isArray(listData)).toBe(true);
      const found = listData.find((d: any) => d.id === uploadData.file.id);
      expect(found).toBeDefined();
      expect(found.documentType).toBe('VACCINATION_REPORT');
    });
  });
});
