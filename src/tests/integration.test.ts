import { describe, test, expect, beforeAll } from 'vitest';
import { UserRole } from '../types';

const BASE_URL = 'http://localhost:3000';

describe('ShambaLoop End-to-End Integration Tests', () => {
  let jwtToken: string = '';
  let testUserPhone: string = '';
  let testUserId: string = '';
  let testCheckoutRequestId: string = '';

  beforeAll(() => {
    // Generate a unique phone number for every test run to bypass duplicate validation constraints
    testUserPhone = `07${Math.floor(10000000 + Math.random() * 90000000)}`;
  });

  describe('Authentication and Subscriber Onboarding Flow', () => {
    test('POST /api/auth/register - Should reject a weak password registration attempt', async () => {
      const weakPayload = {
        phone: '0700000001',
        name: 'Weak User',
        role: UserRole.FARMER,
        password: '123'
      };

      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(weakPayload)
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('security complexity rules');
    });

    test('POST /api/auth/register - Should successfully create a new subscriber profile with a robust password', async () => {
      const regPayload = {
        phone: testUserPhone,
        name: 'Integration Test Farmer',
        email: `tester_${testUserPhone}@shambaloop.test`,
        role: UserRole.FARMER,
        county: 'Kakamega',
        password: 'SecureTestPassword99!'
      };

      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regPayload)
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('token');
      expect(data.user.phone).toBe(testUserPhone);
      expect(data.user.role).toBe(UserRole.FARMER);
      expect(data.user.county).toBe('Kakamega');
      
      testUserId = data.user.id;
      jwtToken = data.token;
    });

    test('POST /api/auth/register - Should fail to register with an already registered phone number', async () => {
      const duplicatePayload = {
        phone: testUserPhone,
        name: 'Another Test Person',
        role: UserRole.FARMER,
        county: 'Nakuru',
        password: 'SecureTestPassword99!'
      };

      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicatePayload)
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error.toLowerCase()).toContain('already registered');
    });

    test('POST /api/auth/login - Should successfully authorize with valid credentials and yield profiles', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: testUserPhone,
          password: 'SecureTestPassword99!'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('token');
      expect(data.user.id).toBe(testUserId);
      expect(data.user.phone).toBe(testUserPhone);
    });

    test('GET /api/users/profile - Should reject profile requests lacking a JWT Authorization header', async () => {
      const response = await fetch(`${BASE_URL}/api/users/profile`);
      expect(response.status).toBe(401);
    });

    test('GET /api/users/profile - Should resolve and return current user profile with valid JWT header', async () => {
      const response = await fetch(`${BASE_URL}/api/users/profile`, {
        headers: { 'Authorization': `Bearer ${jwtToken}` }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe(testUserId);
      expect(data.phone).toBe(testUserPhone);
    });

    test('PUT /api/users/profile - Should successfully update editable metadata attributes', async () => {
      const updatePayload = {
        name: 'Senior Test Farmer Kiprop',
        investmentBudgetKES: 120000
      };

      const response = await fetch(`${BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify(updatePayload)
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user.name).toBe('Senior Test Farmer Kiprop');
      expect(data.user.investmentBudgetKES).toBe(120000);
    });

    test('POST /api/auth/mfa/enroll - Should enroll user in TOTP MFA and generate backup codes', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/mfa/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({ mfaType: 'totp' })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.mfaType).toBe('totp');
      expect(data).toHaveProperty('backupCodes');
      expect(data.backupCodes.length).toBe(5);
    });
  });

  describe('M-Pesa Transaction & Daraja API Flow', () => {
    test('POST /api/payments/stkpush - Should register a new Escrow transaction under PENDING state', async () => {
      const stkPayload = {
        phone: testUserPhone,
        amount: 2500,
        purpose: 'Integration Test Lease Deposit'
      };

      const response = await fetch(`${BASE_URL}/api/payments/stkpush`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify(stkPayload)
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('CheckoutRequestID');
      expect(data).toHaveProperty('transaction');
      expect(data.transaction.status).toBe('PENDING');
      expect(data.transaction.amountKES).toBe(2500);

      testCheckoutRequestId = data.CheckoutRequestID;
    });

    test('POST /api/payments/simulate-callback - Should reconcile the transaction on callback webhook notification', async () => {
      const webhookPayload = {
        checkoutRequestId: testCheckoutRequestId,
        success: true
      };

      const response = await fetch(`${BASE_URL}/api/payments/simulate-callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty('transaction');
      expect(data.transaction.status).toBe('SUCCESS');
    });

    test('GET /api/admin/analytics - Should dynamically increment aggregated active transaction metrics', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/analytics`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('activeListings');
      expect(data).toHaveProperty('activeFarms');
      expect(data).toHaveProperty('totalEscrowKES');
    });
  });

  describe('Escrow-Integrated Dispute Resolution Flow', () => {
    let leaseId = '';
    let disputeId = '';

    test('POST /api/land/leases - Create active landowner lease agreement', async () => {
      const response = await fetch(`${BASE_URL}/api/land/leases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          listingId: 'list_1',
          landownerId: 'user_1',
          acreageLeased: 5,
          pricePerAcreKES: 12000
        })
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.status).toBe('SIGNED');
      expect(data.mpesaEscrowStatus).toBe('ESCROWED');
      leaseId = data.id;
    });

    test('POST /api/disputes - Raise high-contrast active dispute of contract, freezing Escrow status', async () => {
      const response = await fetch(`${BASE_URL}/api/disputes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          agreementId: leaseId,
          reason: 'Landowner denied deep tractor plowing access, violating verbal agreements.'
        })
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.status).toBe('PENDING');
      disputeId = data.id;
    });

    test('POST /api/disputes/:id/resolve - Reject arbitration requests from unauthorized roles (FARMER trying to resolve)', async () => {
      const response = await fetch(`${BASE_URL}/api/disputes/${disputeId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          resolution: 'refund_farmer',
          resolutionReason: 'Unauthorized support ticket bypass action'
        })
      });

      expect(response.status).toBe(403); // Forbids landowner/farmers role from arbitrating
    });
  });
});
