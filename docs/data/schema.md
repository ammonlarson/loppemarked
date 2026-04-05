# Data Contract and Invariants

This document captures key data constraints from the product specification.

## Core Entities

- `admins`
- `admin_credentials`
- `sessions`
- `system_settings`
- `greenhouses`
- `planter_boxes`
- `registrations`
- `waitlist_entries`
- `emails`
- `audit_events`

## Critical Invariants

1. One active registration per normalized apartment key.
2. One active occupant per box.
3. Box states are constrained to:
   - `available`
   - `occupied`
   - `reserved`
4. Waitlist ordering is FIFO by first waitlist timestamp.
5. If an apartment joins waitlist again, preserve earliest timestamp.
6. Every critical mutation writes an immutable `audit_events` row with actor + before/after.

## Address Normalization Rules

- Street must be `Else Alfelts Vej`.
- House number range: 122-202 inclusive.
- Floor + door required for house numbers:
  - 138
  - 144
  - 161-202
- Uniqueness key should include street, house number, floor, and door in normalized form.

## Access Rules

- Public users never see personal registration data.
- Admin users can view and manage personal registration data.
