# Ticket 10: Fælledhuset Loppemarked Visual Concept

## Design Direction

The site should feel like a warm neighborhood bulletin board set inside Fælledhuset just before the doors open: sunlit wood floors, paper signage, hand-labeled tables, and a soft sense of anticipation. The visual language should balance trust and charm so residents immediately understand that this is an organized system, but also a local event run by neighbors.

## Theme: "Hygge Noticeboard"

### Mood
- Warm, social, and tactile
- Calm enough to feel trustworthy
- Handmade without feeling messy
- Seasonal: spring daylight, muted florals, natural wood, and soft textile textures

### Visual Ingredients
- Backgrounds inspired by plaster walls, linen paper, and light oak
- Rounded card shapes that feel like pinned paper notes or table tags
- Fine illustrated accents: tulips, ceramic mugs, bunting, tape corners, and small hand-drawn map arrows
- A room map that looks architectural at a glance, but welcoming rather than technical

### Suggested Design Tokens
- Base background: warm oat `#F6F1E8`
- Surface: paper cream `#FFF9F0`
- Accent green: sage `#78866B`
- Accent red: brick rose `#B96A58`
- Accent gold: honey `#C8A15A`
- Ink: cocoa `#4A392F`
- Line work: soft clay `#D8C7B4`

### Typography
- Headings: a high-character serif such as `Fraunces`, `Cormorant Garamond`, or `Bricolage Grotesque` if the team prefers a more contemporary voice
- Body/UI: a humanist sans such as `Manrope`, `Instrument Sans`, or `Source Sans 3`
- Small labels: uppercase with letter spacing to mimic printed table labels and event signage

## Page 1: Landing Page

### Purpose
Set the tone, explain the event, and invite residents to "enter" Fælledhuset.

### Layout
- Full-height hero with a softly illustrated Fælledhuset interior or facade glimpse
- Main headline focused on the spring loppemarked and the communal nature of the event
- Event facts displayed as pinned cards:
  - date
  - time
  - location
  - resident-only note
- Primary CTA: `Enter Fælledhuset`
- Secondary content block explaining how table booking works in three simple steps
- Footer strip with organizer contact details and a subtle community reminder

### Interaction Notes
- The CTA should feel like opening a door or lifting a paper tag
- Add slight layered depth, not heavy motion
- On mobile, event facts stack as large touch-friendly cards above the CTA

## Page 2: Reservation Page

### Purpose
Let residents understand the room quickly, scan availability, and either reserve a table or join the waitlist.

### Layout
- Sticky top bar with page title, selected date, and a compact legend
- Main split layout on desktop:
  - left: Fælledhuset table map
  - right: reservation panel with selected table details and booking action
- Mobile collapses into:
  - map first
  - swipeable or stacked status legend
  - sticky bottom booking drawer

### Map Behavior
- Tables are rendered as tactile rectangular modules with visible spacing, aisle labels, and entry markers
- States:
  - available: warm cream with green outline
  - reserved: muted rose fill with a tiny `Reserved` ribbon
  - selected: honey outline with a stronger shadow
  - unavailable/full state: softened neutrals and clear waitlist guidance
- Include small room landmarks so the map feels grounded: windows, coffee corner, stage, coat rack, and entrance

### Waitlist Behavior
- If all tables are taken, replace the booking panel CTA with a waitlist card
- Message should reassure residents that the list is ordered and they will be contacted if a table opens
- Keep the waitlist action prominent, not hidden below the fold

## Responsive Behavior

### Desktop
- The experience should feel like standing in the room and choosing a spot from a printed floor plan on a noticeboard
- Use wide margins, generous whitespace, and visible layering of paper cards over a textured background

### Mobile
- Prioritize scannability over decoration
- Keep the map readable through chunked zoning, stronger contrast, and a persistent bottom action area
- Preserve the same tactile materials, but reduce ornament density

## Screenshot Goals
- Landing page desktop: immersive hero, event detail cards, prominent `Enter Fælledhuset` CTA
- Landing page mobile: stacked event cards, cozy hero crop, strong primary CTA
- Reservation page desktop: clear room map with mixed table states and a booking panel
- Reservation page mobile: simplified map with a sticky reservation drawer and waitlist-ready messaging

## Generated Mock Screenshots
- [Landing page desktop](docs/design-assets/ticket-10/landing-desktop.png)
- [Landing page mobile](docs/design-assets/ticket-10/landing-mobile.png)
- [Reservation page desktop](docs/design-assets/ticket-10/reservation-desktop.png)
- [Reservation page mobile](docs/design-assets/ticket-10/reservation-mobile.png)
