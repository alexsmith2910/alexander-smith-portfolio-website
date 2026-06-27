# Audit — closing the gap to Immersive Garden

A visual + technical audit of the current build, benchmarked against the quality bar of
[Immersive Garden](https://immersive-g.com) (IG). Captured by driving the live site in a
headless browser across pages, scroll states, hover/menu interactions, and viewports
(390 / 1440 / 2560).

The site is already in good shape — coherent art direction, a real WebGL layer, smooth
scroll, a custom cursor, ink page transitions, and a clean type system. The gap to IG is
**not** missing features; it's **refinement, choreography, and depth**: motion that feels
authored frame-by-frame, type that performs, 3D that's art-directed (not decorative), and
transitions that feel continuous rather than "covered and swapped".

---

## 1. What defines the Immersive Garden bar

These are the hallmarks to design toward:

1. **Authored motion.** A tiny, consistent ease vocabulary (mostly `expo`-style), slow and
   weighted, with everything choreographed — nothing uses a default ease or a linear lerp.
2. **Scroll as the timeline.** Velocity-driven skew/scale on type and media, multi-layer
   parallax with real depth, pinned/scrubbed moments, the occasional horizontal break.
3. **Type that performs.** Masked line *and* character reveals, optical sizing, tight
   display tracking, kinetic weight/scale shifts, text that reacts to scroll and cursor.
4. **3D with intent.** A single, art-directed focal scene (custom shaders — matcap /
   iridescent / refraction, GPGPU particles), post-processing (bloom, grain-as-shader,
   vignette, subtle chromatic aberration), never colliding with copy.
5. **Continuous transitions.** Page changes feel like one camera move / fluid dissolve, not
   a slab wipe. Media hover uses real WebGL displacement between textures.
6. **A morphing cursor + micro-interactions** everywhere, with inertia and contextual states.
7. **Restrained, tasteful sound design** (ambient bed + UI accents) behind a toggle.
8. **60fps, always.** Heavy work is gated, throttled, and paused offscreen.

---

## 2. Findings by category

### A. Motion & timing  — *biggest lever*
- **Current:** one ease (`cubic-bezier(.22,1,.36,1)`), reveals are a flat `opacity 0→1 + y56`
  over ~1s, menu reveal ~1.05s, ink transition a 0.6s slab. Solid but uniform and a little
  flat — everything moves the same way.
- **Improve:**
  - Adopt a named ease set: `expo.out cubic-bezier(0.16,1,0.3,1)` (entrances),
    `expo.inOut cubic-bezier(0.87,0,0.13,1)` (transitions/clip), keep the current curve for
    micro only.
  - Reveals: replace fade-up with **clip-path inset wipes + y + a hair of scale** (1.04→1),
    staggered; durations 0.9–1.3s; stagger 0.06–0.09s.
  - Add **scroll-velocity skew**: skewY on headings/media proportional to scroll velocity
    (clamp ±5–6°, eased back to 0). This single touch reads as "IG".
  - Hero: go finer than lines — **word- or char-level masked stagger**.

### B. Scroll choreography
- **Current:** Lenis smooth scroll + per-element reveal triggers; one parallax pass was
  removed. Sections are static blocks.
- **Improve:** multi-layer **parallax depth** (kicker/title/media on different speeds);
  one **pinned, scrubbed** moment per long page (e.g. case-study flagship); consider a
  **horizontal scroll** band for the gallery; scrub the hero 3D to scroll progress.

### C. Typography
- **Current:** Instrument Serif / Space Grotesk / Space Mono, good hierarchy. Hero is
  132px at 1440. Reads well.
- **Improve:** introduce a **fluid type scale** as tokens; tighten display tracking
  (-0.03→-0.04em) and drop display line-height to ~0.9; enable serif **optical sizing**;
  add **kinetic emphasis** (the italic clause scales/weights in on reveal); balance ragged
  lines with `text-wrap: balance` on leads. Consider a variable grotesk to animate weight.

### D. Scale & responsive
- **Desktop:** clay shapes scale now — good. **But the 3D collides with copy** in the
  home "selected work" section (a torus/knot floats over the *Aurora Systems* title — see
  `home_work1`). Art-direct the scene so 3D never sits behind text, or mask/parallax it away.
- **Case study:** the top-right media meta tag (e.g. `INTERACTION`) **collides with the nav
  hamburger** (see `case_gallery`). Reserve a safe zone under the nav.
- **Mobile (390):** hero is fine but the 100vh-centered headers leave **large empty bands**;
  clay peeks half-clipped on the right. Cap header min-height on small screens, tighten
  vertical rhythm, and reposition/scale the 3D for portrait.

### E. Colour & light
- **Current:** disciplined bone/ink/void + violet plasma. Strong.
- **Improve:** let the plasma/light **respond to cursor** subtly; add a faint warm vignette
  + bloom in the dark zones; keep the single-accent rule (don't add UI colour).

### F. WebGL / shaders / 3D
- **Current:** clay = `MeshStandardMaterial` primitives; plasma = nice custom fragment
  shader (footer dissolve). CSS grain overlay separate from the GL.
- **Improve:** give the hero **one art-directed focal object** with a custom material
  (matcap / iridescent / soft refraction) and gentle GPGPU or instanced particles that
  react to cursor + scroll; add **post-processing** (subtle bloom, vignette, film-grain *in
  the shader* so grain is unified, optional chromatic aberration on transitions); ensure
  depth so it never competes with type.

### G. Page transitions
- **Current:** ink slab wipe (cover → swap → reveal). Functional, a touch generic.
- **Improve:** make it **continuous** — e.g. outgoing content scales/blurs back as a
  flow-map/curtain reveals the next page's hero already animating in; or a single GL dissolve.
  At minimum: refine easing, add outgoing scale(0.96)+blur, and reveal the new hero *under*
  the cover so it's mid-entrance when uncovered.

### H. Cursor & micro-interactions
- **Current:** ring + dot + label, grows on interactives. Good base.
- **Improve:** **morph** the cursor per context (disc + "View"/"Drag" pill over media,
  arrows on horizontal), add slight inertia trail, magnetic snapping on key CTAs; add
  hover states to list rows / nav with line-draw + char shift.

### I. Media & imagery
- **Current:** striped placeholders (intentional until real media); hover = liquid SVG
  displacement on a clipped inner layer (crisp border) — good.
- **Improve (when real media lands):** WebGL **texture displacement** hover + **video-on-hover**;
  fluid dissolve between gallery items; lazy-load + KTX2/AVIF.

### J. Sound
- **Current:** ambient drone toggle only.
- **Improve:** tasteful **UI sound design** behind the toggle — soft hover ticks, a
  transition whoosh, menu open/close swells — mixed low, reduced-motion/`muted` aware.

### K. Performance
- **Current:** fixed canvas runs continuously; reveals via ScrollTrigger; DPR capped 1.75.
- **Improve:** pause the hero scene when offscreen (IntersectionObserver), throttle to the
  display refresh, audit `will-change` usage, lazy-mount the Lab sketches, and **measure
  FPS** (target a locked 60). Verify on a mid-tier GPU.

### L. Accessibility & SEO
- **Current:** `prefers-reduced-motion` honoured, labels present, suppressHydration on body.
- **Improve:** visible `:focus-visible` rings (cursor hides the native one), a skip link,
  per-page `metadata` + OG images, alt text when media lands, keyboard paths for menu/forms.

---

## 3. Prioritised roadmap

**P0 — the "feels like IG" core (do first):**
1. Ease vocabulary + upgrade reveals to clip-wipe + scale + finer stagger.
2. Scroll-velocity skew on headings/media + multi-layer parallax.
3. Fix art-direction collisions (3D-over-text on home work; meta-tag vs nav on case study).
4. Hero type → word/char masked stagger; tighten display type tokens.

**P1 — depth & continuity:**
5. Continuous page transition (outgoing scale/blur + incoming hero pre-reveal).
6. WebGL post-processing (bloom + shader grain + vignette) and an art-directed hero object.
7. Morphing cursor states + richer row/nav micro-interactions.
8. Mobile vertical rhythm + 3D repositioning for portrait.

**P2 — richness & polish:**
9. One pinned/scrubbed moment + a horizontal gallery break.
10. Tasteful UI sound design behind the toggle.
11. Performance pass (offscreen pause, FPS lock) + a11y/SEO pass.
12. Cursor-reactive light; warm vignette in dark zones.

---

## 4. Concrete spec starting points

- Eases: `--ease-out: cubic-bezier(0.16,1,0.3,1); --ease-inout: cubic-bezier(0.87,0,0.13,1);`
- Reveal: `clip-path inset(0 0 100% 0)→inset(0)`, `y: 40→0`, `scale: 1.04→1`,
  `duration 1.1`, `ease-out`, `stagger 0.07`.
- Skew: `skewY = clamp(velocity * 0.0009, -5deg, 5deg)`, lerp back at 0.1.
- Display type: `letter-spacing: -0.035em; line-height: 0.9;` tokenise a fluid scale.
- Transition: cover `0.7 ease-inout`; outgoing `scale .96 + blur 6px`; incoming hero starts
  at +0.15s under the cover.
- Keep the build green every step: `npx tsc --noEmit` and `npm run build` must pass.

---

## 5. Implementation prompt (paste this back to me)

> Run it as a **self-paced loop** so I keep iterating until the goal is met. In Claude Code,
> type `/loop` then paste the prompt below (no interval = Claude self-paces each iteration):

```
/loop Elevate this site to Immersive-Garden-tier quality by working through
.handoff/IMMERSIVE-GARDEN-AUDIT.md. Treat that file as the spec and the roadmap
(P0 → P1 → P2). Iterate continuously and autonomously until the Definition of Done is met.

EACH ITERATION:
1. Read .handoff/IG-PROGRESS.md (create it on the first pass with the full P0–P2 checklist
   copied from the audit). Pick the single highest-impact UNCHECKED item.
2. Implement it cleanly using the existing architecture (the shared experience system in
   src/experience, the UI primitives in src/components/ui, data in src/data). Reuse the
   ease vocabulary and tokens; don't introduce new dependencies beyond gsap/lenis/three
   unless essential (note it in progress if you do).
3. VISUALLY VERIFY: ensure a dev/prod server is running, then use Playwright (install it as
   a devDep if absent: `npm i -D playwright && npx playwright install chromium`) to
   screenshot the affected pages at 1440 AND 390 (and 2560 for scale work), plus the
   relevant interaction state (hover / menu / mid-transition / scrolled). LOOK at the
   screenshots and critique them against the IG hallmarks in section 1 of the audit. If it
   doesn't clearly improve, refine before moving on.
4. Keep the build green: `npx tsc --noEmit` and `npm run build` must both pass. Honour
   prefers-reduced-motion. Keep content data-driven and DO NOT replace the sample project
   media/copy.
5. Update .handoff/IG-PROGRESS.md: check the item off, add a one-line note on what changed
   and the screenshot filename(s), and record anything deferred.
6. Continue to the next item. Reassess priority each pass — ship P0 fully before P1, P1
   before P2.

GUARDRAILS:
- Small, focused changes per iteration; never leave the build broken between iterations.
- Don't regress existing fixes (menu seamlessness, crisp media borders, no dark-flash,
  first-load loader, page transitions on all internal links).
- Prefer refinement over rebuilds. Match the design's restraint — single accent colour,
  bone/ink palette, the established type roles.
- Clean up scratch scripts; if you added Playwright only for verification, you may leave it
  as a devDep for the duration of the loop and remove it at the end.

DEFINITION OF DONE (stop the loop when all are true):
- All P0 and P1 items are checked off in IG-PROGRESS.md with verifying screenshots.
- Motion uses the authored ease set; reveals are clip-wipe + scale + staggered; headings/
  media respond to scroll velocity; hero type does a word/char masked reveal.
- No art-direction collisions (3D never sits behind copy; no meta/nav overlap); mobile
  vertical rhythm is tight.
- Page transitions feel continuous; cursor morphs per context.
- tsc + build pass; reduced-motion verified; no console/page errors in the browser check.
- Post a final summary of what changed, before/after screenshots, and any P2 items left.
```

> Tip: you can also scope it — e.g. `/loop … focus only on P0 motion + typography first`,
> review, then resume with `/loop … continue with P1`.
