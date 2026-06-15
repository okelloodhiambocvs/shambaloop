# ShambaLoop | Ecosystem Trust Marketplace

Kenya's trusted agricultural asset-sharing marketplace matches verified land lease options, livestock partnerships, and crop opportunities.

**Kenya's Agricultural Trust Marketplace for Land, Livestock, Investment, and Farm Partnerships**

ShambaLoop connects landowners, farmers, investors, and agricultural professionals through a trusted digital marketplace designed to unlock underutilized agricultural assets and create sustainable farming opportunities across Kenya.

The platform enables secure land leasing, livestock investment partnerships, agricultural opportunity discovery, escrow-backed transactions, verification workflows, audit logging, and role-based access control within a single ecosystem.

---

# Live Demo

**Production URL**

https://shambaloop.onrender.com

---

# What ShambaLoop Solves

Across Kenya, thousands of acres of productive land remain idle while many skilled farmers lack access to land, financing, livestock, and investment opportunities.

ShambaLoop bridges this gap by creating a trusted marketplace where:

* Landowners can lease land securely.
* Farmers can access productive acreage.
* Investors can participate in livestock and agricultural ventures.
* Agricultural professionals can discover verified opportunities.
* Transactions can be protected through escrow-style workflows.
* Disputes can be managed transparently.
* Platform administrators can monitor activity through audit trails and analytics.

---

# Core Features

## Land Marketplace

* Verified land listings
* Acreage information
* Soil profile information
* Water source details
* County-based discovery
* Crop suitability recommendations

## Livestock Partnerships

* Dairy partnerships
* Livestock investment opportunities
* Revenue-sharing structures
* Production monitoring
* Health log tracking

## Agricultural Opportunities

* Contract farming opportunities
* Poultry management partnerships
* Crop production collaborations
* Profit-sharing arrangements

## Authentication & Access Control

* JWT authentication
* Refresh token management
* Multi-Factor Authentication (MFA)
* Role-Based Access Control (RBAC)
* Administrative authorization controls

## Security Features

* Password hashing using bcrypt
* Refresh token protection
* AES-256-GCM field encryption
* Audit logging
* Request validation
* Fraud detection controls
* Security headers
* Transaction verification workflows

## Escrow & Transaction Management

* Escrow payment workflows
* Transaction reconciliation
* Dispute management
* Administrative resolution workflows
* M-Pesa integration architecture

## Platform Monitoring

* Audit trails
* Health monitoring
* Administrative analytics
* Operational metrics
* Transaction reporting

---

# User Roles

## Administrator

Platform governance, verification approvals, dispute resolution, and analytics.

**Demo Login**

Phone Number:

```text
0700000000
```

---

## Farmer

Browse opportunities, lease land, manage agricultural partnerships, and participate in livestock programs.

**Demo Login**

Phone Number:

```text
0722111222
```

---

## Landowner

List agricultural land, manage agreements, and collaborate with farmers.

**Demo Login**

Phone Number:

```text
0712345678
```

---

## Investor

Discover livestock and agricultural investment opportunities.

**Demo Login**

Phone Number:

```text
0733444555
```

---

# Technology Stack

## Frontend

* React 19
* TypeScript
* Vite
* Recharts
* Tailwind CSS
* Lucide React

## Backend

* Node.js
* Express
* TypeScript

## Security

* JWT
* bcryptjs
* AES-256-GCM Encryption

## Data Layer

Current MVP implementation:

```text
data/db.json
```

Future production target:

```text
PostgreSQL
```

---

# Project Structure

```text
ShambaLoop
│
├── assets/
│
├── backend-go/
│   ├── cmd/
│   ├── internal/
│   │   ├── handlers/
│   │   └── models/
│   ├── schema.sql
│   └── DEPLOY.md
│
├── data/
│   └── db.json
│
├── public/
│   └── sw.js
│
├── src/
│   ├── components/
│   ├── hooks/
│   ├── tests/
│   ├── utils/
│   ├── App.tsx
│   ├── main.tsx
│   └── types.ts
│
├── server.ts
├── test-endpoints.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

# Local Development

## Clone Repository

```bash
git clone https://github.com/okelloodhiambocvs/shambaloop.git
cd shambaloop
```

---

## Install Dependencies

```bash
npm install
```

---

## Start Development Server

```bash
npm run dev
```

Expected Output:

```text
ShambaLoop Express Server running on port 3000
```

Application:

```text
http://localhost:3000
```

---

# Production Build

Build the frontend and backend bundle:

```bash
npm run build
```

Expected Output:

```text
✓ built successfully
dist/server.cjs generated
```

---

## Start Production Server

```bash
npm start
```

Expected Output:

```text
ShambaLoop Express Server running on port 3000
```

---

# Terminal-Based Validation Tests

## Verify Application Loads

```bash
curl http://localhost:3000
```

Expected:

```text
HTTP 200 OK
```

---

## Verify Health Endpoint

```bash
curl http://localhost:3000/api/health
```

Expected:

```json
{
  "status": "healthy"
}
```

---

## Verify Listings Endpoint

```bash
curl http://localhost:3000/api/listings
```

Expected:

```json
[
  {
    "id": "list_1"
  }
]
```

---

## Verify Analytics Endpoint

```bash
curl http://localhost:3000/api/admin/analytics
```

Expected:

```json
{
  "activeListings": 4
}
```

---

## Verify TypeScript Compilation

```bash
npm run lint
```

Expected:

```text
No TypeScript errors
```

---

## Verify Automated Tests

```bash
npm test
```

---

## Watch Test Mode

```bash
npm run test:watch
```

---

## Verify Build Pipeline

```bash
npm install
npm run build
npm start
```

All commands should complete successfully.

---

# Deployment

## Current Hosting

**Frontend + Backend**

Hosted on Render

Production URL:

https://shambaloop.onrender.com

---

## Deployment Workflow

Every push to the main branch triggers:

1. Repository sync from GitHub
2. Dependency installation
3. Production build
4. Deployment rollout
5. Health verification

---

# Security Controls

Implemented controls include:

* Role-Based Access Control (RBAC)
* Multi-Factor Authentication (MFA)
* Audit Logging
* Refresh Token Protection
* Security Headers
* AES-256-GCM Encryption
* Transaction Reconciliation
* Fraud Detection Logic
* Escrow Workflow Controls
* Administrative Approval Flows

---

# Health Monitoring

Production health endpoint:

```text
https://shambaloop.onrender.com/api/health
```

Useful for uptime checks and operational monitoring.

---

# Future Roadmap

* PostgreSQL Migration
* Grafana Dashboards
* OpenAPI Documentation
* CI/CD Security Scanning
* Automated Backups
* Mobile Application
* Real M-Pesa Production Integration
* SMS Notification Engine
* Advanced Fraud Analytics

---

# License

This project is developed as an MVP and demonstration platform for modern agricultural asset sharing and trust-based farming partnerships in Kenya.

---

Built with a deep appreciation for Kenyan agriculture, entrepreneurship, and digital trust.
