import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { ListingType } from '../src/types.js';
import { DEMO_ACCOUNT_PROFILES } from '../src/demoAccounts.js';
import { DEVELOPMENT_SEED_PASSWORDS } from './developmentSeedAccounts.js';
// Seed initial default accounts and records
export function seedTestData(db: any, DATA_DIR: string) {
  db.users = Object.values(DEMO_ACCOUNT_PROFILES).map(user => ({ ...user }));

  db.users.forEach(u => {
    const password = DEVELOPMENT_SEED_PASSWORDS[u.id as keyof typeof DEVELOPMENT_SEED_PASSWORDS];
    if (password) db.passwordHashes[u.id] = bcrypt.hashSync(password, 12);
    u.passwordResetRequired = false;
  });
  
  db.listings = [
    {
      id: 'list_1',
      type: ListingType.LAND,
      title: '5-Acre Flat Fertile Red Soil Plot',
      description: 'Highly productive parcel suitable for high-yield white potatoes, cabbages or garden-pea operations. Already fenced off. Water is readily available through an on-site solar-pumped borehole feeding into gravity tanks. Easily accessible via primary graded feeder road 2km off the Ol Kalou tarmac.',
      locationCounty: 'Nyandarua',
      priceKES: 12000,
      verified: true,
      imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
      ownerId: 'user_1',
      ownerName: 'Wanjiku Kamau',
      ownerPhone: '0712345678',
      landDetails: {
        acreage: 5,
        soilType: 'Volcanic Red Loam',
        waterSource: 'Solar Borehole',
        accessibility: 'Chipped Feeder Road',
        idealCrops: ['Potatoes', 'Cabbages', 'Carrots', 'Barley']
      },
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'list_2',
      type: ListingType.LIVESTOCK,
      title: 'High-Yield Friesian Dairy Heifers',
      description: 'Listing for shared investment in 3 registered pure pedigree Friesian dairy cows currently in early second lactation. Producing average of 24 liters daily each. Seeking an experienced dairy farm manager in Kiambu/Nyandarua who can manage fodder production and milk logistics. We will split high-yield margins 60% (Farmer-Manager) and 40% (Investor) after input subtractions.',
      locationCounty: 'Kiambu',
      priceKES: 185000,
      revenueSplitPercent: 40,
      verified: true,
      imageUrl: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=800',
      ownerId: 'user_3',
      ownerName: 'David Mwangi',
      ownerPhone: '0733444555',
      livestockDetails: {
        species: 'dairy',
        tagId: 'SL-KE-FR-901',
        breed: 'Pure pedigree Friesian',
        expectedYield: '22 - 26 Liters per day each',
        revenueShareConfig: '60% Farmer (land/feed), 40% Investor (funding)'
      },
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'list_3',
      type: ListingType.OPPORTUNITY,
      title: 'Contract Farming: 10,000 Broiler Feed Cycle',
      description: 'Seeking a skilled broiler poultry specialist to manage a clean modern poultry house in Nakuru (Lanet). Complete setup with automated drinkers, charcoal burners, heating grids and secure dry feed storage blocks already prepared. All starting chicks, vaccination schedules, and pre-purchased feeds are funded by the landowner investor. Offering handsome production-linked profit share.',
      locationCounty: 'Nakuru',
      priceKES: 35000,
      verified: true,
      imageUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800',
      ownerId: 'user_1',
      ownerName: 'Wanjiku Kamau',
      ownerPhone: '0712345678',
      opportunityDetails: {
        requiredSkills: ['Poultry vaccination', 'Biosecurity management', 'Broiler feeding regimens'],
        durationMonths: 6,
        expectedWorkforce: 2,
        compensationType: 'Profit-Share'
      },
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'list_4',
      type: ListingType.LAND,
      title: '15-Acre Black Cotton Maize Land in Eldoret',
      description: 'Virgin land ready for commercial white maize or soya bean operations. Mechanized tractor accessibility is fully available. Highly reliable seasonal rainfall pattern.',
      locationCounty: 'Uasin Gishu',
      priceKES: 15000,
      verified: false,
      imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800',
      ownerId: 'user_2',
      ownerName: 'Josphat Kiprop',
      ownerPhone: '0722111222',
      landDetails: {
        acreage: 15,
        soilType: 'Deep Black Cotton',
        waterSource: 'Rain-fed / Seasonal Stream',
        accessibility: 'Graded bypass',
        idealCrops: ['Maize', 'Wheat', 'Soyabeans']
      },
      createdAt: new Date().toISOString()
    }
  ];

  db.agreements = [];

  db.partnerships = [
    {
      id: 'part_xyz',
      listingId: 'list_2',
      investorId: 'user_3',
      farmerId: 'user_2',
      animalTagId: 'SL-KE-FR-901',
      animalType: 'dairy',
      breed: 'Pure pedigree Friesian',
      splitPercentInvestor: 40,
      status: 'ACTIVE',
      healthLogs: [],
      productionLogs: []
    }
  ];

  db.veterinaryJobs = [
    {
      id: 'vet_job_seed_001',
      farmId: 'part_xyz',
      farmerId: 'user_2',
      farmerName: 'Josphat Kiprop',
      farmerPhone: '0722111222',
      location: 'Uasin Gishu',
      animalOrCropType: 'Dairy cattle',
      serviceType: 'CLINICAL_CHECK',
      urgency: 'NORMAL',
      status: 'ASSIGNED',
      assignedVetId: 'user_vet',
      assignedVetName: 'Dr. Mercy Wanjiru',
      requestedDate: new Date().toISOString()
    }
  ];

  db.verifications = [];
  db.transactions = [];
  db.ledgerTransactions = [
    {
      id: 'seed_investor_treasury_deposit',
      reference: 'SEED_TREASURY_001',
      userId: 'user_3',
      amountKES: 100000,
      currency: 'KES',
      type: 'DEPOSIT',
      category: 'INVESTMENT_CAPITAL',
      status: 'COMPLETED',
      description: 'Confirmed investor capital held in ShambaLoop Treasury',
      payerId: 'user_3',
      payerName: 'David Mwangi',
      payeeId: 'SHAMBALOOP_TREASURY',
      payeeName: 'ShambaLoop Treasury',
      timestamp: new Date().toISOString(),
      stateHistory: [{ from: null, to: 'COMPLETED', at: new Date().toISOString(), source: 'SYSTEM' }]
    }
  ];
}

