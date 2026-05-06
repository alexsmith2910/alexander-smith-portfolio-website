# Hero Bloom — Vignette Gating Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Constrain the hero's cursor-driven effects (the green roaming bloom, the grid tilt, the velocity stretch, the blob merge) to follow the mouse only inside the visible-grid vignette ellipse and only while the hero section is on screen. Smoothly disengage at the edge of the vignette and as the section scrolls out — and smoothly re-engage on entry.

**Architecture:** Compute a continuous `weight` per animation frame as `vignetteWeight × heroVisibilityWeight`. Blend the bloom's target position between the visible-grid ellipse center (with a slow ambient wander) when `weight = 0` and the cursor when `weight = 1`. Multiply grid tilt by `weight` so the grid relaxes to flat in lockstep. Velocity stretch and blob merge are computed from the bloom's own delta, so they calm down naturally when the bloom stops chasing. All work in `src/lib/interactive-bg.ts`.

**Tech Stack:** TypeScript (strict), Astro, vanilla DOM + `requestAnimationFrame`. No test framework in this repo — verification is `pnpm check` (Astro/TS check) plus manual visual checks in `pnpm dev`.

**Source spec:** `docs/superpowers/specs/2026-05-06-hero-bloom-vignette-gating-design.md`

---

## File structure

- **Modify:** `src/lib/interactive-bg.ts` (the only file that changes)

No HTML, CSS, or component changes. The CSS custom properties consumed by `src/pages/index.astro` keep the same names and ranges.

This project is **not a git repository** (`Is a git repository: false` in the environment). Tasks therefore end with a `pnpm check` gate and, where applicable, a manual visual verification in `pnpm dev` — not a `git commit`. If the engineer chooses to initialize a repo first, they can add commits at the end of each task using a message of the form `feat(bloom): <task summary>`.

---

## Quick reference: full target file

For orientation, this is the final shape of `src/lib/interactive-bg.ts` after all tasks. Each task below builds toward this incrementally — do **not** paste this block in one go; follow the steps so each intermediate state still type-checks and runs.

