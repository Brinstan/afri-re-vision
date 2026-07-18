# Enterprise Blueprint — AfriReVision Production Programme

The complete discovery → architecture → handoff documentation set for taking
AfriReVision from the working client-side platform to a production system.

| Phase | Document |
|---|---|
| 1 | [Business Analysis](./01-BUSINESS_ANALYSIS.md) |
| 2 | [Product Requirements (PRD)](./02-PRD.md) |
| 3 | [System Architecture + 13 production layers](./03-ARCHITECTURE.md) |
| 4 | [Database Design (ERD, DDL, RLS, audit, retention)](./04-DATABASE_DESIGN.md) |
| 5 | [UI/UX Design](./05-UIUX_DESIGN.md) |
| 6 | [Development Roadmap](./06-ROADMAP.md) |
| 7 | [Testing Strategy](./07-TESTING_STRATEGY.md) |
| 8 | [DevOps](./08-DEVOPS.md) |
| 9 | [Coding Standards](./09-CODING_STANDARDS.md) |
| 10 | [AI Development Handoff Blueprint](./10-AI_DEV_BLUEPRINT.md) |

Already implemented in this repo (not future work): all nine business modules,
the pure calculation engines, and **feature-based access control** — an
Administration module where the System Administrator creates users and grants
per-module access (role templates: Underwriter, Claims Officer, Accountant,
Actuary, Finance Manager, Executive, Custom). Navigation and content are
filtered to granted modules; production adds server-side enforcement (JWT
claims + API middleware + Postgres RLS) per Phase 3 §7.
