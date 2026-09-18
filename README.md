# ShambaLoop

React/TypeScript dashboards for farmers, investors, veterinarians, and administrators, served by an Express API. Normal startup contains no demo profiles, proposals, listings, balances, or credentials. Integration fixtures are restricted to `NODE_ENV=test` and a temporary database.

## Local use

Use Node.js 22 or newer.

```sh
npm ci
cp .env.example .env
npm run dev
```

Open http://localhost:3000. Register a participant through the login modal. Farmers and veterinarians must provide a passport photo, both ID sides, certification, and a chief's letter (JPEG/PNG/PDF, up to 2 MB each). Identity evidence is private and downloadable by its owner or an administrator; administrators review it in the KYC panel. Accept both policies and confirm the password.

To create the first administrator, stop the application, set `ADMIN_NAME`, `ADMIN_PHONE`, and `ADMIN_PASSWORD` in your environment, and run `npm run admin:create`. No default administrator password exists. Use a password of at least 12 characters including uppercase, lowercase, digits, and a symbol.

## Checks 

```sh
npm test
npm run lint
npm audit
npm run build
npm start
```

`npm run lint` is the project's TypeScript check (`tsc --noEmit`). Tests start their own server on an available port, isolate database/uploads in a temporary directory, and stop the server afterward. Network/socket permissions are required. `npm run check` runs all four checks. `npm start` serves the compiled app; set `NODE_ENV=production` for static production serving and required-secret validation.

## Configuration and payments

Generate independent secrets of at least 32 characters for `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, and `DB_ENCRYPTION_KEY`; production refuses to boot without them.

Password recovery requires an HTTPS SMS adapter in `RECOVERY_WEBHOOK_URL` and its bearer secret in `RECOVERY_WEBHOOK_SECRET`. The server POSTs `{phone, token, expiresInMinutes}`. The adapter must deliver the code to the registered number. Codes expire after 15 minutes, are stored hashed, and can be used once. Resetting revokes prior sessions. Without a delivery adapter, recovery returns an explicit unavailable response.

Configure the `DARAJA_*` values in `.env.example` using your [Safaricom Daraja application](https://developer.safaricom.co.ke/). Keep sandbox and production credentials separate. The callback URL must be publicly reachable over HTTPS. The API requests an STK prompt and queries Daraja to confirm settlement; an incoming callback alone never credits an account. Users enter their PIN only on their handset. Saving an M-Pesa number does not mark it verified; a confirmed payment for that number does. Use Refresh status in the wallet or Check payment in checkout.

Live Daraja and SMS delivery require operator credentials and provider acceptance testing; automated tests do not establish live service availability. Payouts are reserved pending requests, **not completed B2C transfers**. A B2C processing/reconciliation worker remains to be implemented before automated withdrawals can be enabled. Email verification is unavailable until a delivery/verification provider is implemented.

## Docker

```sh
docker compose up --build -d
```

Compose reads `.env`. The multistage image runs as the unprivileged `node` user, excludes runtime data/secrets from the build context, and persists `/app/data` in a named volume. Health checks use `/api/health`. Set TLS at your reverse proxy. Docker build verification requires access to a running Docker daemon.

## Architecture and persistence

- `src/components`: dashboard and shared interaction components.
- `src/services`: browser API clients.
- `server/*Service.ts`: authorization and domain routes.
- `server/registrationDocuments.ts`: identity file validation and private storage.
- `server/passwordRecovery.ts`: delivery adapter and single-use recovery.
- `server/daraja.ts`, `marketplacePayments.ts`: provider integration and payment status.
- `server/walletBalance.ts`: common available-balance and reservation rules.
- `server/migrations.ts`: ordered JSON schema migrations.
- `server.ts`: application composition, existing routes, and persistence.

`DATA_DIR` contains `db.json`, private uploads, and an append-only audit log. Database replacement is atomic; malformed databases cause startup to stop rather than silently reseed. Back up this directory. This is a **single-process JSON store**, not a scalable transactional database: run one writer and stop it before administrative CLI changes. Multiple replicas and durable financial processing require migration to a transactional database and payment job queue. See `SCALABILITY.md` for the broader migration plan.

The service worker caches static images/assets only, never authenticated API responses. Large image duplicates were removed; shared chart, animation, and React dependencies build as separate chunks.