```ts
// Interactive background — cursor-driven grid tilt + roaming, deforming bloom,
// gated to the visible-grid vignette of the hero section.
//
// Drives these CSS custom properties on <html>:
//   --mx, --my        : grid tilt, normalized roughly -0.5..0.5 and scaled by
//                       the active follow weight (0 outside the vignette → flat)
//   --bloom-x, -y     : bloom centre in px
//   --bloom-sx, -sy   : bloom scale factors (axis-aligned velocity stretch)
//   --blob-spread     : 0..1 multiplier on blob keyframe translates.
//
// Behaviours layered together:
//   1. Follow weight — a continuous 0..1 value computed each frame as
//      vignetteWeight × heroVisibilityWeight. Says how much the cursor
//      effects should track the mouse on a given frame.
//   2. Lerped cursor follow — when weight = 1, bloom lags the cursor; when
//      weight = 0, bloom rests at the ellipse centre with a slow sin/cos
//      wander. Blended by weight in between.
//   3. Velocity stretch — horizontal velocity stretches scaleX, vertical
//      velocity stretches scaleY. Computed from the bloom's lerp delta, so
//      it naturally calms when the bloom stops chasing the cursor.
//   4. Velocity merge — high speed pulls the blobs into the centre of the
//      container (asymmetric lerp: snappy on compress, gentle on expand).
//
// Disabled on touch devices (no hover) and under prefers-reduced-motion.

// ---------- Pure helpers ----------

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function normalizedEllipseDistance(
  px: number,
  py: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): number {
  if (rx <= 0 || ry <= 0) return 0;
  const dx = (px - cx) / rx;
  const dy = (py - cy) / ry;
  return Math.hypot(dx, dy);
}

// 1.0 inside the inner half of the ellipse, smoothsteps to 0 at the visible edge.
function vignetteWeight(d: number): number {
  return 1 - smoothstep(0.5, 1.0, d);
}

// 1.0 when the section is fully in view, ramps linearly to 0 as it leaves.
function heroVisibilityWeight(rect: DOMRect, viewportHeight: number): number {
  if (rect.height <= 0) return 1;
  const visibleTop = Math.max(0, rect.top);
  const visibleBottom = Math.min(viewportHeight, rect.bottom);
  const visibleHeight = Math.max(0, visibleBottom - visibleTop);
  return clamp01(visibleHeight / rect.height);
}

// ---------- Mask geometry constants ----------
// Mirrors src/pages/index.astro's `.page__grid` mask:
//   radial-gradient(ellipse 70% 60% at 50% 48%, ..., transparent at 82%).
// The visible-edge radii are 0.82 * 0.70 = 0.574 of width and 0.82 * 0.60 = 0.492 of height.
const ELLIPSE_CENTER_X = 0.5;
const ELLIPSE_CENTER_Y = 0.48;
const ELLIPSE_RADIUS_X = 0.574;
const ELLIPSE_RADIUS_Y = 0.492;
const WANDER_RADIUS_PX = 110;
const LERP_RATE_DISENGAGED = 0.035;
const LERP_RATE_ENGAGED = 0.06;

// ---------- Module state ----------

const root = document.documentElement;

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight * 0.6;
let lerpX = mouseX;
let lerpY = mouseY;
let prevX = mouseX;
let prevY = mouseY;
let tiltX = 0;
let tiltY = 0;
let smoothSx = 1;
let smoothSy = 1;
let blobSpread = 1;

let gridEl: HTMLElement | null = null;
let stageEl: HTMLElement | null = null;

// Read the visible-grid ellipse geometry in viewport coordinates.
// Falls back to viewport-derived geometry if the grid element is missing or
// not yet laid out, so the script never crashes mid-frame.
function readEllipseGeometry() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (gridEl) {
    const rect = gridEl.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return {
        cx: rect.left + rect.width * ELLIPSE_CENTER_X,
        cy: rect.top + rect.height * ELLIPSE_CENTER_Y,
        rx: rect.width * ELLIPSE_RADIUS_X,
        ry: rect.height * ELLIPSE_RADIUS_Y,
      };
    }
  }
  return {
    cx: w * ELLIPSE_CENTER_X,
    cy: h * ELLIPSE_CENTER_Y,
    rx: w * ELLIPSE_RADIUS_X,
    ry: h * ELLIPSE_RADIUS_Y,
  };
}

// ---------- Handlers ----------

const onMove = (e: MouseEvent) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
};

const onResize = () => {
  mouseX = Math.min(mouseX, window.innerWidth);
  mouseY = Math.min(mouseY, window.innerHeight);
};

// ---------- Tick ----------

const tick = () => {
  const now = performance.now();
  const ellipse = readEllipseGeometry();
  const viewportH = window.innerHeight;
  const stageRect = stageEl ? stageEl.getBoundingClientRect() : null;

  // ---- Compute follow weight (0..1).
  const d = normalizedEllipseDistance(
    mouseX,
    mouseY,
    ellipse.cx,
    ellipse.cy,
    ellipse.rx,
    ellipse.ry,
  );
  const vWeight = vignetteWeight(d);
  const sWeight = stageRect ? heroVisibilityWeight(stageRect, viewportH) : 1;
  const weight = vWeight * sWeight;

  // ---- Wander amplitude scales with disengagement.
  const wanderAmp = (1 - weight) * WANDER_RADIUS_PX;
  const t = now * 0.001;
  const wanderX = Math.cos(t * 0.45) * wanderAmp;
  const wanderY = Math.sin(t * 0.65) * wanderAmp;

  // ---- Centre home (ellipse centre + wander) blended toward cursor by weight.
  const centerX = ellipse.cx + wanderX;
  const centerY = ellipse.cy + wanderY;
  const targetX = centerX + (mouseX - centerX) * weight;
  const targetY = centerY + (mouseY - centerY) * weight;

  // ---- Smooth toward target. Faster when engaged (snappy follow), slower when
  //      disengaged (ambient drift).
  const lerpRate =
    LERP_RATE_DISENGAGED + (LERP_RATE_ENGAGED - LERP_RATE_DISENGAGED) * weight;
  lerpX += (targetX - lerpX) * lerpRate;
  lerpY += (targetY - lerpY) * lerpRate;

  // ---- Velocity stretch derived from the bloom's delta. Naturally calms
  //      when weight drops because the bloom stops chasing.
  const vx = lerpX - prevX;
  const vy = lerpY - prevY;
  const speed = Math.hypot(vx, vy);
  const targetSx = 1 + Math.min(Math.abs(vx) * 0.022, 0.45);
  const targetSy = 1 + Math.min(Math.abs(vy) * 0.022, 0.45);
  smoothSx += (targetSx - smoothSx) * 0.12;
  smoothSy += (targetSy - smoothSy) * 0.12;

  // ---- Blob merge under bloom velocity.
  const spreadTarget = Math.max(0, 1 - speed * 0.06);
  const spreadRate = spreadTarget < blobSpread ? 0.22 : 0.04;
  blobSpread += (spreadTarget - blobSpread) * spreadRate;

  // ---- Grid tilt — scaled by weight so the grid relaxes when the bloom does.
  const ntx = (mouseX / window.innerWidth - 0.5) * weight;
  const nty = (mouseY / window.innerHeight - 0.5) * weight;
  tiltX += (ntx - tiltX) * 0.05;
  tiltY += (nty - tiltY) * 0.05;

  root.style.setProperty("--bloom-x", `${lerpX.toFixed(2)}px`);
  root.style.setProperty("--bloom-y", `${lerpY.toFixed(2)}px`);
  root.style.setProperty("--bloom-sx", smoothSx.toFixed(3));
  root.style.setProperty("--bloom-sy", smoothSy.toFixed(3));
  root.style.setProperty("--blob-spread", blobSpread.toFixed(3));
  root.style.setProperty("--mx", tiltX.toFixed(3));
  root.style.setProperty("--my", tiltY.toFixed(3));

  prevX = lerpX;
  prevY = lerpY;

  requestAnimationFrame(tick);
};

// ---------- Setup ----------

const hasHover = window.matchMedia("(hover: hover)").matches;
const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

if (hasHover && !reducedMotion) {
  gridEl = document.querySelector<HTMLElement>(".page__grid");
  stageEl = document.querySelector<HTMLElement>(".stage");
  window.addEventListener("mousemove", onMove, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  requestAnimationFrame(tick);
}
```

