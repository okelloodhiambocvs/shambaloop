import { describe, test, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { HowItWorksPage } from '../components/howItWorks/HowItWorksPage';
import { FaqPage } from '../components/faq/FaqPage';

describe('How It Works & FAQ Flow Pages', () => {
  test('renders full HowItWorksPage with farmer, investor, vet, and escrow workflows', () => {
    const html = renderToString(
      React.createElement(HowItWorksPage, {
        onBack: () => {},
        onLoginClick: () => {},
        onOpenDoc: () => {},
        isDarkMode: false,
        toggleTheme: () => {},
      })
    );

    // Verify main sections
    expect(html).toContain('How ShambaLoop Works: A Transparent Flow for Every Participant');
    expect(html).toContain('Farmer Pathway');
    expect(html).toContain('Investor Safeguards');
    expect(html).toContain('Clinical Oversight');
    expect(html).toContain('How The Three Roles Unite Under Protected Escrow');
    expect(html).not.toContain('Kenya’s Agricultural Collaboration Framework');
    expect(html).not.toContain('Escrow &amp; Digital Governance Architecture');

    // Verify workflow details
    expect(html).toContain('Register &amp; Upload Land or Farm Documentation');
    expect(html).toContain('Back Kenyan Agriculture with Clinical Escrow Governance');
    expect(html).toContain('Monetize Clinical Expertise &amp; Safeguard Regional Herd Health');

    // Verify imagery
    expect(html).toContain('/images/african_farmer_portrait_1789549028340.jpg');
    expect(html).toContain('pedigree_cow_livestock_1789547947480.jpg');
    expect(html).toContain('/images/dairy_calf_baby_1789547904840.jpg');

    // Verify unified footer
    expect(html).toContain('+254 728 606 684');
    expect(html).toContain('info@shambaloop.com');
    expect(html).toContain('Milimani Innovation Hub, Kisumu');
  });

  test('renders full FaqPage with categories and accordion items', () => {
    const html = renderToString(
      React.createElement(FaqPage, {
        onBack: () => {},
        onLoginClick: () => {},
        onOpenDoc: () => {},
        isDarkMode: false,
        toggleTheme: () => {},
      })
    );

    // Verify FaqHero & Search
    expect(html).toContain('Frequently Asked Questions');
    expect(html).toContain('Clear answers about land lease verification');
    expect(html).not.toContain('Knowledge Base &amp; Common Inquiries');

    // Verify categories
    expect(html).toContain('All Questions');
    expect(html).toContain('For Farmers');
    expect(html).toContain('For Investors');
    expect(html).toContain('Veterinarians');
    expect(html).toContain('M-Pesa Escrow');
    expect(html).toContain('Legal &amp; ODPC');

    // Verify questions
    expect(html).toContain('What is ShambaLoop and how does it protect participants?');
    expect(html).toContain('How do smallholder farmers get funded without taking a loan?');
    expect(html).toContain('How do I know my investment is physically real and not a scam?');
    expect(html).toContain('Who can register as a veterinarian on ShambaLoop?');
    expect(html).toContain('How does Safaricom Daraja M-Pesa Escrow safeguard funds?');

    // Verify unified footer
    expect(html).toContain('+254 728 606 684');
    expect(html).toContain('info@shambaloop.com');
  });
});
