# Audit II — closing the gap to Immersive Garden

A second, fresh pass — captured live in the browser (Playwright, 1440 + 390) on the
**current** build, after the brand-sell sections landed. The first audit
(`IMMERSIVE-GARDEN-AUDIT.md`) drove motion vocabulary, velocity skew, the hero word
reveal, the morphing cursor and the plasma transition — all done (see `IG-PROGRESS.md`).
This one looks at what *still* separates the site from IG-tier now that the content is in.

> **Thesis.** The site already has IG-tier **chrome** — custom morphing cursor, plasma
> page-transition, cohesive bone/ink art direction, masked kinetic hero type, buttery
> Lenis scroll. What it does **not** yet have is IG-tier **substance**: the WebGL is
> confined to a single hero object, nothing is **scroll-scrubbed or pinned**, there's
> **no post-processing depth**, and the work/services/proof sections are (beautiful but)
> static typographic blocks. IG feels like *one continuous, reactive 3D world you scroll
> through*. We currently have a gorgeous editorial magazine with a 3D cover.
>
> Closing that gap is ~6 focused moves, not a redesign.

---

## Scorecard (current → IG bar)

| Dimension | Now | IG bar | Gap |
|---|---|---|---|
| Art direction / cohesion | 9 | 10 | Nearly there — palette + type are excellent |
| Custom cursor / micro-UI | 9 | 10 | Morphing + trail already strong |
| Page transitions | 8 | 10 | Plasma dissolve is great; peaks too bright mid-cover |
| Kinetic typography | 8 | 10 | Hero is superb; rest of site doesn't move with scroll |
| **WebGL presence** | **4** | **10** | **Confined to hero; absent everywhere else** |
| **Scroll-scrubbed / pinned moments** | **1** | **10** | **None exist — biggest single lever** |
| **Post-processing / cinematic depth** | **2** | **9** | **CSS vignette + grain only; no bloom/DOF/CA** |
| Media richness (work) | 3 | 10 | Empty striped placeholders read as unfinished |
| Sound design | 3 | 8 | Toggle exists; unclear it drives real UI sound + bed |
| Loader as a moment | 5 | 9 | Lifts cleanly; verify real progress + branded reveal |
| Performance discipline | 6 | 9 | No offscreen pause / adaptive quality / FPS lock |

---

## What's already IG-tier (keep, don't regress)
- **The hero.** Word-masked serif reveal + clay knot + value prop + dual CTA + mouse-parallax
  camera. This is genuinely high-end.
- **Cohesion.** One palette, one type system (Instrument Serif / Space Grotesk / Space Mono),
  one motion language. IG's whole power is consistency — you have it.
- **Cursor + transition.** Morphing disc/ring/trail and the organic plasma dissolve are
  signature-grade.
- **Scroll feel.** Lenis smoothing + velocity-driven skew/parallax on media.

---

## The gap — specific findings

### 1. WebGL is a cameo, not the world (P0 — highest leverage)
The clay knot exists **only** in the hero (gated off past the first viewport). Every section
after it is flat type on bone. IG keeps a 3D presence continuously — it morphs, recedes and
returns as you scroll.
- **Move:** keep a persistent, low-cost WebGL field behind the whole page (not just hero) that
  **responds to scroll + the section you're in** — e.g. the clay object becomes a recurring
  "character": it drifts to a corner behind Services, dissolves to particles over Testimonials,
  reforms at the footer. One mesh, re-posed per section via ScrollTrigger.
- **Cheaper alt:** a full-bleed shader gradient/noise field (the plasma you already wrote)
  living at very low opacity site-wide, its hue/turbulence driven by `scroll` + `velocity`.
- Target: the canvas should never be fully idle/empty between hero and footer.

