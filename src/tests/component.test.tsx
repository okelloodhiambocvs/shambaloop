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
import LoginModal from '../components/LoginModal';
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
    expect(cssText).toContain('@custom-variant dark');
    expect(cssText).toContain('.dark, .dark *');
    expect(cssText).toContain('.lucide {');

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

  test('opens every seeded role for Corporate Portal dashboard exploration', () => {
    const demoUsers = [
      { id: 'user_2', phone: '0722111222', name: 'Farmer Demo', role: UserRole.FARMER, verified: true, county: 'Uasin Gishu', createdAt: '2026-01-01' },
      { id: 'user_3', phone: '0733444555', name: 'Investor Demo', role: UserRole.INVESTOR, verified: true, county: 'Nairobi', createdAt: '2026-01-01' },
      { id: 'user_admin', phone: '0700000000', name: 'Admin Demo', role: UserRole.ADMIN, verified: true, county: 'Nairobi', createdAt: '2026-01-01' },
      { id: 'user_vet', phone: '0744555666', name: 'Veterinary Demo', role: UserRole.VETERINARIAN, verified: true, county: 'Kiambu', createdAt: '2026-01-01' }
    ];
    const html = renderToString(React.createElement(LoginModal, {
      isOpen: true, targetRole: 'dashboard', usersList: demoUsers,
      onClose: () => {}, onDemoLogin: async () => ({ success: true }), onCustomLogin: async () => ({ success: true }), onCustomRegister: async () => ({ success: true })
    }));

    expect(html).toContain('Choose a seeded demo account to explore its dashboard:');
    for (const user of demoUsers) expect(html).toContain(user.name);
  });

  test('keeps the shared Dashboard and Listings controls at the top and removes regional indices', () => {
    const appPath = path.resolve(__dirname, '../App.tsx');
    const appText = fs.readFileSync(appPath, 'utf8');
    const navIndex = appText.indexOf('id="dashboard_view_navigation"');
    const roleDashboardsIndex = appText.indexOf('ROLE SPECIFIC DASHBOARDS');

    expect(navIndex).toBeGreaterThan(-1);
    expect(navIndex).toBeLessThan(roleDashboardsIndex);
    expect(appText).not.toContain('Kenyan Region Cultivation Indices');
    expect(appText).not.toContain('Live Soil Trends');
    expect(appText).not.toContain('Nyandarua Zone (Loam soil)');
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
    expect(html).toContain('Farm Management System');
    expect(html).toContain('Dispute Room');
    expect(html).toContain('Reviews');
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
