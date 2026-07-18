# Phase 4 — Database Design

PostgreSQL 16. Money = `NUMERIC(18,2)`, rates/percentages = `NUMERIC(9,6)`,
ids = `UUID` (default `gen_random_uuid()`), all timestamps `timestamptz`.
Every ops table carries `created_at`, `created_by`, `updated_at`, `updated_by`.

## 1. ERD (logical)

```
users ──< user_modules                    cedants ──< underwriting_contracts
users ──< audit_log                                          │ converts to
                                                             ▼
retrocessionaires ──< retro_placements >── retro_layers >── retro_programmes
                                                             │ covers (LOB+period)
premium_bookings >── treaties ──────────────────────────────┘
claims >── treaties          claims ──< claim_payments
claims ──< retro_recoveries >── retro_programmes
external_experience          pricing_records >── cedants
accounts ──< journal_lines >── journals          fx_rates
bank_accounts ──< bank_transactions              investments
periods (close)              assumptions (actuarial/ifrs/pricing, versioned)
report_archive               documents           notifications
```

## 2–4. Schema, Tables, Relationships

### identity schema
```sql
CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username      citext UNIQUE NOT NULL,
  display_name  text NOT NULL,
  role          text NOT NULL,                -- template name, informational
  password_hash text NOT NULL,                -- argon2id
  active        boolean NOT NULL DEFAULT true,
  must_change_password boolean NOT NULL DEFAULT false,
  totp_secret   text,
  failed_logins int NOT NULL DEFAULT 0,
  locked_until  timestamptz,
  last_login    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_modules (                    -- feature-based access grants
  user_id    uuid REFERENCES users(id) ON DELETE CASCADE,
  module_id  text NOT NULL,                    -- 'underwriting' | 'claims' | ...
  granted_by uuid REFERENCES users(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, module_id)
);

CREATE TABLE refresh_tokens (
  id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id),
  token_hash text NOT NULL, expires_at timestamptz NOT NULL,
  rotated_from uuid, revoked boolean NOT NULL DEFAULT false
);
```

### ops schema (business core; representative DDL)
```sql
CREATE TABLE cedants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, country text, broker text,
  UNIQUE (name)
);

CREATE TABLE treaties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number text UNIQUE NOT NULL,
  cedant_id uuid NOT NULL REFERENCES cedants(id),
  treaty_type text NOT NULL,                   -- 'Quota Share'|'Surplus'|'XOL'|...
  line_of_business text NOT NULL,
  inception date NOT NULL, expiry date NOT NULL,
  currency char(3) NOT NULL DEFAULT 'USD',
  premium numeric(18,2) NOT NULL,
  retention numeric(18,2), limit_amount numeric(18,2),
  commission_pct numeric(9,6), retro_pct numeric(9,6) DEFAULT 0,
  status text NOT NULL DEFAULT 'Active',
  terms jsonb NOT NULL DEFAULT '{}',           -- type-specific extras
  CHECK (expiry > inception)
);

CREATE TABLE claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_ref text UNIQUE NOT NULL,
  treaty_id uuid NOT NULL REFERENCES treaties(id),
  date_of_loss date NOT NULL,
  reported_date date NOT NULL,
  claim_amount numeric(18,2) NOT NULL,
  reserve_amount numeric(18,2) NOT NULL DEFAULT 0,
  paid_amount numeric(18,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Outstanding',
  layer_allocation jsonb,
  approval_status text NOT NULL DEFAULT 'Draft'  -- maker-checker
);

CREATE TABLE premium_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  treaty_id uuid NOT NULL REFERENCES treaties(id),
  period text NOT NULL, amount numeric(18,2) NOT NULL,
  booked_date date NOT NULL, paid boolean NOT NULL DEFAULT false,
  approval_status text NOT NULL DEFAULT 'Draft'
);

CREATE TABLE retro_programmes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, retro_type text NOT NULL,
  lines_of_business text[] NOT NULL,           -- auto-coverage keys
  inception date NOT NULL, expiry date NOT NULL,
  status text NOT NULL DEFAULT 'Active',
  terms jsonb NOT NULL DEFAULT '{}'            -- type-specific (attachments, LR%, reinstatements…)
);
CREATE TABLE retro_layers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id uuid NOT NULL REFERENCES retro_programmes(id) ON DELETE CASCADE,
  layer_no int NOT NULL, attachment numeric(18,2), limit_amount numeric(18,2),
  premium numeric(18,2), rate_on_line numeric(9,6)
);
CREATE TABLE retro_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_id uuid NOT NULL REFERENCES retro_layers(id) ON DELETE CASCADE,
  retrocessionaire_id uuid NOT NULL REFERENCES retrocessionaires(id),
  signed_line_pct numeric(9,6) NOT NULL CHECK (signed_line_pct > 0)
);
-- signed lines = 100% enforced in service layer at bind time (partial states allowed while placing)

CREATE TABLE journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_no text UNIQUE NOT NULL,             -- JN-<source>-<entity>
  source text NOT NULL,                        -- 'derived'|'manual'
  journal_date date NOT NULL,
  period_id uuid REFERENCES periods(id),
  description text NOT NULL
);
CREATE TABLE journal_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id uuid NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  account_code text NOT NULL REFERENCES accounts(code),
  debit numeric(18,2) NOT NULL DEFAULT 0,
  credit numeric(18,2) NOT NULL DEFAULT 0,
  currency char(3) NOT NULL, fx_rate numeric(18,8) NOT NULL DEFAULT 1,
  CHECK (debit >= 0 AND credit >= 0), CHECK (NOT (debit > 0 AND credit > 0))
);

CREATE TABLE periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_code text UNIQUE NOT NULL,            -- '2026-Q3'
  starts date NOT NULL, ends date NOT NULL,
  status text NOT NULL DEFAULT 'Open',         -- Open|Closing|Closed
  closed_by uuid REFERENCES identity.users(id), closed_at timestamptz
);
CREATE TABLE period_balances (                 -- frozen at close
  period_id uuid REFERENCES periods(id),
  account_code text, closing_balance numeric(18,2) NOT NULL,
  ifrs17_snapshot jsonb,                       -- LRC/LIC/CSM/RA components
  PRIMARY KEY (period_id, account_code)
);

CREATE TABLE assumptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL,                        -- 'actuarial'|'ifrs17'|'pricing'
  payload jsonb NOT NULL, version int NOT NULL,
  effective_from date NOT NULL, created_by uuid NOT NULL,
  UNIQUE (domain, version)
);
```
Plus (same pattern): `underwriting_contracts`, `claim_payments`,
`retrocessionaires`, `retro_recoveries`, `retro_claims`, `accounts` (CoA),
`manual_journals`, `bank_accounts`, `bank_transactions`, `investments`,
`fx_rates`, `pricing_records`, `external_experience`, `documents`,
`notifications`, `report_archive`.