---

## Task 1: Add pure math helpers

**Files:**
- Modify: `src/lib/interactive-bg.ts` (top of file, immediately under the leading comment block, before `const root = document.documentElement;`)

These four functions are pure, deterministic, and take no DOM input. They're the foundation for everything else.

- [ ] **Step 1: Open `src/lib/interactive-bg.ts` and locate the insertion point.**

The current file starts with a leading comment block (lines 1–22) followed by `const root = document.documentElement;` on line 24. Insert the helpers between them.

- [ ] **Step 2: Insert the helpers above `const root = ...`.**

Add this block immediately before `const root = document.documentElement;`:

```ts
// ---------- Pure helpers ----------

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function normalizedEllipseDistance(
  px: number,
  py: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): number {
  if (rx <= 0 || ry <= 0) return 0;
  const dx = (px - cx) / rx;
  const dy = (py - cy) / ry;
  return Math.hypot(dx, dy);
}

// 1.0 inside the inner half of the ellipse, smoothsteps to 0 at the visible edge.
function vignetteWeight(d: number): number {
  return 1 - smoothstep(0.5, 1.0, d);
}

// 1.0 when the section is fully in view, ramps linearly to 0 as it leaves.
function heroVisibilityWeight(rect: DOMRect, viewportHeight: number): number {
  if (rect.height <= 0) return 1;
  const visibleTop = Math.max(0, rect.top);
  const visibleBottom = Math.min(viewportHeight, rect.bottom);
  const visibleHeight = Math.max(0, visibleBottom - visibleTop);
  return clamp01(visibleHeight / rect.height);
}
```

- [ ] **Step 3: Run the type checker.**

Run: `pnpm check`
Expected: Zero errors. The helpers are unused at this point (TS does not flag unused module-level functions; if it does in your config, ignore — they will be wired in by Task 3).

- [ ] **Step 4: Eyeball the math.**

Skim each helper once and check:
- `clamp01(2)` → `1`, `clamp01(-1)` → `0`, `clamp01(0.5)` → `0.5`.
- `smoothstep(0, 1, 0)` → `0`, `smoothstep(0, 1, 1)` → `1`, `smoothstep(0, 1, 0.5)` → `0.5`.
- `vignetteWeight(0)` → `1` (cursor at ellipse centre).
- `vignetteWeight(0.5)` → `1` (still inside inner half).
- `vignetteWeight(1.0)` → `0` (at visible edge).
- `vignetteWeight(2)` → `0` (well outside).
- `heroVisibilityWeight({top: 0, bottom: 800, height: 800} as DOMRect, 800)` → `1`.
- `heroVisibilityWeight({top: -800, bottom: 0, height: 800} as DOMRect, 800)` → `0`.
- `heroVisibilityWeight({top: -400, bottom: 400, height: 800} as DOMRect, 800)` → `0.5`.

(No automated tests in this repo. The eyeball check is the verification.)

---

## Task 2: Add geometry constants and element references

**Files:**
- Modify: `src/lib/interactive-bg.ts`

This task captures the ellipse-mask geometry as named constants, adds a function that reads the visible-grid ellipse rect each frame, and resolves the DOM element references at script init.

