# ShambaLoop Kenya

An enterprise agricultural trust, cooperative asset-sharing, and fintech digitization platform connecting Kenyan smallholders, diaspora investors, and fertile arable land under legally binding Section 12 lease protections, Kenya Veterinary Board (KVB) clinical governance, and Safaricom Daraja M-Pesa automated escrow.

---

## Technology Stack

| Layer | Technologies & Libraries | Specification / Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React, TypeScript, Vite | React 19 / TypeScript 5.8 / Vite 6 | High-performance modular reactive UI SPA |
| **Styling & Design System** | Tailwind CSS v4 | `@tailwindcss/vite` | Accessible, responsive typography and layout |
| **Motion & Data Viz** | Motion (`motion/react`), Recharts, Lucide | `motion` 12, Recharts 3.8, `lucide-react` | Smooth view transitions, production charts & icons |
| **Backend Runtime** | Node.js 22, Express 4, TypeScript | `tsx`, `esbuild` | Type-safe REST API server & middleware proxy |
| **Data & Ledger Store** | JSON Document DB, Cryptographic Audit | File-backed atomic writes | Append-only financial ledger with HMAC auditing |
| **Authentication & RBAC** | JWT (access/refresh), Bcrypt, OTP MFA | PBKDF2/Bcrypt, TOTP RFC 6238 | Role-based access control (Farmer, Vet, Investor, Admin) |
| **Mobile Money Escrow** | Safaricom Daraja API | REST Daraja v2 STK Push | Milestone escrow, query status, automated yield splits |
| **Quality & Test Pipeline**| Vitest, TypeScript Compiler (`tsc --noEmit`) | Vitest 4.1, `oxc` | Automated unit, SSR, integration, and security tests |

---

## Architecture & Module Directory

| Layer / Domain | Module Paths | Primary Responsibilities | Protocols & Standards |
| :--- | :--- | :--- | :--- |
| **Public Information Hub** | `src/components/about/` | Problem definition, statutory approach, solution pillars, regional hubs | Responsive grid, Nyumbani Greens style |
| **Process Flow Pathways** | `src/components/howItWorks/` | Farmer, Investor, and Veterinarian journey maps; Escrow architecture | Stepwise walkthrough, verified imagery |
| **Knowledge Base** | `src/components/faq/` | Filterable FAQ categories (Farmers, Investors, Vets, Escrow, Legal) | Dynamic search, accessible accordions |
| **Unified Navigation & Footer** | `src/components/about/AboutNavbar.tsx`, `AboutFooter.tsx` | Consistent brand identity, regional hub contacts (+254 728 606 684) | Standardized responsive footers |
| **Farmer Dashboard & FMS** | `src/components/FarmerDashboard.tsx`, `workspace/FmsTab.tsx` | Daily milk & crop logging, document & image uploads, milestone claims | Mobile-friendly telemetry capture |
| **Veterinary Workspace** | `src/components/VeterinaryDashboard.tsx`, `workspace/VetReportForm.tsx` | Clinical audits, health reports, photo/doc uploads, KVB accreditation | KVB Cap 366 veterinary compliance |
| **Investor Portal** | `src/components/InvestorDashboard.tsx`, `workspace/WalletTab.tsx` | Livestock asset funding, wallet deposits/withdrawals, yield stream tracking | Safaricom Daraja STK Escrow |
| **Dispute & Mediation Room**| `src/components/workspace/DisputesTab.tsx` | Tripartite dispute resolution, evidence doc uploader, status ledger | Kenya Cap 23 arbitration framework |
| **Marketplace & Listings** | `src/components/CreateListingModal.tsx` | Farm acreage & livestock listings with document & photo proof | Land Act Section 12 title verification |
| **Cryptographic Security** | `server/cryptoUtils.ts`, `server/audit.ts` | Tamper-evident hash chaining, recovery codes, credential hashing | HMAC-SHA256, session revocation |
| **Document Storage Service**| `server/authExtensionService.ts`, `server/fileUpload.ts` | Multi-role KYC, title deeds, clinical evidence uploader | Encrypted sandboxing, ODPC Act 2019 |

