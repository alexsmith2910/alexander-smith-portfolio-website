# Tech Stack Design — Alexander Smith Portfolio

**Date:** 2026-05-06
**Status:** Approved (pending plan)
**Owner:** Alexander Smith

## Context

Personal portfolio website for Alexander Smith — Full-Stack Developer & Web Designer, based in Dubai, UAE, available June 2026. Multi-section site (Work, Writing, Workshop, About) with case studies and a writing/blog section.

A design handoff bundle exists in `docs/project/` (Hero.html, `colors_and_type.css`, `hero.css`) covering the design system: dark-first with light-theme overrides, Geist + Geist Mono + Instrument Serif typography, emerald (`#10b981`) accent, blueprint grid backdrop, soft accent bloom, film-grain overlay, and a tuned motion vocabulary (named easings, duration tokens, fade-up entrances, letter-reveal wordmark, live-dot ping, scroll-arrow bob).

The site's defining characteristic is **motion**. Animation quality is the primary product, not a finishing touch.

## Goals

- Pixel-faithful realisation of the existing design system
- Heavy, polished motion — scroll-driven choreography, letter reveals, page transitions
- Excellent Core Web Vitals (motion sites are easy to make janky; this one shouldn't be)
- Content authoring flow that keeps case studies bespoke and writing easy to publish
- Single-author workflow — no CMS overhead

## Non-goals

- Multi-author editorial pipeline
- Authenticated user features, dashboards, or any app-like state
- E-commerce, paywalls, gated content
- Internationalisation in v1

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Astro with strict TypeScript |
| Hosting | Vercel |
| Animation | GSAP (ScrollTrigger, SplitText, Flip) + Lenis |
| Styling | Tailwind CSS v4 with `@theme`, plus scoped vanilla CSS for exotic visuals |
| Interactivity | Vanilla JS only — no UI framework in v1 |
| Content | MDX with Astro Content Collections (Zod schemas) |
| Fonts | `@fontsource` self-hosted (Geist variable, Geist Mono variable, Instrument Serif italic) |
| Images | Astro `<Image />` (Sharp-based) |
| Forms | `mailto:` in v1; Resend + Vercel serverless endpoint deferred |
| Analytics | Vercel Analytics |
| Lint / format | Prettier + `prettier-plugin-astro` + `prettier-plugin-tailwindcss` |
| Package manager | pnpm |
| Node | 22 LTS, pinned via `.nvmrc` |

---

## Decisions and rationale

### Framework — Astro

A portfolio is content + motion, not app state. Astro's static-first, islands-based model fits exactly: ship HTML by default, hydrate only the parts that genuinely need JS. Built-in MDX, file-based routing, image optimization, and View Transitions API support cover most of what a portfolio needs without bolting on libraries. Vercel deployment is zero-config (auto-detected, static output by default; `@astrojs/vercel` adapter only required if/when serverless endpoints are added).

Rejected: Next.js (heavier baseline JS, app-like surface area not needed); SvelteKit (smaller ecosystem, prototype was React-flavoured).

### Animation — GSAP + Lenis

GSAP became fully free for any use case (including all plugins) in 2024 after Webflow's GreenSock acquisition. ScrollTrigger is unmatched for scroll-driven choreography (pinning, scrubbing, stagger). SplitText handles the per-letter wordmark reveal already in the design. Flip handles layout-shift transitions (e.g. case-study card → detail page).

Lenis chosen over Locomotive Scroll because:
- Lenis hooks into native scroll (preserves Ctrl+F, scroll restoration, anchor links, accessibility); Locomotive transforms a wrapper and breaks all of those.
- Locomotive's `data-scroll` triggers duplicate ScrollTrigger's job — two systems for one task is a bug factory.
- Lenis is ~3KB and single-purpose; pairs with ScrollTrigger via a five-line bridge.
- Active maintenance vs Locomotive's slowing development.

Rejected: Motion (declarative API, weaker for complex scroll choreography); Motion One (no ScrollTrigger equivalent at production-grade).

### Styling — Tailwind v4 with `@theme` + scoped vanilla CSS

The existing `colors_and_type.css` design system is comprehensive and design-led. Tailwind v4's `@theme` block lets us register existing CSS-variable tokens as first-class utilities (`bg-bg-0`, `text-fg-2`, `font-serif`, `text-display`) without duplication — Tailwind v4 emits the values as CSS variables in output, so `@theme` becomes the single source of truth.

Vanilla CSS lives in component `<style>` blocks (Astro auto-scopes them) for things Tailwind can't cleanly express:
- Gradient text fills (`-webkit-background-clip: text`)
- `mix-blend-mode: difference`
- `-webkit-text-stroke`
- Mask gradients (e.g. blueprint grid radial fade)
- SVG noise grain
- Keyframe definitions

Rejected: pure vanilla CSS (loses Tailwind's authoring speed for layout/spacing); pure Tailwind without `@theme` (forces `bg-[var(--bg-0)]` arbitrary-value syntax everywhere, defeats the purpose).

### Interactivity — vanilla JS, no UI framework

Inventory of stateful interactive surfaces is minimal: mobile nav toggle, optional theme switcher, future contact form. Each is 10-30 lines of vanilla JS. GSAP itself is vanilla. Adding React or Svelte adds runtime weight (~40KB for React) and friction (cleanup, ref forwarding, hydration timing) for no gain on this site.

If a specific component later proves it genuinely needs reactive state (e.g. a complex multi-step form), Astro permits adding Preact or React for that one island in isolation.

### Content — MDX with Content Collections

The site has one author (the owner). A headless CMS solves "non-technical editors need to publish without deploying" — that problem doesn't exist here. MDX in the repo wins on:
- Bespoke case-study layouts (custom components inline with prose: `<ProjectShot />`, `<VideoLoop />`, `<Comparison />`)
- Atomic deploys (content + code ship together)
- Zod-validated frontmatter via Content Collections — TypeScript types for free, build fails if a frontmatter field is missing or malformed
- No vendor lock-in, no subscription, no API quotas

Directory structure:

```
src/content/
├── work/         # case studies — bespoke MDX layouts
├── writing/      # blog posts
└── workshop/     # smaller experiments / demos
```

Each collection has a Zod schema in `src/content/config.ts` defining required frontmatter (e.g. `title`, `slug`, `year`, `stack`, `hero`).

### Fonts — self-hosted via `@fontsource`

Google Fonts CDN imports add a third-party DNS lookup before the hero can render — visible cost on a motion-heavy site that opens with a wordmark reveal. `@fontsource` packages ship the fonts from the same origin as the HTML.

- `@fontsource-variable/geist` — variable, all sans weights
- `@fontsource-variable/geist-mono` — variable, all mono weights
- `@fontsource/instrument-serif/400-italic.css` — single italic cut

`font-display: swap` by default; consider `font-display: optional` on the display weight used for the wordmark to prevent font-swap mid-reveal.

### Images — Astro `<Image />`

Built-in, Sharp-based, generates AVIF/WebP with responsive `srcset` and LQIP placeholders. No realistic alternative for an Astro site. Project shots live in `src/assets/` (gets optimized) rather than `public/` (served as-is).

### Forms — `mailto:` v1, Resend deferred

The current design uses `mailto:hello@alexsmith.dev` directly. Shipping with that and adding a real form later (Resend API + Vercel serverless function at `src/pages/api/contact.ts`) is the right sequencing — no upfront infra for a feature that may not be needed.

### Analytics — Vercel Analytics

One-click enable in the Vercel dashboard. Privacy-respecting (no cookie banner needed). Free tier (2.5K events/month) covers a portfolio comfortably. Plausible is a fine alternative if Vercel Analytics later proves limiting.

### Tooling

- **pnpm** — faster, stricter dependency resolution, smaller `node_modules`. Auto-detected by Vercel.
- **Prettier** with `prettier-plugin-astro` and `prettier-plugin-tailwindcss` — standard, well-maintained Astro formatting. Biome is faster but its Astro support is still rough.
- **Node 22 LTS** pinned via `.nvmrc` — matches Vercel default.
- **Strict TypeScript** — Astro's `tsconfig.json` "Strict" preset.

---

## Architecture sketch

```
alexander-smith-portfolio-website/
├── .nvmrc
├── astro.config.mjs           # @astrojs/mdx, @astrojs/vercel adapter
├── tailwind.config.* (none)   # Tailwind v4 is config-in-CSS via @theme
├── tsconfig.json              # strict
├── package.json
├── public/                    # static assets served as-is (favicon, OG images)
├── src/
│   ├── assets/                # optimised images (project shots)
│   ├── components/            # .astro components (Nav, Hero, ProjectCard, etc.)
│   ├── content/
│   │   ├── config.ts          # Zod schemas for collections
│   │   ├── work/*.mdx
│   │   ├── writing/*.mdx
│   │   └── workshop/*.mdx
│   ├── layouts/               # page-level layouts (BaseLayout, CaseStudyLayout)
│   ├── lib/                   # vanilla JS modules (lenis-bridge.ts, gsap-utils.ts)
│   ├── pages/
│   │   ├── index.astro        # hero + section previews
│   │   ├── work/
│   │   │   ├── index.astro    # work index
│   │   │   └── [slug].astro   # case study detail (renders work/*.mdx)
│   │   ├── writing/...
│   │   ├── workshop/...
│   │   └── about.astro
│   └── styles/
│       ├── global.css         # @import "tailwindcss"; @theme {...}; @fontsource imports; reset
│       └── tokens.css         # design tokens (light theme overrides, etc.)
└── docs/
    ├── project/               # original design handoff
    └── superpowers/specs/     # design docs (this file)
```

## Open questions / deferred

- **View Transitions** — Astro supports the View Transitions API natively. Worth using for page-to-page transitions, but the exact transition vocabulary (which elements morph, which fade) is a design decision for implementation, not stack-level.
- **Theme switcher (dark/light)** — design system supports both via `.theme-light` class. Whether to expose a toggle in the UI or default to system preference is a UX decision.
- **Contact form** — deferred to post-launch. When added: Resend + `src/pages/api/contact.ts` server endpoint via `@astrojs/vercel`.
- **OG image generation** — likely worth a serverless function generating per-page social cards. Defer to implementation phase.
- **MDX component vocabulary** — the set of custom components case studies can use (`<ProjectShot />`, `<VideoLoop />`, `<Comparison />`, `<CodeBlock />`, etc.) needs to be designed alongside the first one or two case studies, not up front.
