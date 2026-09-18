import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import AboutPage from '../components/about/AboutPage';
import { AboutHero } from '../components/about/AboutHero';
import { AboutProblem } from '../components/about/AboutProblem';
import { AboutApproach } from '../components/about/AboutApproach';
import { AboutSolution } from '../components/about/AboutSolution';
import { AboutNavbar } from '../components/about/AboutNavbar';
import { AboutFooter } from '../components/about/AboutFooter';

describe('About Us Page (Nyumbani Greens Style)', () => {
  test('renders full AboutPage with all sections and images', () => {
    const html = renderToString(
      React.createElement(AboutPage, {
        onBack: () => {},
        onLoginClick: () => {},
        onOpenDoc: () => {},
        isDarkMode: false,
        toggleTheme: () => {},
      })
    );

    // Verify main page wrapper
    expect(html).toContain('shambaloop_about_page');

    // Verify Hero
    expect(html).toContain('Karibu ShambaLoop');
    expect(html).toContain('Explore Marketplace');

    // Verify The Problem section
    expect(html).toContain('The Problem');
    expect(html).toContain('IDLE ARABLE LAND');
    expect(html).toContain('CAPITAL BARRIERS');
    expect(html).toContain('HERD HEALTH RISKS');
    expect(html).toContain('TRUST &amp; ESCROW DEFICIT');

    // Verify Our Approach section
    expect(html).toContain('Our Approach');
    expect(html).toContain('Section 12 of the Kenya Land Act');
    expect(html).toContain('Kenya Veterinary Board');

    // Verify Our Solution section with 3 numbered steps
    expect(html).toContain('Our Solution');
    expect(html).toContain('Verified Land &amp; Livestock Marketplace');
    expect(html).toContain('KVB Veterinary Audits &amp; Milestone Escrow');
    expect(html).toContain('Daily Telemetry &amp; Automated M-Pesa Splits');

    // Verify imagery of farms, livestock, calves
    expect(html).toContain('/images/kenyan_fertile_shamba_1789547934588.jpg');
    expect(html).toContain('/images/pedigree_cow_livestock_1789547947480.jpg');
    expect(html).toContain('/images/dairy_calf_baby_1789547904840.jpg');
    expect(html).toContain('/images/baby_lamb_pasture_1789547988863.jpg');
  });

  test('renders AboutNavbar with back button and brand logo', () => {
    const html = renderToString(
      React.createElement(AboutNavbar, {
        onBack: () => {},
        onLoginClick: () => {},
        onOpenDoc: () => {},
        isDarkMode: false,
        toggleTheme: () => {},
      })
    );

    expect(html).toContain('Back to Marketplace');
    expect(html).toContain('Access Portal');
  });

  test('renders AboutFooter with contact details and regional agricultural hubs', () => {
    const html = renderToString(
      React.createElement(AboutFooter, {
        onBack: () => {},
        onOpenDoc: () => {},
        isDarkMode: false,
      })
    );

    expect(html).toContain('+254 728 606 684');
    expect(html).toContain('info@shambaloop.com');
    expect(html).toContain('Milimani Innovation Hub, Kisumu');
    expect(html).toContain('Nyandarua');
    expect(html).toContain('Nakuru');
    expect(html).toContain('Kiambu');
  });
});