---

## Repository Tree

```
.
├── public/                                # Static web assets & authentic photography
│   ├── images/                            # Verified Kenyan farmers, calves, and herds
│   │   ├── african_farmer_portrait_*.jpg
│   │   ├── pedigree_cow_livestock_*.jpg
│   │   ├── dairy_calf_baby_*.jpg
│   │   └── kenyan_fertile_shamba_*.jpg
│   └── sw.js                              # Service worker for offline asset caching
├── src/
│   ├── components/
│   │   ├── about/                         # About Us presentation suite
│   │   │   ├── AboutPage.tsx              # Container with unified navbar and footer
│   │   │   ├── AboutHero.tsx              # Karibu ShambaLoop narrative
│   │   │   ├── AboutProblem.tsx           # Arable land, capital, health, escrow cards
│   │   │   ├── AboutApproach.tsx          # Section 12 & KVB statutory approach
│   │   │   ├── AboutSolution.tsx          # 3 numbered solution pillars
│   │   │   ├── AboutNavbar.tsx            # Header navigation & portal triggers
│   │   │   ├── AboutFooter.tsx            # Shared contact desk and policy links
│   │   │   └── types.ts                   # Component interface contracts
│   │   ├── howItWorks/                    # Step-by-step pathway guides
│   │   │   ├── HowItWorksPage.tsx         # Unified container with navbar and footer
│   │   │   ├── HowItWorksHero.tsx         # Interactive pathway entry hero
│   │   │   ├── FarmerWorkflow.tsx         # Land registration, proposal, escrow unlock
│   │   │   ├── InvestorWorkflow.tsx       # Vetted herds, milestone drawdown, returns
│   │   │   ├── VetWorkflow.tsx            # KVB certification, clinical audits, sign-off
│   │   │   └── WorkflowEscrowSection.tsx  # Multi-party escrow & dispute mediation
│   │   ├── faq/                           # Frequently Asked Questions module
│   │   │   ├── FaqPage.tsx                # Master container with unified footer
│   │   │   ├── FaqHero.tsx                # Searchable inquiry header
│   │   │   ├── FaqCategoryFilter.tsx      # Category buttons (Farmers, Investors, Vets, etc.)
│   │   │   ├── FaqAccordion.tsx           # Accessible accordion disclosure list
│   │   │   └── faqData.ts                 # Verified question and answer repository
│   │   ├── workspace/                     # Shared role components
│   │   │   ├── FmsTab.tsx                 # Farm records with document/image uploads
│   │   │   ├── DisputesTab.tsx            # Dispute room with evidence file uploads
│   │   │   ├── VetReportForm.tsx          # Clinical report submission with document uploads
│   │   │   ├── WalletTab.tsx              # Financial wallet & M-Pesa deposit/payout
│   │   │   └── WalletTransactionsTable.tsx# Modular transaction history table
│   │   ├── CreateListingModal.tsx         # Listing creator with file upload attachments
│   │   ├── FarmerDashboard.tsx            # Smallholder management workspace
│   │   ├── InvestorDashboard.tsx          # Livestock & farmland capital portal
│   │   ├── VeterinaryDashboard.tsx        # Clinical inspection workspace
│   │   ├── AdminPanel.tsx                 # KYC, land title, and dispute validation desk
│   │   └── LandingPage.tsx                # Public marketplace feed & entry point
│   ├── tests/                             # Vitest verification suites
│   │   ├── about.test.tsx                 # About Us page and footer assertions
│   │   ├── workflow_pages.test.tsx        # How It Works & FAQ page assertions
│   │   ├── component.test.tsx             # Workspace and chart rendering tests
│   │   ├── integration.test.ts            # API routes and authentication tests
│   │   ├── reviews_wallet_fms.test.ts     # FMS telemetry, wallet, and review tests
│   │   ├── daraja.test.ts                 # M-Pesa STK push simulation tests
│   │   ├── securityFlows.test.ts          # MFA, recovery codes, and session revocation
│   │   ├── walletBalance.test.ts          # Escrow ledger math tests
│   │   └── content.test.tsx               # Static copy and legal content tests
│   ├── types.ts                           # Global TypeScript types and enums
│   └── App.tsx                            # Root application component & routing
├── server/                                # Express backend domain services
│   ├── audit.ts                           # Cryptographic HMAC audit log
│   ├── authExtensionService.ts            # MFA, KYC, and document storage
│   ├── cryptoUtils.ts                     # Password hashing & key derivation
│   ├── developmentSeedAccounts.ts         # Development/test-only role credentials
│   ├── daraja.ts                          # Safaricom M-Pesa gateway
│   ├── disputesService.ts                 # Dispute room ledger
│   ├── farmRecordsService.ts              # Daily farm telemetry
│   └── reviews_wallet_fms.ts              # Reviews, wallet transactions, FMS records
├── data/
│   ├── db.json                            # Primary persistent document database
│   └── audit_log.json                     # Cryptographic append-only audit ledger
├── package.json                           # NPM dependencies and scripts
└── server.ts                              # Production server entry point
```

