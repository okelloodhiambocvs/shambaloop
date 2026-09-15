import { describe, test, expect, beforeAll } from 'vitest';
import jwt from 'jsonwebtoken';
import { UserRole } from '../types';

const BASE_URL = 'http://localhost:3000';

describe('ShambaLoop End-to-End Integration Tests', () => {
  let jwtToken: string = '';
  let testUserPhone: string = '';
  let testUserId: string = '';
  let testCheckoutRequestId: string = '';
  const adminToken = jwt.sign({ id: 'user_admin', role: UserRole.ADMIN }, 'shambaloop_super_secret_jwt_token_key_2026_default');

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

    test('GET /api/admin/analytics - rejects unauthenticated access', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/analytics`);
      expect(response.status).toBe(401);
    });

    test('GET /api/admin/analytics - permits authenticated administrators and returns decision metrics', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('activeListings');
      expect(data).toHaveProperty('activeFarms');
      expect(data).toHaveProperty('totalEscrowKES');
      expect(data).toHaveProperty('pendingListingsCount');
      expect(data).toHaveProperty('openDisputesCount');
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
      expect(data.status).toBe('OPEN');
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

  describe('Administrative authorization boundaries', () => {
    test('does not issue an administrator session from a phone number alone', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: '0700000000' })
      });
      expect(response.status).toBe(400);
    });

    test('does not accept user IDs or unsigned base64 payloads as credentials', async () => {
      const forgedToken = Buffer.from(JSON.stringify({ id: 'user_admin' })).toString('base64');
      const response = await fetch(`${BASE_URL}/api/admin/verifications?userId=user_admin`, {
        headers: { Authorization: `Bearer ${forgedToken}`, 'x-user-id': 'user_admin' }
      });
      expect(response.status).toBe(401);
    });

    test('prevents a farmer from reading KYC queue, users, listing controls, and match records', async () => {
      const endpoints = ['/api/admin/verifications', '/api/auth/users', '/api/admin/listings', '/api/admin/matches'];
      const responses = await Promise.all(endpoints.map(endpoint => fetch(`${BASE_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${jwtToken}` }
      })));
      responses.forEach(response => expect(response.status).toBe(403));
    });

    test('returns masked KYC numbers in the administrative queue', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/verifications`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      if (data.length) expect(data[0].documentNumber).toMatch(/^\*\*\*\*/);
    });

    test('allows an administrator to request information with a recorded KYC history', async () => {
      const submitted = await fetch(`${BASE_URL}/api/verification/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify({ documentType: 'ID_CARD', documentNumber: 'TEST-ID-9384', notes: 'Integration review record' })
      });
      expect(submitted.status).toBe(201);
      const request = await submitted.json();
      const decision = await fetch(`${BASE_URL}/api/admin/approve-doc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ requestId: request.id, status: 'MORE_INFO', note: 'Please provide a clearer image.' })
      });
      expect(decision.status).toBe(200);
      const data = await decision.json();
      expect(data.verification.status).toBe('MORE_INFO');
      expect(data.verification.history.at(-1)).toMatchObject({ action: 'MORE_INFO', note: 'Please provide a clearer image.' });
    });
  });

  describe('Farmer workspace authorization and validation', () => {
    let secondFarmerToken = '';

    test('discovers investor profiles without exposing administrative user data', async () => {
      const response = await fetch(`${BASE_URL}/api/farmer/investors?sector=Dairy`, {
        headers: { Authorization: `Bearer ${jwtToken}` }
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      data.forEach((investor: any) => expect(investor.role).toBe(UserRole.INVESTOR));
    });

    test('derives proposal ownership from the authenticated farmer', async () => {
      const response = await fetch(`${BASE_URL}/api/farmer/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify({
          farmerId: 'user_admin', farmerName: 'Spoofed Admin', investorId: 'user_3', title: 'Dairy fodder expansion', sector: 'Dairy',
          farmDescription: 'Five acres, reliable water, and two experienced dairy workers.', capitalRequestedKES: 250000,
          farmerContribution: 'Land, labour, water, and fodder storage.', investorSharePercent: 40
        })
      });
      expect(response.status).toBe(201);
      const proposal = await response.json();
      expect(proposal.farmerId).toBe(testUserId);
      expect(proposal.farmerName).not.toBe('Spoofed Admin');
    });

    test('validates farmer proposal input', async () => {
      const response = await fetch(`${BASE_URL}/api/farmer/proposals`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify({ title: '', sector: 'Invalid', capitalRequestedKES: -1, investorSharePercent: 120 })
      });
      expect(response.status).toBe(400);
    });

    test('creates farm events and veterinary requests under the authenticated farmer', async () => {
      const eventResponse = await fetch(`${BASE_URL}/api/farmer/events`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify({ farmId: 'farm_primary', eventType: 'PEST_ALERT', title: 'Aphid activity', description: 'Aphids found on the greenhouse tomatoes.', severity: 'HIGH' })
      });
      expect(eventResponse.status).toBe(201);
      expect((await eventResponse.json()).farmerId).toBe(testUserId);

      const jobResponse = await fetch(`${BASE_URL}/api/farmer/veterinary-jobs`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify({ farmId: 'farm_primary', location: 'Kakamega farm', animalOrCropType: 'Dairy cattle', serviceType: 'CLINICAL_CHECK', urgency: 'NORMAL', notes: 'Reduced appetite in one animal.' })
      });
      expect(jobResponse.status).toBe(201);
      expect((await jobResponse.json()).farmerPhone).toBe(testUserPhone);
    });

    test('prevents a second farmer from reading or altering the first farmer’s records', async () => {
      const phone = `07${Math.floor(10000000 + Math.random() * 90000000)}`;
      const registration = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name: 'Second Farmer', role: UserRole.FARMER, county: 'Nakuru', password: 'SecondFarmerPassword99!' })
      });
      expect(registration.status).toBe(201);
      secondFarmerToken = (await registration.json()).token;

      const [events, jobs] = await Promise.all([
        fetch(`${BASE_URL}/api/farmer/events`, { headers: { Authorization: `Bearer ${secondFarmerToken}` } }),
        fetch(`${BASE_URL}/api/farmer/veterinary-jobs`, { headers: { Authorization: `Bearer ${secondFarmerToken}` } })
      ]);
      expect(await events.json()).toEqual([]);
      expect(await jobs.json()).toEqual([]);

      const production = await fetch(`${BASE_URL}/api/livestock/production`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secondFarmerToken}` },
        body: JSON.stringify({ partnershipId: 'part_xyz', metric: 'Milk Liters', quantity: 20 })
      });
      expect(production.status).toBe(403);
    });

    test('requires authentication for private veterinary reports', async () => {
      const response = await fetch(`${BASE_URL}/api/veterinary/reports`);
      expect(response.status).toBe(401);
    });
  });

  describe('Investor workspace authorization and validation', () => {
    let investorToken = '';
    let investorId = '';
    let secondInvestorToken = '';
    let proposalId = '';

    test('registers an investor and rejects investor routes for a farmer', async () => {
      const phone = `07${Math.floor(10000000 + Math.random() * 90000000)}`;
      const registration = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name: 'Integration Investor', role: UserRole.INVESTOR, county: 'Nakuru', password: 'InvestorPassword99!' })
      });
      expect(registration.status).toBe(201);
      const investor = await registration.json();
      investorToken = investor.token;
      investorId = investor.user.id;

      const farmerAttempt = await fetch(`${BASE_URL}/api/investor/farmers`, { headers: { Authorization: `Bearer ${jwtToken}` } });
      expect(farmerAttempt.status).toBe(403);
    });

    test('discovers public farmer profiles and stores a brief under the authenticated investor', async () => {
      const discovery = await fetch(`${BASE_URL}/api/investor/farmers?county=Kakamega`, { headers: { Authorization: `Bearer ${investorToken}` } });
      expect(discovery.status).toBe(200);
      const farmers = await discovery.json();
      expect(farmers.some((farmer: any) => farmer.id === testUserId)).toBe(true);
      farmers.forEach((farmer: any) => {
        expect(farmer.phone).toBeUndefined();
        farmer.listings.forEach((listing: any) => expect(listing.ownerPhone).toBeUndefined());
      });

      const saved = await fetch(`${BASE_URL}/api/investor/criteria`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${investorToken}` },
        body: JSON.stringify({ investorId: 'user_admin', investorName: 'Spoofed Admin', lookingFor: 'FARMER_WITH_LAND_NEEDING_CAPITAL', budgetKES: 300000, preferredSectors: ['Dairy'], targetCounties: ['Kakamega'], resourcesProvided: 'Capital and feed equipment.', partnerRequirements: 'Experienced dairy farmer with land.', notes: 'Monthly record review required.' })
      });
      expect(saved.status).toBe(200);
      expect((await saved.json()).investorId).toBe(investorId);
    });

    test('validates investment briefs, searches, and investor listings', async () => {
      const invalidBrief = await fetch(`${BASE_URL}/api/investor/criteria`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${investorToken}` },
        body: JSON.stringify({ lookingFor: 'INVALID', budgetKES: -1, preferredSectors: [], targetCounties: [], resourcesProvided: '', partnerRequirements: '', notes: '' })
      });
      expect(invalidBrief.status).toBe(400);

      const invalidSearch = await fetch(`${BASE_URL}/api/investor/farmers?q=${'x'.repeat(81)}`, { headers: { Authorization: `Bearer ${investorToken}` } });
      expect(invalidSearch.status).toBe(400);

      const invalidListing = await fetch(`${BASE_URL}/api/listings`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${investorToken}` },
        body: JSON.stringify({ type: 'invalid', title: '', description: '', locationCounty: '', priceKES: -100 })
      });
      expect(invalidListing.status).toBe(400);
    });

    test('limits proposal viewing and decisions to the addressed investor', async () => {
      const proposal = await fetch(`${BASE_URL}/api/farmer/proposals`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify({ investorId, title: 'Secure dairy expansion', sector: 'Dairy', farmDescription: 'Established farm with water, fodder, and experienced staff.', capitalRequestedKES: 200000, farmerContribution: 'Land, labour, water, and feed storage.', investorSharePercent: 40 })
      });
      expect(proposal.status).toBe(201);
      proposalId = (await proposal.json()).id;

      const listed = await fetch(`${BASE_URL}/api/investor/proposals`, { headers: { Authorization: `Bearer ${investorToken}` } });
      expect(listed.status).toBe(200);
      expect((await listed.json()).some((item: any) => item.id === proposalId)).toBe(true);

      const changed = await fetch(`${BASE_URL}/api/investor/proposals/${proposalId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${investorToken}` }, body: JSON.stringify({ status: 'NEGOTIATING', farmerId: 'user_admin' })
      });
      expect(changed.status).toBe(200);
      expect((await changed.json()).status).toBe('NEGOTIATING');
    });

    test('blocks a second investor from unrelated proposals, collaboration records, and reports', async () => {
      const phone = `07${Math.floor(10000000 + Math.random() * 90000000)}`;
      const registration = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name: 'Second Investor', role: UserRole.INVESTOR, county: 'Nairobi', password: 'SecondInvestorPassword99!' })
      });
      expect(registration.status).toBe(201);
      secondInvestorToken = (await registration.json()).token;

      const [proposalsResponse, partnershipsResponse, eventsResponse, reportsResponse] = await Promise.all([
        fetch(`${BASE_URL}/api/investor/proposals`, { headers: { Authorization: `Bearer ${secondInvestorToken}` } }),
        fetch(`${BASE_URL}/api/livestock/partnerships`, { headers: { Authorization: `Bearer ${secondInvestorToken}` } }),
        fetch(`${BASE_URL}/api/investor/events`, { headers: { Authorization: `Bearer ${secondInvestorToken}` } }),
        fetch(`${BASE_URL}/api/veterinary/reports`, { headers: { Authorization: `Bearer ${secondInvestorToken}` } })
      ]);
      expect(await proposalsResponse.json()).toEqual([]);
      expect(await partnershipsResponse.json()).toEqual([]);
      expect(await eventsResponse.json()).toEqual([]);
      expect(await reportsResponse.json()).toEqual([]);

      const mutation = await fetch(`${BASE_URL}/api/investor/proposals/${proposalId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secondInvestorToken}` }, body: JSON.stringify({ status: 'ACCEPTED' })
      });
      expect(mutation.status).toBe(403);
    });
  });
});
