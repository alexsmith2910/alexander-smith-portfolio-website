# Alexander Smith — Portfolio

Immersive, real-time portfolio for a creative web designer & developer. Built from a
Claude Design handoff bundle into a production Next.js app. Near-monochrome (bone + ink),
heavy WebGL — a clay hero scene, a dark-plasma shader (footer dissolve + menu takeover),
a custom cursor, smooth scroll, ink page transitions, and a live canvas sketch lab.

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS v4** (tokens) + scoped inline styles for design fidelity
- **three.js** (WebGL background + shaders) · **GSAP** (orchestration) · **Lenis** (smooth scroll)

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
```

## Routes

| Route | Source |
|---|---|
| `/` | Home — intro loader, masked hero, selected work, CTA |
| `/work` | Work index — hover rows with a WebGL dissolve preview |
| `/work/[slug]` | Case study (SSG). `aurora-systems` is a full sample; others are placeholders |
| `/about` | About — process, capabilities, recognition |
| `/contact` | Contact — working client-side enquiry form |
| `/lab` | The Lab — sticky index + live canvas experiments |

## Editing content

All copy/data lives in **`src/data/`** — no need to touch components:

- **`site.ts`** — name, role, email, location/coordinates, social links, nav, copyright.
- **`projects.ts`** — the Work index + every case study. `Aurora Systems` is a fully
  fleshed-out *sample*; the other four are index-only. Add a `caseStudy` block to any
  project to light up its detail page. Media are striped placeholders labelled
  `[ asset.mp4 — replace ]` — swap them for real media when ready.
- **`lab.ts`** — Lab notes & experiments (each experiment maps to a canvas sketch kind).
- **`about.ts`** — process acts, capabilities, recognition (placeholder awards — edit freely).

## Architecture

The global "experience" (shared across every route) lives in **`src/experience/`**:

- `ExperienceProvider` — the single master `requestAnimationFrame` loop. Drives Lenis,
  scroll-linked reveals (`[data-reveal]`), the dark-zone colour interpolation
  (`[data-darkzone]`), the menu reveal, ink page transitions (`navigate()`), and fans a
  per-frame `state` out to registered ticks (`useTick`).
- `WebGLCanvas` — clay hero scene (home) + the dark-plasma shader (footer dissolve via a
  vertical sweep, menu takeover via a radial-from-corner sweep), rendered half-res.
- `Cursor`, `Grain`, `Nav`, `MenuOverlay`, `AudioToggle` — the rest of the chrome.

Reusable UI primitives are in `src/components/ui/` (`Reveal`, `Kicker`, `TextButton`,
`MediaPlaceholder`) and `src/components/SiteFooter.tsx`.

### Conventions

- A page is **content only** — never re-add nav/menu/cursor/canvas/grain/audio.
- Wrap page content in `position: relative; z-index: 1` (above the canvas, below the grain).
- Mark scroll-in elements with `<Reveal>` (or `data-reveal` + `opacity: 0`).
- Mark a dark CTA/footer with `data-darkzone` + initial `color: #0a0a0a` (or use `SiteFooter`).
- Anything using `window`/`document`/three/canvas must run inside `useEffect`.
- `prefers-reduced-motion` is honoured everywhere (instant fallbacks).

## To do later

- Wire the contact form to a real handler (a Next route handler or form service).
- Drop real project media + flesh out the remaining four case studies.
- Replace placeholder social links and recognition entries.

---

The original design bundle is preserved in `.handoff/` for reference.
