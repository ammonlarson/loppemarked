# apps/api

Backend API application (Node.js/TypeScript).

## Responsibilities

- Public endpoints for status, availability, registration, waitlist.
- Admin endpoints for authentication and management operations.
- Audit event recording and outbound email orchestration.

Must not contain:
- Frontend rendering code.
- Infrastructure provisioning logic.

## Tech Stack

- **Runtime:** Node.js (TypeScript)
- **Database:** PostgreSQL 16 via [Kysely](https://kysely.dev/)
- **Auth:** Argon2id password hashing, HttpOnly session cookies
- **Testing:** Vitest
- **Linting:** ESLint

## Source Structure

```
src/
├── db/
│   ├── connection.ts        Database connection factory
│   ├── index.ts             DB module entry point
│   ├── migrate.ts           Migration runner
│   ├── migrations/          Kysely migration files
│   ├── seed.ts              Seed data (greenhouses, boxes, admins)
│   ├── setup.ts             Combined migrate + seed entry point
│   └── types.ts             Database table type definitions
├── lib/
│   ├── admin-email-templates.ts  Admin notification email templates
│   ├── audit.ts             Audit event recording helpers
│   ├── email-service.ts     SES email delivery service
│   ├── email-templates.ts   Public-facing email templates
│   ├── errors.ts            Typed API error classes
│   ├── logger.ts            Structured JSON logger (Lambda) / text logger (dev)
│   ├── password.ts          Argon2id hashing and verification
│   └── session.ts           Session token generation
├── middleware/
│   └── auth.ts              Admin session authentication middleware
├── routes/
│   ├── admin/
│   │   ├── admins.ts        Admin account CRUD
│   │   ├── audit.ts         Audit timeline retrieval
│   │   ├── auth.ts          Admin login and password change
│   │   ├── registrations.ts Registration management (create, move, remove)
│   │   ├── settings.ts      System settings (opening time)
│   │   └── waitlist.ts      Waitlist assignment
│   ├── health.ts            Health check endpoint
│   └── public.ts            Public status, boxes, register, and waitlist
├── router.ts                Route registration
├── dev-server.ts            Local development HTTP server
├── lambda.ts                AWS Lambda handler entry point
└── index.ts                 Application entry point
```

## Database

Uses [Kysely](https://kysely.dev/) as a type-safe query builder with PostgreSQL.

### Schema

The schema is managed through Kysely migrations in `src/db/migrations/`. The initial migration creates all 10 core tables:

- `greenhouses` - Greenhouse records (Kronen, Soen)
- `planter_boxes` - 29 named planter boxes with state tracking
- `admins` - Admin accounts
- `admin_credentials` - Hashed admin passwords
- `sessions` - Admin session management
- `system_settings` - Opening datetime configuration
- `registrations` - Box registrations with address normalization
- `waitlist_entries` - Ordered waitlist by apartment
- `emails` - Outbound email log with edit tracking
- `audit_events` - Immutable audit trail (protected by trigger)

### Key constraints

- One active registration per normalized apartment key (partial unique index)
- One active occupant per box (partial unique index)
- Box state restricted to: available, occupied, reserved
- Audit events are immutable (UPDATE/DELETE blocked by trigger)
- Waitlist FIFO ordering by `created_at`

### Seed data

The seed module (`src/db/seed.ts`) populates:
- 2 greenhouses (Kronen, Soen)
- 29 planter boxes with spec naming and numbering
- Default opening datetime (2026-04-01 10:00 Europe/Copenhagen)
- 2 initial admin accounts (passwords must be hashed at seed time)

## Scripts

```bash
npm run dev        # Start dev server (port 3001)
npm run build      # Compile TypeScript
npm run test       # Run Vitest tests
npm run lint       # Run ESLint
npm run typecheck  # Type checking
npm run db:setup   # Run migrations + seed (requires DB_PASSWORD)
```
