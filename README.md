# ShambaLoop

ShambaLoop is a TypeScript application for agricultural listings, land leases, livestock partnerships, verification requests, escrow simulations, and administrator-led platform operations.

## Architecture

The application is a single Node.js process. Express serves JSON APIs and, in development, Vite serves the React client. The data layer is a JSON document at `data/db.json`; audit events are append-only JSON lines in `data/audit_log.json`.

The admin dashboard uses the same APIs as the client. Administrative data and mutations are server-authorized; the browser does not determine whether a user is an administrator.

## Stack

- React 19, TypeScript, Vite, Tailwind CSS, Lucide
- Node.js, Express, TypeScript
- JWT access and refresh tokens, bcryptjs, Node crypto AES-256-GCM
- Vitest

## Project layout

```text
src/
  components/       React dashboards and shared UI
  hooks/            Client hooks
  tests/            Component and API integration tests
  utils/            Validation and API error handling
  App.tsx           Application state and API integration
  types.ts          Shared domain models
server.ts           Express API and JSON persistence adapter
data/               Runtime database and audit log (not source code)
public/             Static assets and service worker
```

## Dashboards

Farmer, investor, veterinary, landowner, and administrator dashboards remain separate. The administrator dashboard starts with actionable KYC, listing, and dispute queues, then provides focused user management, match proposals, dispute resolution, and operational metrics. It does not use decorative charts or duplicate statistics.

## Authentication and authorization

Protected APIs require a signed Bearer JWT. Role checks run on the server for all administrator routes. Administrative APIs cover KYC review, user verification, listing moderation, tripartite match proposals, escrow disbursement, dispute resolution, user enumeration, and decision analytics.

Self-service registration cannot create administrator accounts. User responses omit MFA secrets, backup codes, device-trust data, password hashes, access tokens, and refresh tokens. KYC queue results mask document numbers; a protected single-record endpoint is available for an administrator who needs to inspect a submission.

## Environment

Copy `.env.example` to `.env` and configure production secrets before deploying:

```dotenv
JWT_SECRET=replace-with-a-long-random-value
REFRESH_TOKEN_SECRET=replace-with-a-different-long-random-value
DB_ENCRYPTION_KEY=replace-with-a-32-byte-secret
CORS_WHITELIST=https://your-domain.example
NODE_ENV=production
```

The defaults in `server.ts` support local development only. Do not use them in a deployed environment. The process requires write access to `data/` for the current persistence adapter.

## Setup and development

```bash
npm install
npm run dev
```

The development server listens on port 3000. Open `http://localhost:3000`.

## Tests and verification

```bash
npm test
npm run lint
npm run build
```

`npm test` runs Vitest. The integration tests expect the Express server at `http://localhost:3000`; start `npm run dev` in a separate terminal when running them directly. `npm run lint` runs TypeScript type checking. There is no separate formatter or static-analysis script configured in `package.json`.

## Build and deployment

```bash
npm run build
npm start
```

The build emits the Vite client and bundles the server to `dist/server.cjs`. Deploy the resulting process behind HTTPS, set the environment variables above, persist `data/` only for non-production/demo use, and configure health checks against `/api/health`.

## Security architecture

- JWT Bearer authentication and server-side RBAC
- bcrypt password hashes and hashed refresh-token storage
- AES-256-GCM encryption for newly submitted KYC document numbers
- administrative audit events for verification, listing, user, matching, escrow, and dispute actions
- request security headers, CORS allow-listing in production, and authentication rate limiting
- ownership checks for supported non-administrative resources

The JSON store and local audit file are suitable for development and demonstration, not multi-instance production deployment. See [SCALABILITY.md](SCALABILITY.md) for the practical migration path.
