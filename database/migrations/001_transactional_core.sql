-- PostgreSQL transactional core. Apply with a migration runner to a dedicated
-- production database before switching DATABASE_URL on in application code.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE payment_state AS ENUM ('PENDING', 'PROVIDER_ACCEPTED', 'SETTLED', 'FAILED', 'REVERSED', 'CANCELLED');
CREATE TYPE verification_state AS ENUM ('PENDING', 'UNDER_REVIEW', 'MORE_INFO', 'APPROVED', 'REJECTED', 'EXPIRED');

CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'farmer', 'investor', 'veterinarian')),
  phone_e164 text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text UNIQUE NOT NULL,
  agreement_type text NOT NULL CHECK (agreement_type IN ('LAND_LEASE', 'LIVESTOCK_PARTNERSHIP', 'SERVICE')),
  state text NOT NULL CHECK (state IN ('DRAFT', 'PENDING_SIGNATURE', 'ACTIVE', 'SUSPENDED', 'TERMINATED', 'EXPIRED')),
  farmer_account_id uuid REFERENCES accounts(id),
  investor_account_id uuid REFERENCES accounts(id),
  landowner_account_id uuid REFERENCES accounts(id),
  terms jsonb NOT NULL,
  activated_at timestamptz,
  terminated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE payment_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL,
  account_id uuid NOT NULL REFERENCES accounts(id),
  agreement_id uuid REFERENCES agreements(id),
  provider text NOT NULL,
  provider_reference text UNIQUE,
  amount_kes bigint NOT NULL CHECK (amount_kes > 0),
  state payment_state NOT NULL DEFAULT 'PENDING',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, idempotency_key)
);

CREATE TABLE payment_state_transitions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  payment_intent_id uuid NOT NULL REFERENCES payment_intents(id),
  from_state payment_state,
  to_state payment_state NOT NULL,
  source text NOT NULL CHECK (source IN ('CLIENT', 'PROVIDER_QUERY', 'PROVIDER_CALLBACK', 'ADMIN', 'SYSTEM')),
  correlation_id uuid,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_group_id uuid NOT NULL,
  account_id uuid NOT NULL REFERENCES accounts(id),
  direction text NOT NULL CHECK (direction IN ('DEBIT', 'CREDIT')),
  amount_kes bigint NOT NULL CHECK (amount_kes > 0),
  payment_intent_id uuid REFERENCES payment_intents(id),
  agreement_id uuid REFERENCES agreements(id),
  entry_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ledger_entries_account_created_idx ON ledger_entries(account_id, created_at DESC);

CREATE TABLE verification_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id),
  verification_type text NOT NULL CHECK (verification_type IN ('IDENTITY', 'LAND', 'VETERINARY_LICENSE', 'LIVESTOCK')),
  state verification_state NOT NULL DEFAULT 'PENDING',
  provider_reference text,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  reviewer_account_id uuid REFERENCES accounts(id),
  decision_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

CREATE TABLE audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  correlation_id uuid,
  actor_account_id uuid REFERENCES accounts(id),
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  previous_value jsonb,
  next_value jsonb,
  ip inet
);
CREATE INDEX audit_events_entity_idx ON audit_events(entity_type, entity_id, occurred_at DESC);
