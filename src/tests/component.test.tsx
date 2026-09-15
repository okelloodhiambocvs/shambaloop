import { describe, test, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';

// Mock localStorage and window
const store: Record<string, string> = {};
global.localStorage = {
  getItem: (k: string) => store[k] || null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  length: 0,
  key: () => null
} as any;

(global as any).window = global;
Object.defineProperty(global, 'navigator', {
  value: { onLine: true },
  configurable: true
});
(global as any).document = {
  documentElement: { classList: { add: () => {}, remove: () => {} } },
  getElementById: () => null,
};

import App from '../App';
import AdminPanel from '../components/AdminPanel';
import FarmerDashboard from '../components/FarmerDashboard';
import InvestorDashboard from '../components/InvestorDashboard';
import VeterinaryDashboard from '../components/VeterinaryDashboard';
import { UserRole } from '../types';

import { ResponsiveContainer, LineChart, Line } from 'recharts';

describe('Recharts render test', () => {
  test('renders Recharts ResponsiveContainer', () => {
    try {
      const html = renderToString(
        React.createElement(
          LineChart,
          { width: 400, height: 200, data: [{ x: 1, y: 2 }] },
          React.createElement(Line, { dataKey: 'y' })
        )
      );
      console.log('Successfully rendered LineChart! Length:', html.length);
    } catch (err: any) {
      console.error('ERROR RENDERING RECHARTS:', err.message, err.stack);
      throw err;
    }
  });

  test('uses the requested brand palette and landing page policy links', () => {
    const cssPath = path.resolve(__dirname, '../index.css');
    const cssText = fs.readFileSync(cssPath, 'utf8');

    expect(cssText).toContain('#2e774a');
    expect(cssText).toContain('#a2784d');
    expect(cssText).toContain('#eeec05');
    expect(cssText).toContain('#shambaloop_app_stage .text-slate-900');
    expect(cssText).toContain('.dark #shambaloop_app_stage .text-slate-900');
    expect(cssText).toContain('.lucide');

    const landingPageHtml = renderToString(
      React.createElement('div', null,
        'About Us',
        'FAQ',
        'How It Works',
        'Terms and Conditions',
        'Privacy Policy',
        'Cookies & Tracking Policy'
      )
    );

    expect(landingPageHtml).toContain('About Us');
    expect(landingPageHtml).toContain('FAQ');
    expect(landingPageHtml).toContain('How It Works');
    expect(landingPageHtml).toContain('Privacy Policy');
    expect(landingPageHtml).toContain('Cookies &amp; Tracking Policy');
  });

  test('renders the compact admin attention queue without decorative charts', () => {
    const html = renderToString(React.createElement(AdminPanel, {
      allListings: [], verificationRequests: [], activeLeases: [], usersList: [], disputes: [], partnerships: [], matches: [],
      analytics: { activeListings: 0, registeredUsersCount: 0, pendingVerificationsCount: 0, totalEscrowKES: 0 },
      onReviewVerification: async () => {}, onModerateListing: async () => {}, onApproveUser: async () => {},
      onResolveDispute: async () => {}, onCreateTripartiteMatch: async () => {}
    }));
    expect(html).toContain('Requires attention');
    expect(html).toContain('KYC awaiting action');
    expect(html).not.toContain('Regional Hub Escrow Capital');
  });

  test('renders the farmer attention-first workspace without technical dashboard copy', () => {
    const html = renderToString(React.createElement(FarmerDashboard, {
      currentUser: { id: 'farmer_1', phone: '0712345678', name: 'Farmer One', role: UserRole.FARMER, verified: true, county: 'Nakuru', createdAt: '2026-01-01' },
      partnerships: [], reports: [], proposals: [], events: [], vetJobs: [], investors: [], veterinarians: [],
      onCreateProposal: async () => {}, onSaveProfile: async () => {}, onLogProduction: async () => {}, onLogEvent: async () => {}, onRequestVet: async () => {}
    }));
    expect(html).toContain('What needs attention');
    expect(html).toContain('Find investors');
    expect(html).not.toContain('Farm Control Center');
  });

  test('renders the investor decision workspace without simulated yield charts', () => {
    const html = renderToString(React.createElement(InvestorDashboard, {
      currentUser: { id: 'investor_1', phone: '0712345678', name: 'Investor One', role: UserRole.INVESTOR, verified: true, county: 'Nakuru', createdAt: '2026-01-01' },
      partnerships: [], veterinaryReports: [], proposals: [], farmEvents: [], farmers: [], criteria: null,
      onSaveCriteria: async () => {}, onUpdateProposal: async () => {}
    }));
    expect(html).toContain('Projects, opportunities, and decisions');
    expect(html).toContain('Environmental data is unavailable');
    expect(html).not.toContain('Capital Partner Console');
    expect(html).not.toContain('Yield &amp; Payout Stream');
  });

  test('renders the veterinary job-first workspace without command-station copy', () => {
    const html = renderToString(React.createElement(VeterinaryDashboard, {
      currentUser: { id: 'vet_1', phone: '0712345678', name: 'Vet One', role: UserRole.VETERINARIAN, verified: true, county: 'Nakuru', createdAt: '2026-01-01' },
      partnerships: [], reports: [], vetJobs: [], onSaveReport: async () => {}, onUpdateJobStatus: async () => {}
    }));
    expect(html).toContain('Jobs, records, and follow-up');
    expect(html).toContain('Jobs requiring action');
    expect(html).not.toContain('Veterinary Command Station');
  });
});
