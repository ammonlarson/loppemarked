## Analysis

### Current State
- The current responsive landing page mostly collapses the desktop layout.
- The target mobile design needs its own composition and crop strategy.

### Target State
- Mobile has a dedicated layout with controlled focal hierarchy, asset cropping, and CTA placement.

### Approach
- Design mobile as its own scene, not just a reduced desktop variant.
- Support alternate mobile assets or mobile-specific crop behavior.

## Task Checklist
- [x] Create GitHub issue #32
- [x] Add `agent active` and `claude` labels
- [x] Record scope in `.agent/ticket-32-plan.md`
- [x] Create mobile-specific landing composition
- [x] Support mobile asset or crop strategy
- [x] Reposition key elements for narrow screens
- [x] Validate readability/performance on mobile

## Implementation Summary
- Primary area: `apps/web`
- Added `useIsMobileLanding` hook that swaps scenes at the `(max-width: 760px)` breakpoint.
- Added `MobileLandingScene` with a stacked, grid-based composition: title/event band, framed hero raster with controlled focal crop, paper-card body copy, and anchored CTA.
- Kept the desktop scene intact; `LandingPage` now picks between desktop and mobile variants instead of scaling a single composition.
- Extended `landing.css` with a `.flea-landing-mobile` block (focal-cropped `aspect-ratio`, pinned `object-position`, short-viewport adjustments). Desktop styles untouched.
- Test coverage: added mobile-path tests alongside the existing desktop tests (13 tests total in `LandingPage.test.tsx`).