- [ ] **Step 1: Add geometry constants under the helpers block.**

Insert this immediately after the helpers block from Task 1:

```ts
// ---------- Mask geometry constants ----------
// Mirrors src/pages/index.astro's `.page__grid` mask:
//   radial-gradient(ellipse 70% 60% at 50% 48%, ..., transparent at 82%).
// The visible-edge radii are 0.82 * 0.70 = 0.574 of width and 0.82 * 0.60 = 0.492 of height.
const ELLIPSE_CENTER_X = 0.5;
const ELLIPSE_CENTER_Y = 0.48;
const ELLIPSE_RADIUS_X = 0.574;
const ELLIPSE_RADIUS_Y = 0.492;
const WANDER_RADIUS_PX = 110;
const LERP_RATE_DISENGAGED = 0.035;
const LERP_RATE_ENGAGED = 0.06;
```

- [ ] **Step 2: Add the element ref declarations alongside the existing module state.**

Find the existing block:

```ts
let smoothSx = 1;
let smoothSy = 1;
let blobSpread = 1;
```

Add two new lines immediately after `let blobSpread = 1;`:

```ts
let gridEl: HTMLElement | null = null;
let stageEl: HTMLElement | null = null;
```

- [ ] **Step 3: Add `readEllipseGeometry` after the module-state block.**

Insert this between the module state and the `onMove` handler:

```ts
// Read the visible-grid ellipse geometry in viewport coordinates.
// Falls back to viewport-derived geometry if the grid element is missing or
// not yet laid out, so the script never crashes mid-frame.
function readEllipseGeometry() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (gridEl) {
    const rect = gridEl.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return {
        cx: rect.left + rect.width * ELLIPSE_CENTER_X,
        cy: rect.top + rect.height * ELLIPSE_CENTER_Y,
        rx: rect.width * ELLIPSE_RADIUS_X,
        ry: rect.height * ELLIPSE_RADIUS_Y,
      };
    }
  }
  return {
    cx: w * ELLIPSE_CENTER_X,
    cy: h * ELLIPSE_CENTER_Y,
    rx: w * ELLIPSE_RADIUS_X,
    ry: h * ELLIPSE_RADIUS_Y,
  };
}
```

- [ ] **Step 4: Resolve the elements inside the existing `if (hasHover && !reducedMotion)` block.**

Find the block at the bottom of the file:

```ts
if (hasHover && !reducedMotion) {
  window.addEventListener("mousemove", onMove, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  requestAnimationFrame(tick);
}
```

Modify it so element resolution happens before the listeners are attached:

```ts
if (hasHover && !reducedMotion) {
  gridEl = document.querySelector<HTMLElement>(".page__grid");
  stageEl = document.querySelector<HTMLElement>(".stage");
  window.addEventListener("mousemove", onMove, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  requestAnimationFrame(tick);
}
```

- [ ] **Step 5: Run the type checker.**

Run: `pnpm check`
Expected: Zero errors. `gridEl`, `stageEl`, `readEllipseGeometry`, and the constants are all referenced from later tasks but TS does not flag this because the file is a top-level script module.

- [ ] **Step 6: Run dev server briefly to confirm nothing broke.**

Run: `pnpm dev`
Open: `http://localhost:4321` (or whatever Astro reports).
Expected: Page renders identically to before — bloom still follows the cursor, grid still tilts. Behavior is unchanged at this point because the new code is not yet wired into `tick()`.
Stop the dev server.

---

## Task 3: Apply vignette gating + idle wander to the bloom

**Files:**
- Modify: `src/lib/interactive-bg.ts` — replace the body of `tick()`

This task is the heart of the change. The existing `tick()` is replaced wholesale. Two existing concepts are removed because they are subsumed by the new design: the `lastMoveTime` / `idle` 700ms gate and the variable `lerpRate` that depended on it. The new `weight`-driven wander and `weight`-driven `lerpRate` give equivalent (better) ambient behavior.

- [ ] **Step 1: Remove the `lastMoveTime` declaration and its usage in `onMove`.**

Find this declaration in the module-state block:

```ts
let lastMoveTime = performance.now();
```

Delete the line.

Then find:

```ts
const onMove = (e: MouseEvent) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  lastMoveTime = performance.now();
};
```

Replace with:

```ts
const onMove = (e: MouseEvent) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
};
```

- [ ] **Step 2: Replace the body of `tick()`.**

Find the entire `tick` function — from `const tick = () => {` down to and including `requestAnimationFrame(tick);` and the closing `};`.

