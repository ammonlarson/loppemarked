## Analysis

### Current State
- The repo does not contain the scene, texture, and prop assets needed for the target landing-page look.
- The current page relies mostly on CSS and inline SVG.

### Target State
- Desktop and mobile hero assets, plus corkboard/paper/prop assets, are available and integrated.
- Asset usage is consistent and optimized for responsive delivery.

### Approach
- Copy the delivered asset pack from `images/` into `apps/web/public/landing/` so Next.js serves them from a predictable, cacheable subpath.
- Extend `SceneAsset` to accept `<picture>`-style `sources`, so the hero `background` slot can art-direct between the desktop and mobile crops without extra JS.
- Point `sceneConfig.ts` at the new hero pack and fill the `foreground` slot with the prop composite.
- Replace the procedural corkboard radial-gradient background with the delivered corkboard texture in `landing.css`.
- Document the `apps/web/public/landing/` naming convention and the art-direction wiring in `docs/architecture.md`.

## Task Checklist
- [x] Create GitHub issue #25
- [x] Add `agent active` and `claude` labels
- [x] Record scope in `.agent/ticket-25-plan.md`
- [x] Receive external asset pack
- [x] Add desktop hero asset support
- [x] Add mobile hero asset support
- [x] Integrate corkboard/paper/prop assets
- [x] Validate responsive asset quality and loading

## Implementation Summary
- Primary area: `apps/web`
- Files touched:
  - `apps/web/public/landing/*.webp` — copied delivered assets.
  - `apps/web/src/components/HeroScene.tsx` — added `SceneAssetSource` + `<picture>` rendering.
  - `apps/web/src/components/HeroScene.test.tsx` — added responsive-sources coverage.
  - `apps/web/src/components/landing/sceneConfig.ts` — wired desktop/mobile hero and foreground prop.
  - `apps/web/src/styles/landing.css` — swapped procedural corkboard for the real texture.
  - `docs/architecture.md` — documented the asset-pack conventions.
