import { describe, test, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';

import { HowItWorksModalContent } from '../content/howItWorksContent';
import { FAQModalContent } from '../content/faqContent';
import { TermsModalContent } from '../content/termsContent';
import { PrivacyModalContent } from '../content/privacyContent';
import { CookieModalContent } from '../content/cookieContent';

describe('Expanded Legal & Informational Content Components', () => {
  test('renders HowItWorksModalContent with Farmer, Investor, Vet, and Tripartite guidance', () => {
    const html = renderToString(<HowItWorksModalContent />);
    expect(html).toContain('How ShambaLoop Works');
    expect(html).toContain('For Farmers');
    expect(html).toContain('For Investors');
    expect(html).toContain('For Veterinarians');
    expect(html).toContain('Legal Tripartite Structure');
  });

  test('renders FAQModalContent with comprehensive cooperative Q&A', () => {
    const html = renderToString(<FAQModalContent />);
    expect(html).toContain('Frequently Asked Questions (FAQ)');
    expect(html).toContain('What is ShambaLoop and how does it empower the agricultural sector in Kenya');
    expect(html).toContain('How does Safaricom M-Pesa escrow protect investor capital');
    expect(html).toContain('What are the qualifications required for veterinarians on ShambaLoop');
  });

  test('renders TermsModalContent with statutory Cap 490 and Land Act compliance', () => {
    const html = renderToString(<TermsModalContent />);
    expect(html).toContain('Terms');
    expect(html).toContain('Conditions of Service');
    expect(html).toContain('Cooperative Societies Act (Cap 490, Laws of Kenya)');
    expect(html).toContain('Section 12 of the Kenya Land Act');
    expect(html).toContain('Escrow Isolation');
  });

  test('renders PrivacyModalContent with ODPC certification and user data rights', () => {
    const html = renderToString(<PrivacyModalContent />);
    expect(html).toContain('Privacy Policy');
    expect(html).toContain('Data Protection Charter');
    expect(html).toContain('Kenya Data Protection Act of 2019');
    expect(html).toContain('Data Protection Officer (DPO)');
  });

  test('renders CookieModalContent with consent and categorization details', () => {
    const html = renderToString(<CookieModalContent />);
    expect(html).toContain('Cookie');
    expect(html).toContain('Local Storage Policy');
    expect(html).toContain('Strictly Necessary');
    expect(html).toContain('Preference');
  });
});