---

## Quality Gates & Verification

Every code modification must pass all automated verification checks:

```sh
# 1. Run all test suites (Vitest)
npm test

# 2. Strict TypeScript type-checking
npm run lint

# 3. Security vulnerability audit
npm audit

# 4. Production application bundle build
npm run build

# 5. Full check (lint, test, build, audit)
npm run check
```

---

## Local Development Setup

Ensure **Node.js 22+** is installed.

```sh
# 1. Clone and install dependencies
git clone https://github.com/okelloodhiambocvs/shambaloop.git
cd shambaloop
npm ci

# 2. Configure environment variables
cp .env.example .env

# 3. Launch development server on http://localhost:3000
npm run dev
```

### Administrative Account Bootstrap

```sh
ADMIN_NAME="System Administrator" \
ADMIN_PHONE="254712345678" \
ADMIN_PASSWORD="YourStrongPassword123!" \
npm run admin:create
```

### Development Seed Accounts

`npm run dev` creates or refreshes these accounts only when the server is not
running with `NODE_ENV=production`. They are intended for local development and
test data; never deploy these credentials or their underlying fixture records.
Set `ENABLE_DEV_SEED_ACCOUNTS=false` to disable them locally.

| Role | Mobile number | Password |
| --- | --- | --- |
| Administrator | `0700000000` | `ShambaLoopAdmin#2026` |
| Investor | `0733444555` | `ShambaLoopInvestor#2026` |
| Farmer | `0722111222` | `ShambaLoopFarmer#2026` |
| Veterinarian | `0744555666` | `ShambaLoopVet#2026` |

### Production operations

Run `npm run backup:data` on a scheduled, encrypted backup target. The command
copies `DATA_DIR` to `BACKUP_DIR` (or `./backups`) and exits non-zero on failure.
The GitHub Actions workflow verifies linting, tests, production builds, and the
smoke check on both Windows and Linux. `DATABASE_URL` is reserved for the
PostgreSQL migration; do not set it in production until the database rollout is
complete.

---

## Regulatory & Legal Compliance

- **Section 12 Kenya Land Act:** Standardized lease covenants guaranteeing tenure security for leased arable acreage.
- **Kenya Veterinary Board (KVB) Cap 366:** Mandatory clinical audits before livestock partnerships can be listed or financed.
- **Kenya Office of the Data Protection Commissioner (ODPC) Act 2019:** Private identity evidence (National ID, Chief's letters) stored encrypted and restricted to owner and registry officers.
- **Safaricom Daraja API v2:** Escrow milestone releases requiring verified biometric or PIN confirmation on subscriber handsets.
- **Kenya Law of Contract Act (Cap 23):** Legally binding tripartite digital contracts between farmers, investors, and veterinarians.