### 2. Nothing is scroll-scrubbed or pinned (P0)
Confirmed in code: **no `scrub`, no `pin`** anywhere. Reveals autoplay on enter (expo.out,
stagger .06) — good, but IG's defining feel is *scroll position drives a timeline*, not
*scroll triggers an animation*.
- **Move:** add **one signature pinned, scrubbed moment.** Strongest candidate: pin the
  hero clay (or a dedicated section) and **scrub its rotation/unfold/material** across ~150vh,
  with the headline counter-moving. Second candidate: a **horizontal work gallery** that
  scrubs sideways while pinned.
- Use `ScrollTrigger` with `scrub: 1` (1s catch-up for that weighty IG feel), `pin: true`,
  `anticipatePin: 1`.

### 3. No post-processing depth (P0/P1)
Only a CSS radial vignette + grain. IG's cinematic look is **EffectComposer**: subtle bloom on
highlights, depth-of-field, a touch of chromatic aberration at the edges, film grain unified
into the 3D pass.
- **Move:** add `EffectComposer` to the hero (and any 3D moment): `UnrealBloomPass`
  (strength ~0.25–0.4 on the bone palette — keep it whisper-subtle), a light `BokehPass` or
  cheap DOF, and `±0.5px` chromatic aberration. Move grain into the composer so it sits on the
  3D too. **Caution:** on a near-white palette bloom blows out fast — tune low, gate by luminance.