Replace the entire function with:

```ts
const tick = () => {
  const now = performance.now();
  const ellipse = readEllipseGeometry();
  const viewportH = window.innerHeight;
  const stageRect = stageEl ? stageEl.getBoundingClientRect() : null;

  // ---- Compute follow weight (0..1). vignetteWeight is the cursor-vs-ellipse
  //      factor; heroVisibilityWeight is filled in by Task 4 (defaults to 1
  //      while the placeholder branch below is in place).
  const d = normalizedEllipseDistance(
    mouseX,
    mouseY,
    ellipse.cx,
    ellipse.cy,
    ellipse.rx,
    ellipse.ry,
  );
  const vWeight = vignetteWeight(d);
  const sWeight = 1; // Task 4 replaces this line.
  const weight = vWeight * sWeight;

  // ---- Wander amplitude scales with disengagement.
  const wanderAmp = (1 - weight) * WANDER_RADIUS_PX;
  const t = now * 0.001;
  const wanderX = Math.cos(t * 0.45) * wanderAmp;
  const wanderY = Math.sin(t * 0.65) * wanderAmp;

  // ---- Centre home (ellipse centre + wander) blended toward cursor by weight.
  const centerX = ellipse.cx + wanderX;
  const centerY = ellipse.cy + wanderY;
  const targetX = centerX + (mouseX - centerX) * weight;
  const targetY = centerY + (mouseY - centerY) * weight;

  // ---- Smooth toward target. Faster when engaged, slower when disengaged.
  const lerpRate =
    LERP_RATE_DISENGAGED + (LERP_RATE_ENGAGED - LERP_RATE_DISENGAGED) * weight;
  lerpX += (targetX - lerpX) * lerpRate;
  lerpY += (targetY - lerpY) * lerpRate;

  // ---- Velocity stretch derived from the bloom's delta. Naturally calms
  //      when weight drops because the bloom stops chasing.
  const vx = lerpX - prevX;
  const vy = lerpY - prevY;
  const speed = Math.hypot(vx, vy);
  const targetSx = 1 + Math.min(Math.abs(vx) * 0.022, 0.45);
  const targetSy = 1 + Math.min(Math.abs(vy) * 0.022, 0.45);
  smoothSx += (targetSx - smoothSx) * 0.12;
  smoothSy += (targetSy - smoothSy) * 0.12;

  // ---- Blob merge under bloom velocity.
  const spreadTarget = Math.max(0, 1 - speed * 0.06);
  const spreadRate = spreadTarget < blobSpread ? 0.22 : 0.04;
  blobSpread += (spreadTarget - blobSpread) * spreadRate;

  // ---- Tilt track for the grid — separately lerped, normalized -0.5..0.5.
  //      Grid-tilt scaling by weight is added in Task 5; for now the tilt
  //      tracks the cursor as today.
  const ntx = mouseX / window.innerWidth - 0.5;
  const nty = mouseY / window.innerHeight - 0.5;
  tiltX += (ntx - tiltX) * 0.05;
  tiltY += (nty - tiltY) * 0.05;

  root.style.setProperty("--bloom-x", `${lerpX.toFixed(2)}px`);
  root.style.setProperty("--bloom-y", `${lerpY.toFixed(2)}px`);
  root.style.setProperty("--bloom-sx", smoothSx.toFixed(3));
  root.style.setProperty("--bloom-sy", smoothSy.toFixed(3));
  root.style.setProperty("--blob-spread", blobSpread.toFixed(3));
  root.style.setProperty("--mx", tiltX.toFixed(3));
  root.style.setProperty("--my", tiltY.toFixed(3));

  prevX = lerpX;
  prevY = lerpY;

  requestAnimationFrame(tick);
};
```

- [ ] **Step 3: Run the type checker.**

Run: `pnpm check`
Expected: Zero errors.

If you see `'stageRect' is declared but its value is never read` — that's expected; it's used in Task 4. If `pnpm check` fails on it under stricter linting, leave a temporary `void stageRect;` after its declaration and remove that line in Task 4.

- [ ] **Step 4: Visual verification — vignette gating.**

Run: `pnpm dev`
Open the dev URL.

Verify the following:

1. **Cursor inside the centre of the hero** — bloom follows the cursor closely, just like before.
2. **Cursor moving toward a corner** (e.g., toward the top-left logo, top-right meta column, bottom-right "currently building" chip) — the bloom slows down and gently drifts back toward the centre rather than chasing all the way out. The transition is smooth, not a hard cut.
3. **Cursor parked over a corner UI element** — bloom rests near the centre of the hero with a slow ambient sin/cos drift. It does not track small cursor movements.
4. **Cursor moves back into the centre area** — bloom catches up smoothly. No teleport. No visible discontinuity.
5. **Cursor parked dead centre, motionless** — bloom sits very close to the cursor with little drift (weight ≈ 1, so wanderAmp ≈ 0).
6. **Resize the window narrower / wider** — the gating boundary follows the new layout. Move the cursor to reconfirm 1–4 still hold.

Stop the dev server.

---

## Task 4: Apply scroll-out fade (heroVisibilityWeight)

**Files:**
- Modify: `src/lib/interactive-bg.ts` — one line in `tick()`

- [ ] **Step 1: Wire `heroVisibilityWeight` into `tick()`.**

Find this line in `tick()` (added in Task 3):

```ts
  const sWeight = 1; // Task 4 replaces this line.
```

Replace with:

```ts
  const sWeight = stageRect ? heroVisibilityWeight(stageRect, viewportH) : 1;
```

- [ ] **Step 2: Run the type checker.**

Run: `pnpm check`
Expected: Zero errors.

- [ ] **Step 3: Add a temporary scroll runway in `src/pages/index.astro` for verification.**

Currently the page is exactly one viewport tall — there is nothing to scroll into below the hero. To verify the scroll-out behavior, add a temporary placeholder element.

Find this block in `src/pages/index.astro`:

```astro
    <Nav />
    <Hero />

    <div class="page__grain" aria-hidden="true"></div>
```

Insert a tall placeholder element between `<Hero />` and the grain `div`:

```astro
    <Nav />
    <Hero />

    <div style="height: 200vh; background: var(--color-bg-1);" data-temp-scroll-runway></div>

    <div class="page__grain" aria-hidden="true"></div>
```

Note the `data-temp-scroll-runway` marker — this is so you remember to remove it in Step 5.

- [ ] **Step 4: Visual verification — scroll-out behavior.**

Run: `pnpm dev`

Verify:

