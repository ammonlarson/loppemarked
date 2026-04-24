## Analysis

### Current State
- The landing stylesheet assumes airy spacing, simple stacking, and light procedural shadows.
- That system cannot produce the density and materiality of the target scene.

### Target State
- The landing page styling supports overlap, richer depth, stronger contrast, and scene-based layout behavior.

### Approach
- Rewrite most of the landing CSS instead of incrementally tuning it.
- Support layered positioning, heavier material cues, and responsive scene behavior.

## Task Checklist
- [x] Create GitHub issue #29
- [x] Add `agent active` and `claude` labels
- [x] Record scope in `.agent/ticket-29-plan.md`
- [x] Replace the current landing-page CSS/layout rules
- [x] Introduce scene-based spacing and overlap behavior
- [x] Add richer shadows and material treatments
- [x] Validate maintainability and responsiveness

## Implementation Summary
- Primary area: `apps/web`
- File touched: `apps/web/src/styles/landing.css` (full rewrite)
- Component DOM/API (LandingPage.tsx, HeroScene.tsx) unchanged; existing
  class names preserved so tests continue to pass.

### What changed
- Scoped CSS variables on `.flea-landing` for ink/paper/accent/shadow tones,
  to keep the rewrite self-contained and maintainable.
- Scene now fills the viewport (`min-height: 100svh`) with a deep warm
  gradient fallback behind the raster and a vignette pass riding above the
  image layers to tighten contrast.
- `.flea-landing__overlay` switched from centered flex to a grid that
  anchors the copy card to the lower-left on desktop, with bottom padding
  reserved for the CTA overlay.
- `.flea-landing__copy` is now a tangible paper note: textured gradient
  background, printed-edge inner shadow, slight rotation, multi-layer drop
  shadow + contact shadow (`::after`), paper-tone overlay (`::before`).
- `.flea-landing__cta` rewritten as a pressed, tactile pill: gradient fill,
  inner highlight/shadow, firm bottom edge, layered drop shadows, and a
  physical `:active` compression.
- Mobile breakpoint re-centers copy and trims CTA size for touch targets.

### Validation
- `npm test` (web workspace): 286 tests pass.
- `npm run lint`: no errors.
- `npm run build`: compiles successfully, static pages render.
- In-browser visual QA not possible in this environment (Playwright
  Chromium unavailable); component render contract is covered by the
  existing LandingPage test suite.