### 4. Work media are empty placeholders (P0 for perceived quality)
The work cards show striped wells with `[ aurora_systems.mp4 — replace ]`. Even as samples they
read as unfinished, and IG *lives* on rich motion media.
- **Move (no real assets needed yet):** make each placeholder a **living surface** — a per-project
  WebGL/shader swatch (use the project's signal hex), or an animated gradient/noise loop, with
  **hover-scrub** (cursor position scrubs the loop) and a reveal-on-scroll **scale-from-1.08**.
  The DissolvePreview on the work index already proves the pattern — extend it to the home cards.

### 5. Static content sections (P1)
Services / Testimonials / Tech-stack are pure type. At rest the **Services cards look empty**
(the benefit blurb only appears on hover — see screenshot), and Tech-stack is a plain 4-col list.
- **Moves:**
  - Services: show a one-line teaser at rest (don't hide all detail behind hover); add a small
    per-card visual anchor (icon-glyph in motion, or a shared cursor-reactive line).
  - Testimonials: scrub the quotes in line-by-line; consider a slow auto-marquee on the clients
    strip.
  - Give at least one of these sections a **3D/visual anchor** so the mid-page isn't wall-of-text.

### 6. Tech-stack collides with the dark-zone dissolve (P1 — bug-ish)
Observed at the footer: the **Tech-stack section gets caught in the plasma dark-zone dissolve**
and dims/blurs to near-illegible before the footer. Either re-sequence so it fully clears the
viewport before the dark zone begins, or **make Tech-stack a deliberate dark-zone feature**
(invert it to bone-on-void and let the plasma be its backdrop) — the latter would be very IG.

### 7. Transition dissolve peaks too bright (P1 — carry-over)
The plasma cover saturates/brightens mid-transition (also noted in audit I). Tune the shader's
mid-point luminance down so the takeover reads as a deepening, not a flash.

### 8. Sound is a toggle, not a signature (P1/P2)
A "Enable sound" control exists; IG uses sound as identity (UI ticks on hover/click, a low
ambient bed, a transition whoosh). Verify it's wired to real samples; if not, add a tasteful set
behind the existing toggle (respect autoplay policies + reduced-motion).

### 9. Loader isn't yet a moment (P1)
The loader lifts cleanly but I didn't see real progress/branding. IG loaders are a beat:
a counter or a drawing wordmark, then a reveal that hands off into the hero. Verify/upgrade.

### 10. Performance & a11y discipline (P1/P2)
No offscreen-pause, adaptive quality, or FPS lock; per-page metadata/OG still missing (shared
with the sell audit). For an effects-heavy site these are table stakes before launch:
- Pause the rAF/render when the tab is hidden and when no 3D is on-screen.
- Drop pixel-ratio / disable post-fx under a measured FPS floor.
- Keep the reduced-motion path (already good) covering any new scrubbed moments.

### 11. Cursor-reactive light + warm dark-zone glow (P2 — carry-over from IG #12)
Add a light that follows the cursor in the 3D scene, and a warm glow in the dark footer zone, so
the dark sections feel lit rather than flat black.

---

## Prioritised roadmap

**P0 — make it feel like a world (do first):**
1. Persistent, scroll-reactive WebGL presence beyond the hero (the recurring object *or* the
   site-wide low-opacity shader field).
2. One signature **pinned + scrubbed** moment (clay unfold, or horizontal work gallery).
3. EffectComposer cinematic pass (subtle bloom + DOF + CA + unified grain), luminance-gated.
4. Living work media (shader/gradient surfaces + hover-scrub + scale-reveal) replacing the
   empty striped wells.

**P1 — depth, continuity, polish:**
5. Make the content sections move with scroll (scrubbed reveals; Services rest-state teaser;
   a visual anchor mid-page).
6. Fix the Tech-stack ↔ dark-zone collision (re-sequence or make it a dark-zone feature).
7. Tune the transition dissolve mid-luminance down.
8. Loader as a branded, progress-driven moment.
9. Performance pass (offscreen/hidden pause, adaptive quality, FPS lock) + per-page metadata/OG.

**P2 — signature & delight:**
10. Real UI sound design + ambient bed behind the toggle.
11. Cursor-reactive scene light + warm dark-zone glow.
12. A draggable/throwable 3D object (the clay as a toy) + a personal easter egg.

**Definition of done:** the canvas is alive from hero to footer; at least one pinned/scrubbed
moment; cinematic post-fx on all 3D; no empty placeholder wells; `tsc` + `next build` green;
0 console errors across all routes at 1440 + 390; reduced-motion still shows all content; FPS
stays ≥ ~50 on a mid laptop.

---

## Run it with the loop

> Paste this after `/loop` to work the roadmap autonomously (self-verifies in a browser, keeps
> the build green), same as the first IG loop:

```
/loop Elevate this site to Immersive-Garden tier by working through
.handoff/IMMERSIVE-GARDEN-AUDIT-2.md (P0 → P1 → P2), one highest-impact item per iteration.
Track progress in .handoff/IG2-PROGRESS.md (create it from the roadmap on the first pass; tick
items, note what changed + the timing/scale you chose). A dev server is usually already running
on :3000 — reuse it; only start one if none responds. Verify every change visually with
Playwright at 1440 and 390 (screenshot, then actually read the screenshot), and confirm 0
console/page errors. Keep the established design language (bone/ink palette, the type roles, the
ease vocabulary in src/lib/ease.ts, the single master rAF loop + useTick in ExperienceProvider —
do NOT add competing rAF loops; register 3D/scroll work through the existing tick). New 3D goes
through WebGLCanvas; scrubbed/pinned motion via GSAP ScrollTrigger with scrub+pin. Keep all
post-processing whisper-subtle on the near-white palette (luminance-gate bloom). Respect
prefers-reduced-motion for every new scrubbed moment. After each item: npx tsc --noEmit + npm
run build must pass. Don't churn files the user is actively editing — read fresh before editing,
keep changes surgical. Stop when P0+P1 are done and summarise; flag anything needing a real
decision from me (e.g. how literal the recurring-3D "character" should be, sound assets).
```

---

## Notes
- Captured against the live dev server on :3000; screenshots in the session scratchpad as
  `ig_<section>_<viewport>.png`.
- Playwright is currently present in `node_modules` (visual-verification tool only) — fine to keep
  for the loop; remove at loop end if you want a lean install.
- Items 9 (metadata/OG) and the perf pass overlap with `BRAND-SELL-AUDIT.md` P1 — do them once.