1. **At top of page** — bloom behaves exactly as Task 3 left it. The hero is fully visible.
2. **Slowly scroll down** — as the hero moves up out of the viewport, the bloom rides upward with the grid (because its centre target is computed from the grid's bounding rect). Simultaneously, the bloom becomes less responsive to the cursor because `sWeight` is decreasing.
3. **Scroll halfway** (so half the hero is out of view) — the bloom should be fully or nearly fully disengaged from the cursor. Grid is dim or invisible (since the visible-grid ellipse is largely above the viewport).
4. **Scroll fully past the hero** — the bloom is offscreen above. The cursor in the runway area produces no visible bloom at all.
5. **Scroll back to the top** — the bloom smoothly re-engages, riding back into view with the grid and reattaching to the cursor.

Stop the dev server.

- [ ] **Step 5: Remove the temporary scroll runway.**

Edit `src/pages/index.astro` and remove the `<div style="height: 200vh; ..." data-temp-scroll-runway></div>` line you added in Step 3, restoring the original markup:

```astro
    <Nav />
    <Hero />

    <div class="page__grain" aria-hidden="true"></div>
```

- [ ] **Step 6: Run the type checker once more.**

Run: `pnpm check`
Expected: Zero errors.

---

## Task 5: Apply weight to grid tilt

**Files:**
- Modify: `src/lib/interactive-bg.ts` — two lines inside `tick()`

- [ ] **Step 1: Multiply the tilt input by `weight`.**

Find this block in `tick()`:

```ts
  // ---- Tilt track for the grid — separately lerped, normalized -0.5..0.5.
  //      Grid-tilt scaling by weight is added in Task 5; for now the tilt
  //      tracks the cursor as today.
  const ntx = mouseX / window.innerWidth - 0.5;
  const nty = mouseY / window.innerHeight - 0.5;
```

Replace with:

```ts
  // ---- Grid tilt — scaled by weight so the grid relaxes when the bloom does.
  const ntx = (mouseX / window.innerWidth - 0.5) * weight;
  const nty = (mouseY / window.innerHeight - 0.5) * weight;
```

- [ ] **Step 2: Run the type checker.**

Run: `pnpm check`
Expected: Zero errors.

- [ ] **Step 3: Visual verification — grid tilt scales with engagement.**

Run: `pnpm dev`

Verify:

1. **Cursor in centre** — grid tilts as today. Strong parallax response.
2. **Cursor approaches the visible edge** — tilt smoothly relaxes alongside the bloom letting go.
3. **Cursor over a corner UI element** — grid is fully flat (no tilt). Bloom is at centre.
4. **Cursor moves back into the centre** — tilt smoothly re-engages.
5. **Cursor stays inside a known corner for a few seconds** — grid stays flat. Bloom continues its slow ambient drift.

The bloom and grid should feel like one connected system from this point forward — engaging and disengaging together, never one without the other.

Stop the dev server.

---

## Task 6: Update the file's leading comment block

**Files:**
- Modify: `src/lib/interactive-bg.ts` — replace the leading comment block (lines 1–22 of the original file)

- [ ] **Step 1: Replace the leading comment block.**

Find the existing leading block:

```ts
// Interactive background — cursor-driven grid tilt + roaming, deforming bloom.
//
// Drives these CSS custom properties on <html>:
//   --mx, --my        : cursor position, normalized to -0.5..0.5 (grid tilt)
//   --bloom-x, -y     : cursor position in px (bloom centre)
//   --bloom-sx, -sy   : bloom scale factors (axis-aligned velocity stretch)
//   --blob-spread     : 0..1 multiplier on blob keyframe translates.
//                       1 = full spread (idle, blobs visibly distinct).
//                       0 = blobs collapse to centre (fast cursor → liquid
//                       being dragged tightens up).
//
// Behaviours layered together:
//   1. Lerped cursor follow — bloom lags the cursor with weight.
//   2. Velocity stretch — horizontal velocity stretches scaleX, vertical
//      velocity stretches scaleY. The bloom container becomes a trail.
//   3. Velocity merge — high speed pulls the blobs into the centre of the
//      container (asymmetric lerp: snappy on compress, gentle on expand).
//      The combination of (2) + (3) reads as a liquid being dragged.
//   4. Idle wander — after ~700ms of no movement, the bloom drifts off the
//      cursor on a slow sin/cos path. On the next mousemove it eases back.
//
// Disabled on touch devices (no hover) and under prefers-reduced-motion.
```

Replace with:

```ts
// Interactive background — cursor-driven grid tilt + roaming, deforming bloom,
// gated to the visible-grid vignette of the hero section.
//
// Drives these CSS custom properties on <html>:
//   --mx, --my        : grid tilt, normalized roughly -0.5..0.5 and scaled by
//                       the active follow weight (0 outside the vignette → flat)
//   --bloom-x, -y     : bloom centre in px
//   --bloom-sx, -sy   : bloom scale factors (axis-aligned velocity stretch)
//   --blob-spread     : 0..1 multiplier on blob keyframe translates.
//                       1 = full spread (idle, blobs visibly distinct).
//                       0 = blobs collapse to centre (fast cursor → liquid
//                       being dragged tightens up).
//
// Behaviours layered together:
//   1. Follow weight — a continuous 0..1 value computed each frame as
//      vignetteWeight × heroVisibilityWeight. Says how much the cursor
//      effects should track the mouse on a given frame.
//   2. Lerped cursor follow — when weight = 1, bloom lags the cursor; when
//      weight = 0, bloom rests at the ellipse centre with a slow sin/cos
//      wander. Blended by weight in between.
//   3. Velocity stretch — horizontal velocity stretches scaleX, vertical
//      velocity stretches scaleY. Computed from the bloom's lerp delta, so
//      it naturally calms when the bloom stops chasing the cursor.
//   4. Velocity merge — high speed pulls the blobs into the centre of the
//      container (asymmetric lerp: snappy on compress, gentle on expand).
//
// Disabled on touch devices (no hover) and under prefers-reduced-motion.
```

- [ ] **Step 2: Run the type checker.**

Run: `pnpm check`
Expected: Zero errors.

---

## Task 7: Final acceptance pass

**Files:**
- None modified. This is a verification-only task.

This task walks the spec's behavior summary and edge-case list end to end, producing a confidence check before declaring complete.

- [ ] **Step 1: Run the type checker once more.**

Run: `pnpm check`
Expected: Zero errors.

- [ ] **Step 2: Reduced-motion check.**

In Chrome DevTools: open Rendering tab → set "Emulate CSS media feature prefers-reduced-motion" to "reduce".
Reload the page.
Expected: No bloom motion. Grid does not tilt. Cursor effect is fully disabled. (This is the early-return path in the script — same behavior as today.)
Reset DevTools setting.

- [ ] **Step 3: Touch-only check (no-hover).**

In Chrome DevTools: open Rendering tab → check "Emulate CSS media type" or, more directly, use Device Mode (mobile viewport). Some setups require toggling "hover: none" via DevTools' CSS overrides; alternatively, run on a real touch device.
Expected: No cursor effect at all on touch devices. Same behavior as today.

- [ ] **Step 4: Resize check.**

Run: `pnpm dev`
Open the dev URL.
Drag the window from very narrow (≤ 900px — triggers the responsive `static` layout) to very wide (≥ 1600px) and back.
Expected: At every width, the gating boundary still aligns with the visible grid. Move the cursor to confirm — the bloom should follow inside the visible oval and disengage outside, regardless of viewport size.

- [ ] **Step 5: Spec acceptance walkthrough.**

Walk through the spec's "Behavior summary" section (`docs/superpowers/specs/2026-05-06-hero-bloom-vignette-gating-design.md`) with the dev server open. For each bullet:

- [ ] Cursor inside the bright/visible part of the grid: bloom follows the cursor as today. ✓
- [ ] Cursor drifting toward the faded edge: bloom slows, stops tracking, gently drifts back. ✓
- [ ] Cursor over edge UI (navbar, logo, chip, tag/meta columns, corners): bloom rests at hero center with ambient drift; grid is flat. ✓
- [ ] Cursor moving back into the visible grid: bloom smoothly catches up — no teleport. ✓
- [ ] Grid tilt moves in lockstep with the bloom. ✓
- [ ] Reduced motion / touch / no-hover: entire effect stays disabled. ✓

If any of these is "not quite right", that's a tuning issue — adjust `WANDER_RADIUS_PX`, `LERP_RATE_DISENGAGED`/`LERP_RATE_ENGAGED`, or the smoothstep boundaries (`0.5, 1.0`) in `vignetteWeight`. Note the change in the spec's "Risks → Smoothstep curve tuning" line and re-verify.

Stop the dev server.

- [ ] **Step 6: Spec deltas.**

Re-read the spec one final time. If implementation diverged in a noteworthy way (different selector, different boundary numbers, anything), capture those deltas in a short note at the bottom of the spec under a new section `## Implementation notes` so future-you knows what shipped vs. what was specified. If there are no deltas, skip this step.

---

## Self-review

A pass over the plan against the spec:

**Spec coverage:**
- Goal: vignette-gated cursor effects → Tasks 3, 5.
- Goal: smooth disengage at edge → Task 3 (smoothstep).
- Goal: scroll-out fade → Task 4.
- Goal: smooth re-entry → Task 3 (lerp continues; weight rises smoothly).
- Goal: reduced motion / touch unchanged → Task 7 verification (no code change needed).
- Architecture: `weight = vignetteWeight × heroVisibilityWeight` → Tasks 3, 4.
- `vignetteWeight` smoothstep falloff → Task 1 + Task 3.
- `heroVisibilityWeight` ramp → Task 1 + Task 4.
- Bloom target blend → Task 3.
- Idle wander amplitude scaled by `(1 − weight)` → Task 3.
- Grid tilt scaled by weight → Task 5.
- Velocity stretch and blob merge calm naturally → preserved in Task 3 (computed from bloom delta).
- Edge cases: missing element fallback → Task 2 (`readEllipseGeometry` fallback) + Task 4 (`stageRect ? ... : 1`).
- Edge cases: zero-size first frame → Task 2 (the `rect.width > 0 && rect.height > 0` guard) + Task 1 (`heroVisibilityWeight` returns 1 when `height ≤ 0`).
- Risks: smoothstep curve tuning → Task 7 Step 5 closing paragraph.

**Placeholder scan:**
- No "TBD"/"TODO"/"implement later" left in tasks.
- Each code step shows the exact code to insert/replace.
- Verification steps cite exact commands.

**Type consistency:**
- `vignetteWeight(d)` → number. Used in Task 3.
- `heroVisibilityWeight(rect, viewportH)` → number. Called as `heroVisibilityWeight(stageRect, viewportH)` in Task 4.
- `readEllipseGeometry()` → `{ cx, cy, rx, ry }`. Destructured as `ellipse.cx` etc. in Task 3.
- `gridEl: HTMLElement | null`, `stageEl: HTMLElement | null` — null checks in `tick()` and `readEllipseGeometry()`.

**Open question from spec:**
- Element selectors: chosen `'.page__grid'` and `'.stage'` directly. Data attributes were considered but not adopted (YAGNI; existing classes are stable). If the engineer wants to switch to `data-cursor-vignette` / `data-cursor-section`, they can edit the two `querySelector` calls in Task 2 Step 4 and add matching `data-` attributes to `src/pages/index.astro` (`.page__grid` element) and `src/components/Hero.astro` (`<main class="stage">`).