## 5. Indexes

```sql
CREATE INDEX ON treaties (cedant_id);
CREATE INDEX ON treaties (line_of_business, inception, expiry); -- retro auto-coverage
CREATE INDEX ON claims (treaty_id);
CREATE INDEX ON claims (date_of_loss);                          -- triangles
CREATE INDEX ON claims (status) WHERE status = 'Outstanding';
CREATE INDEX ON premium_bookings (treaty_id, period);
CREATE INDEX ON journal_lines (account_code);
CREATE INDEX ON journal_lines (journal_id);
CREATE INDEX ON journals (journal_date);
CREATE INDEX ON audit_log (entity, entity_id);
CREATE INDEX ON audit_log (actor_id, at DESC);
CREATE INDEX ON notifications (user_id, read, created_at DESC);
```

## 6. Constraints (beyond DDL above)

- FKs everywhere; `ON DELETE RESTRICT` default (financial history never cascades), CASCADE only for pure children (layers, lines).
- Journal balance: deferred constraint trigger asserting Σdebit = Σcredit per journal at commit.
- Period guard: trigger rejecting INSERT/UPDATE of journals whose `period` is Closed.
- ≥1 active admin: service-layer invariant + statement-level trigger on `user_modules`/`users` as backstop.

## 7. Audit Tables

```sql
CREATE TABLE audit.audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid, actor_name text NOT NULL,
  action text NOT NULL,                        -- CREATE|UPDATE|DELETE|LOGIN|GRANT|CLOSE|APPROVE…
  module text NOT NULL, entity text NOT NULL, entity_id text NOT NULL,
  before jsonb, after jsonb,
  request_id text
);
-- Append-only: REVOKE UPDATE, DELETE; trigger raises on any attempt.
```
Written by the service layer inside the same transaction as the mutation
(mirrors today's DataStore pattern). Admin UI reads it; nobody writes it directly.

## 8. Data Retention Strategy

| Data | Retention |
|---|---|
| Financial records (journals, claims, treaties, statements) | ≥ 10 years (regulatory), then archive to cold storage |
| Audit log | 10 years; partitioned by year; yearly partitions archived |
| Refresh tokens / sessions | 30 days after expiry, then purged |
| Notifications | 12 months |
| Backups | 35 days rolling + 12 monthly + yearly archives |
| Personal data of departed users | Account deactivated (never deleted — audit refs); PII minimised on request per PDPA/DPA |

## Row-Level Security (layer 8)

```sql
ALTER TABLE ops.claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY claims_module ON ops.claims
  USING (current_setting('app.modules', true) LIKE '%claims%');
-- API sets: SET LOCAL app.user_id = '<uuid>'; SET LOCAL app.modules = 'claims,treaties,...'
```
Same pattern per table keyed to its owning module. RLS is defence-in-depth
behind the API's `requireModule` middleware, and makes direct-SQL exposure safe.
