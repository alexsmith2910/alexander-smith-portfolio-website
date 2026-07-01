# Brand-sell build — progress

Working `.handoff/BRAND-SELL-AUDIT.md`. Everything below is wired with **editable
placeholder data** so you can review live, then tweak in `src/data/*`. Build is green
(`tsc` clean · `next build` 14 routes).

## Done

### Conversion architecture
- **Persistent primary CTA** in the nav ("Start a project") with a pulsing dot that
  doubles as the live availability signal. Tinted by the same loop that manages the
  hamburger, so it adapts across the plasma/dark zones. Hidden on phones (menu handles it).
- **Hero CTAs** — signature `PillButton` ("Start a project") + "View work", revealing
  on the hero's beat and lifting on scroll-out.
- **Signature CTA component** — `src/components/ui/PillButton.tsx`: circle grows from the
  exact cursor-entry point, label crossfades to the inverse tone, arrow rotates 45°,
  magnetic pull. Mono adaptation of your validated chip-fill pattern. `tone="ink|bone"`.

### Content (all data-driven)
- **Services** (`src/data/services.ts` → `components/sections/Services.tsx`) — outcome-framed,
  hover-reveals the benefit. On Home (before the work) + reusable.
- **Testimonials + clients** (`src/data/testimonials.ts` → `components/sections/Testimonials.tsx`)
  — ⚠️ placeholder quotes/clients, clearly marked. On Home + About.
- **Tech stack** (`src/data/about.ts` `techStack` → `components/sections/TechStack.tsx`) — on Home + About.
- **About bio + portrait slot + interests + "now"** (`src/data/about.ts`) — replaces the
  faceless process-only page. Fabricated awards (Awwwards ×4 etc.) **removed** (credibility risk).
- **Value-prop line** added to `site.ts` (`valueProp`) for reuse.

### Contact
- Form now **POSTs to `/api/contact`** (stub route handler: validates, logs, returns ok)
  with sending / sent / error states. Name is optional; email is required.
- Direct email (copy via mailto) + optional **booking link** + **CV button** + live
  **availability** chip, all from `site.ts`.

## Needs YOU (drop in the truth, then it's launch-ready)
- **Real bio** — `src/data/about.ts` → `bio.paragraphs` + `bio.signature`.
- **Portrait photo** — drop in `/public`, set `bio.portrait` (e.g. `"/portrait.jpg"`).
- **Real testimonials + clients** — `src/data/testimonials.ts` (every entry is `[ … ]`).
- **Interests / "now"** — `src/data/about.ts` `interests` + `now` (make them actually yours).
- **Booking link** — `site.ts` `booking.href` (Cal.com/Calendly URL; empty = hidden).
- **CV PDF** — drop in `/public`, set `site.ts` `cv.href` (empty = hidden everywhere).
- **Rates / engagement** — `src/data/services.ts` `engagement.models[].meta` (`[ £X,XXX ]`).
- **Wire real email delivery** — `src/app/api/contact/route.ts` (header explains options;
  use an env var for the key — no secrets committed).
- **Socials** — `site.ts` `socials[].href` still `"#"`.

## Not done (lower-priority audit items, left for later)
- Per-page metadata / OG images (P1).
- FAQ, process-tied-to-deliverables (P1/P2).
- Lab-as-proof reframing + CTA; draggable signature toy; sound signature; easter egg (P2).
