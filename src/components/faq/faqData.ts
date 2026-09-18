export interface FaqItem {
  id: string;
  category: 'all' | 'farmers' | 'investors' | 'vets' | 'escrow' | 'legal';
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'gen_1',
    category: 'all',
    question: 'What is ShambaLoop and how does it protect participants?',
    answer: 'ShambaLoop is Kenya’s regulated agricultural asset-sharing cooperative. It connects landowners, capital investors, and certified veterinarians into legally binding tripartite agreements. All payments and yields flow through automated M-Pesa Milestone Escrow to guarantee transparency.'
  },
  {
    id: 'farmer_1',
    category: 'farmers',
    question: 'How do smallholder farmers get funded without taking a loan?',
    answer: 'ShambaLoop is not a predatory moneylender. Farmers contribute arable land, water access, and agricultural management, while verified capital partners provide operational funding. Returns are shared based on agreed percentages from the harvest or milk yield.'
  },
  {
    id: 'farmer_2',
    category: 'farmers',
    question: 'What documents do I need to upload to get verified as a farmer?',
    answer: 'You can upload your National ID, Chief’s verification letter, Title Deed or registered lease agreement, and any livestock registration tags or soil test reports in the Farm Management System.'
  },
  {
    id: 'farmer_3',
    category: 'farmers',
    question: 'When do I receive milestone disbursements for farm inputs?',
    answer: 'Milestones are unlocked after you submit physical documentation (e.g. feed receipts, planting photos) or upon clinical veterinary inspection signoff. Funds transfer instantly to your linked M-Pesa.'
  },
  {
    id: 'investor_1',
    category: 'investors',
    question: 'How do I know my investment is physically real and not a scam?',
    answer: 'Every listing on ShambaLoop is GPS-mapped, verified with land registry title searches, and inspected on-site by certified KVB veterinarians. Investors can monitor weekly telemetry logs, photo evidence, and yield disbursements in real time.'
  },
  {
    id: 'investor_2',
    category: 'investors',
    question: 'Can I upload custom investment briefs or requirements?',
    answer: 'Yes. In your Investor Dashboard, you can create investment criteria briefs and upload supporting documents, such as target enterprise requirements or verification proofs.'
  },
  {
    id: 'investor_3',
    category: 'investors',
    question: 'How are returns and profits paid back to investors?',
    answer: 'Revenue generated from milk deliveries, crop harvests, or lease fees is recorded directly into the farm ledger and disbursed automatically to your Safaricom M-Pesa or bank account according to your tripartite agreement.'
  },
  {
    id: 'vet_1',
    category: 'vets',
    question: 'Who can register as a veterinarian on ShambaLoop?',
    answer: 'Only practitioners registered and licensed by the Kenya Veterinary Board (KVB). You will be required to submit your KVB license certificate and National ID during registration.'
  },
  {
    id: 'vet_2',
    category: 'vets',
    question: 'How do veterinarians get assigned and paid for clinical visits?',
    answer: 'Farmers and investors can dispatch job requests for health audits, vaccinations, or artificial insemination. Once you perform the audit, file the clinical report, and upload evidence, your consultation fee is disbursed immediately from escrow.'
  },
  {
    id: 'escrow_1',
    category: 'escrow',
    question: 'How does Safaricom Daraja M-Pesa Escrow safeguard funds?',
    answer: 'When capital is deposited, it remains in a ring-fenced escrow account. The farmer cannot withdraw lump sums arbitrarily, and the investor cannot pull back committed funds mid-cycle without mutual consent.'
  },
  {
    id: 'escrow_2',
    category: 'escrow',
    question: 'What happens if a dispute occurs or an animal falls ill?',
    answer: 'Any participant can open an immutable Dispute Room in their workspace, upload supporting photos or documentary evidence, and request arbitration. Escrow releases are held until the dispute is resolved.'
  },
  {
    id: 'legal_1',
    category: 'legal',
    question: 'Is ShambaLoop compliant with Kenyan agricultural and data laws?',
    answer: 'Yes. All digital contracts comply with the Kenya Law of Contract Act (Cap 23), Co-operative Societies Act (Cap 490), and personal data is handled in strict compliance with the Office of the Data Protection Commissioner (ODPC) Act 2019.'
  }
];
