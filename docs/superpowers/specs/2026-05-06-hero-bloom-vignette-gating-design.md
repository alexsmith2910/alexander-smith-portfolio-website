# Hero Bloom — Vignette Gating Design

## Summary

Constrain the hero's cursor-driven effects (the green roaming bloom, the grid tilt, and the bloom's velocity stretch / blob merge) so they only respond to the mouse while the cursor is inside the visible-grid vignette. As the cursor approaches the faded edge of the vignette, all cursor-driven effects smoothly disengage and the bloom returns to the hero's center, where it continues its existing ambient idle wander. As the user scrolls past the hero, the bloom rides upward with the section and disengages from the cursor entirely.

The effect should feel like the bloom belongs to the visible grid: it lives inside the bright oval, ignores the cursor when it's over edge UI (navbar, logo, "currently building" chip, tag/meta columns), and is bound to the hero section both spatially and structurally.

## Goals

- The bloom only follows the mouse when the cursor is inside the visible part of the grid vignette.
- Outside the vignette, the bloom rests at the hero's center and continues its existing ambient drift.
- Grid tilt disengages in lockstep with the bloom — when the bloom stops chasing, the grid relaxes to flat.
- When the user scrolls past the hero, the bloom rides up with the section and is fully disengaged before the hero is gone.
- Transitions in and out of the vignette are smooth, not abrupt — no teleport, no hard cut.
- Reduced-motion, touch, and no-hover behavior remains identical to today (the whole effect stays disabled in those cases).

## Non-goals

- No HTML or CSS structural changes. The CSS custom properties consumed by `index.astro` (`--bloom-x`, `--bloom-y`, `--bloom-sx`, `--bloom-sy`, `--blob-spread`, `--mx`, `--my`) keep the same names and meanings — only the values written to them change.
- No new visual effects. This work scopes existing behavior; it does not introduce new motion.
- No site-wide cursor system. The effect remains hero-only and there is no plan to extend it to other sections.

## Architecture

### One concept: a follow `weight`

A continuous value, `0.0` to `1.0`, that determines how much the cursor effects follow the mouse on a given frame.

