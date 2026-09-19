import { describe, expect, test } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { InvestorBriefDocuments } from '../components/investor/InvestorBriefDocuments';

const criteria = {
  id: 'criteria_test',
  investorId: 'investor_test',
  investorName: 'Investor Test',
  lookingFor: 'FARMER_WITH_LAND_NEEDING_CAPITAL' as const,
  budgetKES: 500000,
  preferredSectors: ['Dairy'],
  targetCounties: ['Nakuru'],
  notes: 'Test brief',
  status: 'ACTIVE' as const,
  createdAt: '2026-01-01T00:00:00.000Z'
};

describe('InvestorBriefDocuments', () => {
  test('asks an investor to save a brief before documents can be attached', () => {
    const html = renderToString(React.createElement(InvestorBriefDocuments, { criteria: null }));
    expect(html).toContain('Supporting documents');
    expect(html).toContain('Save the investment brief first');
    expect(html).not.toContain('investment_brief_document_file');
  });

  test('renders the private supporting-document upload control for a saved brief', () => {
    const html = renderToString(React.createElement(InvestorBriefDocuments, { criteria }));
    expect(html).toContain('investment_brief_document_file');
    expect(html).toContain('Upload supporting document');
    expect(html).toContain('application/pdf');
  });
});
