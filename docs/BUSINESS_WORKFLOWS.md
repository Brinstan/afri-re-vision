# Business Workflows

AfriReVision models the inward-reinsurance lifecycle. All modules share the single
`DataStore`, so an action in one module is immediately visible in the others.

## End-to-end flow

```
Underwriting → Treaty Conversion → Treaty Management → Premium Booking
   → Claims → Automatic Reinstatement Premium → Accounting → Actuarial → IFRS 17
```

### 1. Underwriting (`UnderwritingModuleIntegrated`)

- The underwriter captures a contract (type, cedants, brokers, lines of business,
  dates, premium, and type-specific terms — quota/surplus/XOL/stop-loss/facultative).
- Validation: unique contract number (checked against contracts **and** treaties),
  expiry after inception, positive premium, at least one line of business, complete
  cedant/broker details.
- Saving creates an `UnderwritingContract` with status `Draft`.
- **Convert to Treaty** (`convertUnderwritingToTreaty`) turns a Draft contract into an
  active `Treaty` and flips the contract to `Active`.

### 2. Treaty Management (`TreatyManagementIntegrated`)

- **Premium Booking:** query a treaty by contract number, then book a premium
  (`MDP`, `Adjustment`, `Reinstatement`). VAT (18%) and taxes are computed; the booking
  is added to the treaty with status `Unpaid`.
- **Monthly Returns:** capture gross/net premium, claims incurred, commission; ratios
  (loss, commission, combined, P/L) compute live; booking a return adds a
  `Monthly Return (YYYY-MM)` premium booking to the matched treaty.
- **Inward Treaty Display:** searchable table of treaties with linked claims summary;
  the detail dialog can mark premium bookings as paid.

### 3. Claims (`ClaimsModuleLinked`)

- Register a claim (XOL / Facultative / Large Risk). Entering a contract number
  **auto-links** the treaty and pre-fills currency and insured name.
- Claim reference numbers are generated **once, sequentially** (`TAN/MV/TTY/YYYY/NNNN`).
- For XOL claims, the module computes a **per-layer distribution**: deductibles, layer
  limits, net claim, reinstatement premium, payable amount (at participation share),
  retro recovery, and net exposure.
- On submit:
  - The `Claim` is added and linked to the treaty.
  - The treaty's `layers[].remainingCapacity` is **reduced** by the claim's layer
    consumption (so later claims see the reduced capacity).
  - If a reinstatement premium is due, it is **auto-booked** onto the treaty as a
    `Reinstatement` premium booking.
- Claim documents (advice, payment voucher) export as text; claims can be paid
  (status → `Full Payment`) or edited.

### 4. Accounting (`AccountingModule`)

- **Receivables:** derived from each treaty's premium bookings (booked vs paid vs
  outstanding). "Allocate Payment" marks a treaty's unpaid bookings as paid.
- **Payables:** derived from claims (settlement) and treaties (broker commission);
  manual payables can be added. Paying a claim payable:
  - updates the `Claim` status (`Settled` / `Partial Payment`) and writes
    `paidAmount`/`paymentDate`/`paymentReference`;
  - records the settlement as a `Claim Payment (...)` premium booking on the treaty.
- **Investments**, **Financial Reports** (trial balance, P&L, etc. as text exports),
  and **Portfolio Analysis** (`PortfolioAnalysis` embedded) round out the module.

### 5. Actuarial Engine (`ActuarialEngine` + `src/lib/actuarial.ts`)

- Builds **loss triangles** (paid, incurred, reported) from live claims by accident
  year (`dateOfLoss`) and development lag (payment/report dates).
- Estimates **development factors** with stability diagnostics.
- Runs **Chain Ladder, Bornhuetter-Ferguson, Cape Cod, Expected Loss Ratio**, plus a
  simplified **Mack** standard error. Produces Ultimate, IBNR, RBNS, and reserves.
- The actuary **selects a preferred method** (recorded in the governance panel and
  persisted). IBNR from the selected method feeds IFRS 17.
- Also: inflation/trend adjustment, XOL layer analytics, portfolio analytics, CSV and
  print-to-PDF exports.

### 6. IFRS 17 (`IfrsReporting` + `src/ifrs17/*`)

- Assigns a **measurement model** per treaty (PAA for coverage ≤ 12 months, else GMM;
  VFA placeholder; per-treaty overrides).
- Produces **LRC** and **LIC** roll-forwards, **fulfilment cash flows**, **risk
  adjustment** (three methods), **reinsurance issued/held**, draft **financial
  statements**, and **portfolio/cedant performance**.
- **Reuses** the actuarial IBNR, ELR, and selected reserving method (read from the
  actuarial assumptions in `localStorage`) rather than recomputing them.
- Filterable by valuation date, currency, cedant, treaty, broker, country, line of
  business, accident year, underwriting year. Exports CSV, Excel-compatible analysis,
  and a print-to-PDF management report.

## Retrocession (`RetrocessionModule`)

Runs alongside the main flow: models the reinsurer's own outward protection
(program structure, outward treaties, allocation config). Claims carry a
`retroRecovery`, and treaties a `retroPercentage`, which IFRS 17 "Reinsurance Held"
consumes. Note: parts of Retrocession still use illustrative in-component data — see
[MODULES.md](./MODULES.md) and [TECH_DEBT.md](./TECH_DEBT.md).

## Data-flow summary

| Produced by | Data | Consumed by |
|---|---|---|
| Underwriting | UnderwritingContract → Treaty | Treaty, Claims, Accounting, Actuarial, IFRS 17 |
| Treaty Mgmt | PremiumBooking | Accounting (receivables), IFRS 17 (premium received) |
| Claims | Claim, layer consumption, reinstatement booking | Accounting, Actuarial (triangles), IFRS 17 (LIC) |
| Accounting | claim payments (paidAmount) | Actuarial (paid triangle), IFRS 17 |
| Actuarial | IBNR, ELR, selected method | IFRS 17 (LIC, FCF, risk adjustment) |
| Retrocession | retro %, recoveries | IFRS 17 (Reinsurance Held) |
