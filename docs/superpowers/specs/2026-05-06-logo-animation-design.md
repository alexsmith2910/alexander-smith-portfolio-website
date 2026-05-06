# Logo Animation Design — Alexander Smith Portfolio

**Date:** 2026-05-06
**Status:** Approved (pending plan)
**Owner:** Alexander Smith

## Context

The site's logo currently lives inline inside `src/components/Nav.astro` (lines 20–26 markup, lines 92–141 styles) as `nav__brand`. It has three visual parts:

1. **Mark** — a 28×28 box with `AS` initials (Geist Mono, 11px, semibold) and a 4×4 emerald accent dot in the top-right corner with a soft glow.
2. **Wordmark** — `Alexander Smith` (Geist sans, 15px, medium).
3. **Italic em** — `/ folio` (Instrument Serif, italic, 14px, `fg-3` color).

Today the logo only has a static `transition: color` on hover. The site spec (`2026-05-06-tech-stack-design.md`) names motion as the defining product characteristic — *"Animation quality is the primary product, not a finishing touch."* The hero name already uses a per-glyph `translateY(110%) → 0` reveal gated by `prefers-reduced-motion`. The logo currently has no equivalent treatment.

## Goals

- Extract the logo into a reusable `<Logo />` component with consolidated, scoped CSS.
- Add a polished, orchestrated **hover animation** that targets individual letters across all three parts (Mix 1 — "cinematic mark, playful trim").
- Add an **appear animation** that's a softer cousin of the hover (same vocabulary, calmer temperament).
- Use GSAP + SplitText (the project's named animation tool) for both, with a clean accessibility/reduced-motion bailout.
- Light-theme support via existing CSS variables — no theme-specific branches.

## Non-goals

- Animating the rest of the nav (the pill, right cluster, etc.) — out of scope for this spec.
- A magnetic/cursor-tracking effect on the logo — discussed and rejected for being a different motion vocabulary.
- Per-letter independent hover targets — the whole `<a>` is the hover region; the animation operates on individual letters via stagger.
- View-transition handoff between pages — deferred until routing exists.

---

## Component architecture

### New: `src/components/Logo.astro`

Markup + scoped styles only. Accepts props so the component can be reused (footer, etc.):

```ts
interface Props {
  href?: string;        // default "#top"
  initials?: string;    // default "AS"
  name?: string;        // default "Alexander Smith"
  em?: string;          // default "/ folio"
}
```

Structure:

```html
<a class="logo" href={href} aria-label={`${name} — home`} data-logo>
  <span class="logo__mark" aria-hidden="true" data-logo-mark>
    <span class="logo__mark-letters">
      <!-- one .logo__mark-glyph per character of `initials` -->
    </span>
    <span class="logo__mark-dot"></span>
  </span>
  <span class="logo__text" aria-hidden="true">
    <span class="logo__wordmark" data-logo-wordmark>{name}</span>
    <span class="logo__em" data-logo-em>{em}</span>
  </span>
</a>
```

Key CSS responsibilities:
- `.logo__mark` and `.logo__mark-letters` carry `overflow: hidden` so glyphs slide into/out of view cleanly.
- `.logo__wordmark` carries `overflow: hidden` after SplitText runs (set via inline style by the JS so server-rendered HTML stays clean).
- All colors and typography use existing tokens (`var(--color-fg-1)`, `var(--color-accent-hover)`, `var(--font-mono)`, etc.). No new tokens introduced.
- **Initial CSS state: `opacity: 1`.** Server-rendered HTML always shows the logo. GSAP's first action on mount is `gsap.set(wrapper, { opacity: 0 })` immediately followed by the appear timeline — the gap between SSR paint and GSAP execution is a single tick and visually imperceptible. **No CSS fallback keyframe needed**; if JS fails entirely, the logo simply renders static (no flourish). This avoids the race condition of a CSS fade-in colliding with GSAP setting `opacity: 0`.

### New: `src/lib/logo-animation.ts`

A single exported function `initLogo()` that:

1. Queries all `[data-logo]` on the page and skips any with `data-logo-init="true"`. Sets that flag after binding to make re-runs idempotent (Astro view transitions friendly).
2. Bails immediately if `matchMedia('(prefers-reduced-motion: reduce)').matches` — sets `opacity: 1` on the wrapper and exits. No GSAP imports executed beyond the initial module load.
3. Registers `SplitText` once via `gsap.registerPlugin(SplitText)`.
4. For each logo element:
   - Splits `.logo__wordmark` into characters with SplitText (`type: "chars"`, `charsClass: "logo__char"`).
   - Builds two **paused** GSAP timelines: an **appear** timeline and a **hover** timeline (see below for choreography).
   - Awaits `document.fonts.ready`, then plays the appear timeline.
   - Binds `mouseenter` and `focus` on the `<a>` → `hoverTl.restart()`.
5. Cleanup helper exposed for completeness (`destroyLogo(el)`) — calls `splitText.revert()` and removes listeners. Not bound to any lifecycle in v1, but available if needed for HMR or view transitions.

### Edited: `src/components/Nav.astro`

- Replace lines 20–26 (`<a class="nav__brand">…</a>`) with `<Logo />`.
- Add `import Logo from "./Logo.astro";` to frontmatter.
- Delete lines 92–141 (all `.nav__brand*` rules). The `.nav` grid layout, the pill nav, and the right cluster stay untouched.

---

## Hover animation timeline

Total duration: **~730ms**. Three parallel tracks, lightly overlapped.

### Track A — Mark (`AS` box) | `0ms → 320ms`

| Time | Element | Property | From → To | Duration | Easing |
|---|---|---|---|---|---|
| 0 | mark glyphs | `y` + `opacity` | `0, 1` → `-100%, 0` | 180ms | `power2.in` |
| 0 (jump after exit) | mark glyphs | `y` | `-100%` → `100%` | instant `set()` | — |
| 180 | mark glyphs | `y` + `opacity` | `100%, 0` → `0, 1` | 180ms | `power2.out` |
| 0 | mark dot | `scale` | `1` → `1.4` → `1` | 320ms | `back.inOut(2)` |
| 60 | mark dot ring (pseudo `::after`) | `scale` + `opacity` | `0.6, 0.5` → `2.2, 0` | 480ms | `power2.out` |

- 40ms inter-letter stagger between `A` and `S` so they don't move in lockstep.
- Single span per glyph (Option X: vertical full-cycle roll). Simpler than two-layer swap, visually identical.

### Track B — Wordmark (`Alexander Smith`) | `100ms → 730ms`

| Time | Element | Property | From → To | Duration | Stagger | Easing |
|---|---|---|---|---|---|---|
| 100 | each char | `y` + `opacity` | `0, 1` → `-100%, 0` | 180ms | 18ms | `power2.in` |
| (after each exits) | each char | `y` | `-100%` → `100%` | instant | per-char | — |
| (after each jumps) | each char | `y` + `opacity` | `100%, 0` → `0, 1` | 200ms | 18ms | `power2.out` |
| 140 | each char | `color` | `fg-1` → `accent-hover` → `fg-1` | 300ms | 18ms | `power1.inOut` |

- Color flash starts ~40ms after the roll begins so the green wash arrives mid-air and is gone before the letter settles.
- "Alexander Smith" is 15 characters (including the space). Last char's animation starts at `100 + (14 × 18) = 352ms` and finishes at `352 + 380 = 732ms`.

### Track C — Italic em (`/ folio`) | `280ms → 700ms`

| Time | Property | From → To | Duration | Easing |
|---|---|---|---|---|
| 280 | `x` | `28px` → `0` | 420ms | `back.out(1.8)` |
| 280 | `color` | `fg-3` → `accent` → `fg-3` | 420ms | `power2.inOut` |
| 280 | `opacity` | `0.7` → `1` | 200ms | `power2.out` |

Single overshoot, no oscillating bounce.

### Replay rules

- `mouseenter` → `hoverTl.restart()`. Replays from time 0 regardless of in-progress state.
- `focus` (keyboard) → same call. Same flourish for keyboard users.
- `mouseleave` and `blur` → no action. The timeline runs to its natural rest state.
- `onStart: () => tl.invalidate()` so cached values re-read after first run (matters if fonts swap between first appear and first hover).

---

## Appear animation timeline

Total duration: **~1100ms**. Same three tracks, softer temperament.

### Track A — Mark | `0ms → 480ms`

- **Wrapper fade-up first**: `.logo__mark` `opacity: 0 → 1`, `y: 6px → 0`, 360ms `power2.out`. Hover doesn't have this — it's exclusive to appear so the logo "arrives" before any internal motion.
- **Glyph double-roll**: same vocabulary as hover, but ~280ms per phase (vs 180ms) and **no inter-letter stagger** between `A` and `S` — they swap as one beat.
- **Dot pulse**: `scale: 1 → 1.2 → 1` with `power2.inOut`. **No ring emission.**

### Track B — Wordmark | `220ms → 900ms`

- **Mask reveal, not double-roll.** Each char starts at `y: 110%, opacity: 0` and slides to `y: 0, opacity: 1` (single direction, no swap-out).
- **Stagger: 24ms** (vs 18ms hover — calmer cadence).
- **No color flash.** Settles at `fg-1`.
- **Easing: `power3.out`** — flat-out, no overshoot.

### Track C — Italic em | `560ms → 1100ms`

- **Fade + leftward drift**: `opacity: 0 → 1`, `x: -8px → 0`. Drifts in from the *opposite* direction of hover so the gestures don't read as the same move.
- 540ms, `power2.out`.
- **No overshoot, no color flash.**

### Trigger logic

- Runs once per logo on mount, gated by `await document.fonts.ready`.
- No CSS fallback needed because the initial CSS state is already `opacity: 1` (see Component architecture). If JS never executes, the logo renders static and visible — no flourish, no flash, no flicker.

---

## Accessibility

### Screen readers
- The `<a>` carries `aria-label="Alexander Smith — home"` (or `${name} — home` if customized via prop).
- All visual children carry `aria-hidden="true"` so SplitText's per-letter spans (~22 of them) never leak as character-by-character announcements.
- `splitText.revert()` is exposed via `destroyLogo()` for clean teardown if needed.

### Reduced motion
- Detection: `matchMedia('(prefers-reduced-motion: reduce)').matches`.
- Behavior: skip GSAP entirely. Set `opacity: 1` on the wrapper. Element renders in its static final state.
- Hover still gets a static `color` transition (already on the `<a>`'s base CSS). The hover affordance is preserved without motion.
- Consistent with the existing global rule in `src/styles/global.css:217-226`.

### Focus
- Keyboard focus on the logo `<a>` triggers the same hover timeline.
- The browser's default focus ring is preserved — no `outline: none`.

### Light theme
- All animated properties use existing tokens (`--color-accent-hover`, `--color-fg-1`, `--color-accent-glow`, `--color-fg-3`, `--color-accent`).
- Light theme overrides those tokens automatically. No theme-specific branches in JS or CSS.

---

## Failure modes and edge cases

| Case | Handling |
|---|---|
| Multiple `<Logo />` on a page | `initLogo()` queries all `[data-logo]` and binds each independently. |
| `initLogo()` re-runs (Astro view transitions) | Idempotent via `data-logo-init="true"` attribute on each bound element. |
| Fonts load slowly | Appear timeline is gated on `document.fonts.ready` — wordmark won't re-lay-out mid-reveal. |
| GSAP fails to load (CDN block, script error) | Initial CSS state is `opacity: 1`. Logo is visible (static), no flourish. |
| `prefers-reduced-motion: reduce` | Skip all GSAP. Set `opacity: 1`. Static render. |
| Window resize | Char positions adjust naturally because each char is a normal inline span. No re-split needed. |
| Hover spam | `tl.restart()` resets cleanly each time — no compounding, no leaks. |
| Element removed from DOM mid-animation | GSAP tweens of detached elements are no-ops — no errors. Cleanup left to GC unless `destroyLogo()` is called. |

---

## Manual testing path

No test framework in the project; verification is manual on the running dev server (`localhost:4321`).

1. **Initial load**: appear animation plays once and ends in resting state.
2. **Hover**: orchestrated mark → wordmark → italic sequence plays.
3. **Hover spam**: animation restarts cleanly each time, no compounding.
4. **Keyboard focus**: tab to logo, same sequence plays, visible focus ring present.
5. **Reduced motion**: toggle `prefers-reduced-motion: reduce` in DevTools → reload → logo renders static, hover only color-shifts.
6. **Light theme**: add `theme-light` class to `<html>` → verify accent colors track light tokens, animations still run.
7. **Mobile (≤900px)**: nav already hides the right cluster; verify logo still animates correctly at smaller sizes.
8. **Slow fonts**: throttle network in DevTools → reload → wordmark waits for fonts before playing.

---

## Open questions / deferred

- **SplitText import path** — `gsap@3.15.0` ships SplitText, but the exact import path (`gsap/SplitText` vs `gsap/dist/SplitText`) will be verified during implementation. If the path is wrong, dev server console will surface it immediately.
- **Animation on view transitions** — when routing is added later, the logo's appear may need to skip on subsequent routes (it shouldn't replay every navigation). Add a `sessionStorage` flag at that point.
- **Footer logo variant** — the spec supports props for reuse, but the footer doesn't exist yet. Confirm the same animation makes sense there once it does (small chance the appear should be disabled in the footer to avoid two simultaneous reveals).
