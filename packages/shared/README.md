# packages/shared

Shared TypeScript code used by `apps/web` and `apps/api`.

## Contents

- **Enums** (`enums.ts`) — Box states, registration statuses, waitlist statuses, actor types, languages, audit actions, email statuses.
- **Constants** (`constants.ts`) — Greenhouse names, 29-box catalog with global numbering, opening datetime, email sender/reply-to, organizer contacts, address eligibility rules.
- **Types** (`types.ts`) — Interfaces for all domain entities: `PlanterBoxPublic`, `GreenhouseSummary`, `Registration`, `WaitlistEntry`, `AuditEvent`, form inputs, etc.
- **Validators** (`validators.ts`) — Address validation (street, house number, floor/door rules), email, name, and box ID validation with typed results.
- **DAWA** (`dawa.ts`) — Danish Address Web API (DAWA) types and helpers for address autocomplete.
- **i18n** (`i18n.ts`) — Translation key contracts and language display labels (`Dansk`, `English`).

## Source Structure

```
src/
├── constants.ts        Domain constants and box catalog
├── constants.test.ts   Constant validation tests
├── dawa.ts             DAWA (Danish Address Web API) types and helpers
├── dawa.test.ts        DAWA module tests
├── enums.ts            Status and type enums
├── i18n.ts             i18n key contracts and language labels
├── index.ts            Package entry point (re-exports all)
├── index.test.ts       Export completeness tests
├── types.ts            Domain entity interfaces
├── validators.ts       Validation functions
└── validators.test.ts  Validator unit tests
```

## Usage

```typescript
import {
  BOX_CATALOG,
  GREENHOUSES,
  validateAddress,
  type PlanterBoxPublic,
} from "@loppemarked/shared";
```

## Scripts

```bash
npm run build      # Compile TypeScript
npm run test       # Run Vitest tests
npm run typecheck  # Type checking
```
