## Analysis

### Current State
- The landing page leans on a handwritten-heavy display stack: `Amatic SC` for the hero title, `Caveat` for the event date/time and CTA, and `Montserrat` for body copy.
- `ProjectAbout` (rendered under the landing page) reuses `fonts.display` (`Amatic SC`) for the section heading and `fonts.marker` (`Caveat`) for the contact email.
- Fonts are pulled via a `<link>` in `apps/web/src/app/layout.tsx`; `fonts.display`/`fonts.marker` are also used by `BrandLogo`, `TableMap`, `TableMapPage`, and `RegistrationForm` (admin/internal surfaces — out of scope per ticket).

### Target State
- Landing page uses a high-contrast editorial serif for the headline and a restrained sans for supporting copy.
- The new font loads alongside the existing ones (Amatic SC/Caveat stay loaded for BrandLogo + admin surfaces — they remain in scope for later tickets only).
- Hierarchy feels editorial rather than whimsical: bolder contrast on the hero title, tighter tracking, uppercase/tracked treatment for meta text (event date), cleaner CTA.

### Approach
- Add `Fraunces` (variable display serif) to the shared font link for a modern editorial headline feel.
- Expose it via a new `fonts.editorial` token in `apps/web/src/styles/theme.ts`, preserving the existing `fonts.display`/`fonts.marker` tokens so admin surfaces render unchanged.
- Retype landing-specific surfaces only: hero title, event line, CTA, and the landing footer (`ProjectAbout`).
- Body copy stays on the existing Inter/Montserrat pairing, slightly tuned (prefer Inter first) for readability.

## Task Checklist
- [x] Create GitHub issue #28
- [x] Add `agent active` and `claude` labels
- [x] Record scope in `.agent/ticket-28-plan.md`
- [x] Update font loading in `apps/web/src/app/layout.tsx` to include Fraunces
- [x] Add `fonts.editorial` token in `apps/web/src/styles/theme.ts`
- [x] Retypeset `apps/web/src/styles/landing.css` (title, body, event, CTA)
- [x] Retypeset `apps/web/src/components/ProjectAbout.tsx` heading + marker line
- [ ] Run tests/lint/typecheck/build
- [ ] Desktop + mobile visual QA for typography hierarchy and readability

## Implementation Summary
- Primary area: `apps/web`
- Files modified:
  - `apps/web/src/app/layout.tsx` — add Fraunces to the Google Fonts link
  - `apps/web/src/styles/theme.ts` — add `fonts.editorial`
  - `apps/web/src/styles/landing.css` — hero title, event, CTA, body font-stack order
  - `apps/web/src/components/ProjectAbout.tsx` — heading/ornament/marker family
- Estimated impact: typography system refresh limited to the landing-page surface. No admin flows change.
