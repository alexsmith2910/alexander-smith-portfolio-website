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
const LERP_RATE_DISENGAGED = 0.018;
const LERP_RATE_ENGAGED = 0.025;
// Bloom grows by up to this fraction when fully disengaged (cursor outside
// vignette / hero scrolled out). Adds a soft "settling" at rest.
const DISENGAGE_GROWTH = 0.2;

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
let lastMoveTime = performance.now();
let smoothRestFactor = 0;
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

const onMove = (e: MouseEvent) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  lastMoveTime = performance.now();
};

const onResize = () => {
  // Keep idle-wander reference sensible on resize.
  mouseX = Math.min(mouseX, window.innerWidth);
  mouseY = Math.min(mouseY, window.innerHeight);
};

const tick = () => {
  const now = performance.now();
  const ellipse = readEllipseGeometry();
  const viewportH = window.innerHeight;
  const stageRect = stageEl ? stageEl.getBoundingClientRect() : null;

  // ---- Compute follow weight (0..1). vignetteWeight is the cursor-vs-ellipse
  //      factor; heroVisibilityWeight ramps to 0 as the hero scrolls out.
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

  // ---- Smooth toward target. Faster when engaged, slower when disengaged.
  const lerpRate =
    LERP_RATE_DISENGAGED + (LERP_RATE_ENGAGED - LERP_RATE_DISENGAGED) * weight;
  lerpX += (targetX - lerpX) * lerpRate;
  lerpY += (targetY - lerpY) * lerpRate;

  // ---- Velocity stretch derived from the bloom's delta. Naturally calms
  //      when weight drops because the bloom stops chasing. Sensitivity tuned
  //      for the new slower lerp rates so the stretch stays visibly responsive.
  const vx = lerpX - prevX;
  const vy = lerpY - prevY;
  const speed = Math.hypot(vx, vy);
  const targetSx = 1 + Math.min(Math.abs(vx) * 0.06, 0.55);
  const targetSy = 1 + Math.min(Math.abs(vy) * 0.06, 0.55);
  smoothSx += (targetSx - smoothSx) * 0.12;
  smoothSy += (targetSy - smoothSy) * 0.12;

  // ---- Blob merge under bloom velocity. Speed multiplier compensates for the
  //      slower lerp rate so blobs still visibly collapse on fast motion.
  const spreadTarget = Math.max(0, 1 - speed * 0.16);
  const spreadRate = spreadTarget < blobSpread ? 0.22 : 0.04;
  blobSpread += (spreadTarget - blobSpread) * spreadRate;

  // ---- Grid tilt — scaled by weight so the grid relaxes when the bloom does.
  const ntx = (mouseX / window.innerWidth - 0.5) * weight;
  const nty = (mouseY / window.innerHeight - 0.5) * weight;
  tiltX += (ntx - tiltX) * 0.05;
  tiltY += (nty - tiltY) * 0.05;

  // ---- Bloom grows when at rest: either disengaged from cursor (weight low)
  //      or cursor static (no recent mousemove). max() picks whichever fires
  //      first; both ramp up to the same DISENGAGE_GROWTH cap. The factor is
  //      smoothed so the moment of starting to move again eases out instead of
  //      snapping the bloom to its small size.
  const idle = now - lastMoveTime;
  const idleFactor = clamp01((idle - 200) / 800);
  const targetRestFactor = Math.max(1 - weight, idleFactor);
  smoothRestFactor += (targetRestFactor - smoothRestFactor) * 0.035;
  const disengageGrowth = 1 + smoothRestFactor * DISENGAGE_GROWTH;

  root.style.setProperty("--bloom-x", `${lerpX.toFixed(2)}px`);
  root.style.setProperty("--bloom-y", `${lerpY.toFixed(2)}px`);
  root.style.setProperty("--bloom-sx", (smoothSx * disengageGrowth).toFixed(3));
  root.style.setProperty("--bloom-sy", (smoothSy * disengageGrowth).toFixed(3));
  root.style.setProperty("--blob-spread", blobSpread.toFixed(3));
  root.style.setProperty("--mx", tiltX.toFixed(3));
  root.style.setProperty("--my", tiltY.toFixed(3));

  prevX = lerpX;
  prevY = lerpY;

  requestAnimationFrame(tick);
};

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
