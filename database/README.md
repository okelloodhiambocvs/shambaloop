# PostgreSQL migration path

`migrations/001_transactional_core.sql` is the target schema for the financial,
agreement, verification, and audit domains. It is intentionally not auto-applied
by the JSON-backed development server: production cutover requires a provisioned
PostgreSQL instance, encrypted backups, a migration runner, and a rehearsed data
migration.

The schema enforces per-account idempotency, append-only payment state transitions,
double-entry-shaped ledger rows, agreement lifecycle states, and reviewer-attributed
verification decisions. Do not enable `DATABASE_URL` as a signal of completion
until the repository’s route services are switched to this store in a controlled
release.