- `weight = 1.0` → cursor effects fully track the mouse (today's behavior).
- `weight = 0.0` → cursor effects ignore the mouse; bloom rests at hero center with idle wander; grid is flat.
- In between → blended.

`weight` is the product of two independent factors:

1. **`vignetteWeight`** — derived from the cursor's position relative to the visible-grid ellipse.
2. **`heroVisibilityWeight`** — derived from how much of the hero is on screen.

```
weight = vignetteWeight * heroVisibilityWeight
```

Either factor reaching 0 disengages the cursor follow entirely.

### `vignetteWeight` — cursor position relative to the ellipse

The visible-grid ellipse is defined by the existing CSS mask in `src/pages/index.astro`:

```css
mask-image: radial-gradient(ellipse 70% 60% at 50% 48%, black 0%, black 28%, transparent 82%);
```

The mask is fully transparent at `82%` of its ending shape (`70% × 60%`), giving an effective visible ellipse with:

- **Center:** 50% horizontal, 48% vertical of the `.page__grid` element.
- **Horizontal radius:** `0.82 × 0.70 = 0.574` of the grid element's width.
- **Vertical radius:** `0.82 × 0.60 = 0.492` of the grid element's height.

On each frame, compute the cursor's normalized elliptical distance from the ellipse center:

```
d = sqrt((dx / rx)^2 + (dy / ry)^2)
```

Where `dx`, `dy` are the cursor's offset from the ellipse center (in viewport coordinates) and `rx`, `ry` are the ellipse radii in pixels.

Map `d` to weight using a smoothstep falloff:

- `d ≤ 0.5` → `vignetteWeight = 1.0` (full follow inside the inner half of the ellipse).
- `0.5 < d < 1.0` → `vignetteWeight = smoothstep(1.0, 0.5, d)` (smooth blend from full follow to no follow as cursor approaches the visible edge).
- `d ≥ 1.0` → `vignetteWeight = 0.0` (no follow outside the visible ellipse).

The inner-half full-follow region is a deliberate design choice: it gives the bloom a confident "stays with you" feel near the center of the hero and gracefully lets go as the cursor drifts toward edge UI.

### `heroVisibilityWeight` — scroll-out fade

On each frame, read the hero section's `getBoundingClientRect()` (the `.stage` element, or equivalent — see Open questions) and compute the fraction of the hero currently visible in the viewport:

- Fully in view → `heroVisibilityWeight = 1.0`.
- Partly scrolled out → linear ramp toward 0 as the hero leaves view.
- Fully scrolled out → `heroVisibilityWeight = 0.0`.

The bloom's "home" position (the ellipse center used as the rest target when `weight = 0`) is read from the **grid element's** bounding rect, not the hero section's. This keeps the bloom's home anchored to the visible oval rather than to the broader section. As the user scrolls, the grid rect translates upward, so the bloom's home rides up with it. By the time the hero section is fully offscreen, the grid is offscreen too — the bloom is both at an offscreen position *and* fully disengaged from the cursor.

### What `weight` is applied to

Today's behavior modified by `weight`:

- **Bloom target position:** `lerp(heroCenter + idleWanderOffset, mousePos, weight)`. When weight = 1, target = mouse. When weight = 0, target = hero center plus the existing sin/cos idle drift.
- **Idle wander amplitude:** scaled by `(1 - weight)`. Inside the vignette the bloom doesn't drift unnecessarily; outside it wanders freely.
- **Grid tilt (`--mx`, `--my`):** multiplied by `weight` so the grid relaxes to flat as the bloom disengages.
- **Velocity stretch (`--bloom-sx`, `--bloom-sy`) and blob merge (`--blob-spread`):** computed from the bloom's lerp delta as today. Because the bloom stops chasing the cursor when weight drops, these calm down on their own — no extra gating needed.

### What does not change

- The CSS custom properties consumed by `.page__grid` and `.page__bloom` keep the same names and value ranges.
- The reduced-motion, touch, and no-hover guards stay as they are. The entire effect is disabled in those environments.
- The lerp rates, idle-wander timing, velocity-stretch tuning, and blob-merge tuning are preserved as today's defaults. (Only the *targets* fed into the existing smoothing are changed.)

## Components

### `src/lib/interactive-bg.ts` (modified)

The single file that owns this behavior. Today it tracks the cursor and writes CSS variables. The modified version adds:

- **Element references:** look up the grid element (`.page__grid`) and the hero section element (`.stage`) once on init, with sensible fallbacks if either is missing (see Edge cases).
- **Per-frame ellipse geometry computation:** in `tick()`, read the grid element's bounding rect and derive the ellipse center and radii in viewport coordinates.
- **`vignetteWeight` computation:** the smoothstep falloff described above, using the cursor's normalized elliptical distance from the ellipse center.
- **`heroVisibilityWeight` computation:** ramp from the hero section's bounding rect.
- **Combined `weight` and target blending:** apply `weight` when computing the bloom target, idle wander amplitude, and grid tilt.

### Files NOT modified

- `src/pages/index.astro` — no markup or CSS changes.
- `src/components/Hero.astro` — no markup or CSS changes.
- `src/styles/global.css` — no token or rule changes.

## Behavior summary

- **Cursor inside the bright/visible part of the grid:** bloom follows the cursor as today.
- **Cursor drifting toward the faded edge:** bloom slows, stops tracking, and gently drifts back toward center. Transition is smooth, not abrupt.
- **Cursor over edge UI (navbar, logo, chip, tag/meta columns, corners):** bloom rests at hero center with ambient drift; grid is flat.
- **Cursor moving back into the visible grid:** bloom smoothly catches up to the cursor — no teleport.
- **Grid tilt:** moves in lockstep with the bloom — same engagement and disengagement.
- **Scrolling past the hero:** bloom rides upward with the section, disengages from cursor as the hero leaves view, and is fully gone by the time the hero is offscreen.
- **Reduced motion / touch / no-hover:** entire effect stays disabled.

## Edge cases

- **Window resize:** ellipse geometry is recomputed each frame from the hero's bounding rect, so the boundary always matches the current layout. The existing resize handler stays.
- **First page load:** bloom starts at the hero's center (same as today's `mouseX = innerWidth/2; mouseY = innerHeight*0.6`, which already approximates this).
- **Cursor outside the browser window:** the cursor's last known position falls outside the ellipse if the cursor exited near an edge — bloom naturally returns to center. No special handling needed.
- **Element not yet laid out on first frame:** if either bounding rect returns zero-size on the first tick (very unlikely with Astro's sync rendering), the bloom uses sane defaults (viewport center, viewport-sized ellipse) for one frame; the next frame self-corrects.
- **Grid or hero element missing (defensive):** if either selector resolves to null, the script falls back to viewport-based geometry. With a missing hero, `heroVisibilityWeight` defaults to 1 (always visible). With a missing grid, the ellipse falls back to viewport-centered with viewport-derived radii. In both fallback cases the behavior degrades gracefully — closer to today's "always engaged" behavior — rather than crashing.

## Risks

- **Smoothstep curve tuning:** the choice of inner-50% full-follow boundary is a design call. If it feels too "loose" (bloom lets go too early), the boundary can be tightened (e.g., inner 65–70% full follow) without architectural change.
- **Per-frame `getBoundingClientRect()`:** called once per `requestAnimationFrame`, this is cheap on a single element but worth noting. If profiling shows it as a bottleneck, the result can be cached and refreshed only on resize and scroll.
- **Hero element selector coupling:** the script becomes mildly coupled to the existence of the hero element. The defensive fallback (Edge cases) keeps this robust.

## Open questions

- **Element selectors:** which selectors should `interactive-bg.ts` use? Two elements are needed: the grid element (currently `.page__grid`) for ellipse geometry, and the hero section element (currently `.stage`) for the visibility ramp. Options: use the existing class names directly, or introduce data attributes (`data-cursor-vignette`, `data-cursor-section`) to decouple the script from class-name churn. The data-attribute approach is more decoupled but adds two markup edits. Recommend deciding during implementation.

## Out of scope / future work

- Extending the effect to other sections (case studies, footer). If desired later, the `data-cursor-region` approach generalizes cleanly: any element with that attribute could host its own gated bloom region.
- Theme-aware bloom color or shape changes.
- Touch-device alternatives (e.g., a tap-to-pulse interaction). Currently disabled; no change planned here.
