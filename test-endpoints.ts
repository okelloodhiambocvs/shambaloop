/**
 * ShambaLoop End-to-End API Integration & Unit Testing Suite
 * Tests every single RESTful endpoint in the Express / TypeScript API monolith
 */

import { UserRole, ListingType } from './src/types.js';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('==================================================');
  console.log('🚀 SHAMBALOOP AUTOMATED TESTING SUITE COMMENCING 🚀');
  console.log('==================================================\n');

  let testCount = 0;
  let successCount = 0;

  const assert = (condition: boolean, testName: string, errorMsg?: string) => {
    testCount++;
    if (condition) {
      successCount++;
      console.log(`✅ [PASS] - ${testName}`);
    } else {
      console.error(`❌ [FAIL] - ${testName}`);
      if (errorMsg) console.error(`   Reason: ${errorMsg}`);
    }
  };

  try {
    // 1. Healthcheck Assertion
    console.log('📋 Test Group 1: Infrastructure & Health Monitoring');
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    assert(healthRes.status === 200, 'GET /api/health returns 200 Status Code');
    const healthData = await healthRes.json();
    assert(healthData.status === 'healthy', 'GET /api/health returns status="healthy"');
    assert(healthData.dbState === 'PERSISTED', 'GET /api/health verifies Database File is Persisted');
    console.log('');

    // 2. Authentication Flow Assertion (Register & Login)
    console.log('📋 Test Group 2: Subscriber Onboarding & Auth Verification');
    const randomPhone = `07${Math.floor(10000000 + Math.random() * 90000000)}`;
    const regPayload = {
      phone: randomPhone,
      name: 'Test Farmer Kiprop',
      email: 'kiprop.test@shamba.com',
      role: UserRole.FARMER,
      county: 'Uasin Gishu',
      password: 'FarmerSecurePass123!'
    };

    const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regPayload)
    });
    assert(registerRes.status === 201, 'POST /api/auth/register creates user account successfully (201)');
    const regData = await registerRes.json();
    assert(regData.user.phone === randomPhone, 'POST /api/auth/register returns correct phone parameters');
    assert(!!regData.token, 'POST /api/auth/register issues a valid token');
    const jwtToken = regData.token;

    // Test Login with correct password
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: randomPhone, password: 'FarmerSecurePass123!' })
    });
    assert(loginRes.status === 200, 'POST /api/auth/login returns 200 OK');
    const loginData = await loginRes.json();
    assert(loginData.user.id === regData.user.id, 'POST /api/auth/login yields correct user profile payload');
    console.log('');

    // 3. Profiles Endpoint Assertion
    console.log('📋 Test Group 3: Secure User Profile Access & Mutability');
    const profileRes = await fetch(`${BASE_URL}/api/users/profile`, {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    });
    assert(profileRes.status === 200, 'GET /api/users/profile returns 200 OK under JWT Authorization Header');
    
    const updateRes = await fetch(`${BASE_URL}/api/users/profile`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({ name: 'Hon. Test Josphat Kiprop', investmentBudgetKES: 850000 })
    });
    assert(updateRes.status === 200, 'PUT /api/users/profile successfully updates fields (200)');
    const updateData = await updateRes.json();
    assert(updateData.user.name === 'Hon. Test Josphat Kiprop', 'PUT /api/users/profile changes persist in user payload');
    console.log('');

    // 4. Listings Marketplace Assertion
    console.log('📋 Test Group 4: Marketplace CRUD & Filtering API');
    const listCountBefore = (await (await fetch(`${BASE_URL}/api/listings`)).json()).length;
    
    const listPayload = {
      type: ListingType.LAND,
      title: 'Commercial Wheat Fields',
      description: 'Fertile acreage in Narok suited for deep-root grains.',
      locationCounty: 'Narok',
      priceKES: 14000,
      verified: false,
      landDetails: {
        acreage: 10,
        soilType: 'Loam Volcanic',
        waterSource: 'River flow',
        accessibility: 'Main Tarmac',
        idealCrops: ['Wheat', 'Barley']
      }
    };

    const createListRes = await fetch(`${BASE_URL}/api/listings`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify(listPayload)
    });
    assert(createListRes.status === 201, 'POST /api/listings creates unverified marketplace entries');
    const newList = await createListRes.json();

    const listCountAfter = (await (await fetch(`${BASE_URL}/api/listings`)).json()).length;
    assert(listCountAfter === listCountBefore + 1, 'GET /api/listings array expands after POST operations');
    
    // Filter listings
    const filterRes = await fetch(`${BASE_URL}/api/listings?county=Narok`);
    const filterData = await filterRes.json();
    assert(filterData.length >= 1 && filterData[0].locationCounty === 'Narok', 'GET /api/listings handles county query parameters correctly');
    console.log('');

    // 5. M-Pesa Payment Escrow Assertions
    console.log('📋 Test Group 5: Daraja STK Push & Webhook Reconciliation Callback');
    const payRes = await fetch(`${BASE_URL}/api/payments/stkpush`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({ phone: randomPhone, amount: 2000, purpose: 'Escrow Lock for Lease Demo' })
    });
    assert(payRes.status === 200, 'POST /api/payments/stkpush initializes request state');
    const payData = await payRes.json();
    assert(payData.success && payData.transaction.status === 'PENDING', 'POST /api/payments/stkpush registers transaction as PENDING');

    // Simulate callback hook
    const simHookRes = await fetch(`${BASE_URL}/api/payments/simulate-callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkoutRequestId: payData.CheckoutRequestID, success: true })
    });
    assert(simHookRes.status === 200, 'POST /api/payments/simulate-callback processes Safaricom response gracefully');
    const simHookData = await simHookRes.json();
    assert(simHookData.transaction.status === 'SUCCESS', 'M-Pesa reconciliation updates transaction status to SUCCESS');
    console.log('');

    // 6. Leasing & Partnerships Assertions
    console.log('📋 Test Group 6: Land Leasing and Livestock Matching matching');
    const leaseRes = await fetch(`${BASE_URL}/api/land/leases`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({
        listingId: newList.id,
        landownerId: 'user_1',
        acreageLeased: 5,
        pricePerAcreKES: 14000,
        durationMonths: 12
      })
    });
    assert(leaseRes.status === 201, 'POST /api/land/leases forms signed lease contracts');
    const leaseData = await leaseRes.json();
    assert(leaseData.mpesaEscrowStatus === 'ESCROWED', 'Signed land leases maintain status of ESCROWED');

    // Partnership Livestock Match
    const partRes = await fetch(`${BASE_URL}/api/livestock/partnerships`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({
        listingId: 'list_2',
        farmerId: 'user_2',
        animalType: 'dairy',
        breed: 'Pedigree Ayrshire',
        splitPercentInvestor: 40
      })
    });
    assert(partRes.status === 201, 'POST /api/livestock/partnerships institutes matched share systems');
    const partData = await partRes.json();

    // Production log math split verification
    const prodRes = await fetch(`${BASE_URL}/api/livestock/production`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({
        partnershipId: partData.id,
        quantity: 10,
        metric: 'Milk Liters',
        pricePerUnit: 60
      })
    });
    assert(prodRes.status === 200, 'POST /api/livestock/production registers yields');
    const prodData = await prodRes.json();
    const latestProd = prodData.productionLogs[0];
    assert(latestProd.revenueKES === 600, 'Production calculations yield accurate KES revenue totals');
    assert(latestProd.investorPayoutKES === 240, 'Revenue payouts partition 40% (240 KES) share to investors');
    assert(latestProd.farmerPayoutKES === 360, 'Revenue payouts partition 60% (360 KES) share to farmers');
    console.log('');

    // 7. Verification Actions
    console.log('📋 Test Group 7: Credentials and Onboarding Verification');
    const verifRes = await fetch(`${BASE_URL}/api/verification/request`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({
        documentType: 'TITLE_DEED',
        documentNumber: 'DEED-KE-9102-SHAMBA',
        notes: 'Verification for wheat fields'
      })
    });
    assert(verifRes.status === 201, 'POST /api/verification/request submits verification credentials for admin auditing');
    console.log('');

    // 8. Admin Dashboard Metric Aggregations
    console.log('📋 Test Group 8: Administrative Panel Metric Aggregations');
    const analyticsRes = await fetch(`${BASE_URL}/api/admin/analytics`);
    assert(analyticsRes.status === 200, 'GET /api/admin/analytics yields dynamic platform metrics');
    const analyticsData = await analyticsRes.json();
    assert(analyticsData.activeListings >= 1, 'Analytical KPIs count active listings dynamically');
    console.log('');

    // Delete listing created during test
    await fetch(`${BASE_URL}/api/listings/${newList.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    });

    console.log('==================================================');
    console.log(`🎉 TEST RUN CONCLUDED: ${successCount} / ${testCount} ASSERTIONS SATISFIED 🎉`);
    console.log('==================================================');

  } catch (err) {
    console.error('💣 Critical System Failure executing test runner:', err);
  }
}

import { fileURLToPath } from 'url';
import path from 'path';

// Runnable from terminal or file loaders
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runTests();
}

export { runTests };
