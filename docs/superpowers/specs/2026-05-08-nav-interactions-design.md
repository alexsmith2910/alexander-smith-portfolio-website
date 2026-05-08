# Nav Interactions Design — Sliding bg, char flourish, press

**Date:** 2026-05-08
**Status:** Approved (pending plan)
**Owner:** Alexander Smith

## Context

The portfolio's logo (`src/components/Logo.astro` + `src/lib/logo-animation.ts`) sets a high motion bar: per-character wordmark flourish, AS↔❯_ mark swap, accent dot wink + pulse, /folio reveal with caret. The current nav (`src/components/Nav.astro`) uses a flat `.nav__pill a:hover { background: var(--color-line-1) }` rule that reads as draft-quality next to the logo it sits beside.

This design upgrades both pills (the center `.nav__pill` and the right `.nav__right` cluster) so their hover, press, and focus behavior matches the cinematic register the logo establishes — without leaning on GSAP, since the choreography is simple enough to do in CSS plus a small per-pill controller.

## Goals

- Hover and focus feel "alive" and clearly tied to the logo's motion language.
- A single shared sliding background per pill — buttery-smooth interpolation between buttons.
- Per-character roll on the active button text, gated to ride the bg's arrival rather than waiting for it.
- Tactile press affordance via a bg shrink — text untouched.
- Uniform behavior across both pills; icon buttons skip the parts that don't apply.

## Non-goals

- Scroll-spy / "active section" indicator. Deferred — the bg fades out fully when nothing is hovered or focused.
- Hold/long-press behavior. Press state is static (scale 0.90) until release.
- Light-theme support for the nav. The project has no global theme toggle; local "light areas" of the page are a future concern (likely solved via `mix-blend-mode`, scroll-driven token swaps, or per-section overrides at that point).
- GSAP-driven orchestration. Vanilla CSS transitions + a small JS controller is the right scale of tool for this surface.

---

## What is being built

### The four motion layers

| Layer | Element | Driver | Trigger |
|---|---|---|---|
| Sliding bg | single `<span class="nav__bg">` per pill | CSS `left` + `width` transitions | JS sets `left`/`width` on `pointerenter`/`focus` of any `<a>` |
| Glow halo | `.nav__bg::after` pseudo-element | CSS `opacity` + `transform: scale` transitions | JS toggles `.is-visible` on the bg |
| Press shrink | `.nav__bg.is-pressing` class | CSS `transform: scale(0.90)` (80 ms) | JS toggles class on `pointerdown`/`pointerup` and `keydown`/`keyup` (Enter only) |
| Per-char flourish | `.nav__char` spans inside `.nav__roll` | CSS keyframe animation on `.replay` | JS schedules `.replay` 50 ms after `pointerenter`/`focus`; cancels if user moves to another target |

All four run in parallel, settle independently. The `transform` property's transition duration is set to 80 ms in the base `transition` declaration on `.nav__bg`, so adding `.is-pressing` reuses that 80 ms duration without needing any per-class override that would also affect the slide.

### Sliding bg — exact spec

```
position: absolute; top: 5px; bottom: 5px; left: 0; width: 0;
border-radius: var(--radius-pill);
background: linear-gradient(180deg, rgba(245,245,244,0.12), rgba(245,245,244,0.04));
box-shadow:
  inset 0 1px 0 rgba(255,255,255,0.10),
  inset 0 0 0 1px rgba(245,245,244,0.06);
opacity: 0;
pointer-events: none;
z-index: 0;
transform-origin: center;
transition:
  left 320ms var(--ease-out),
  width 320ms var(--ease-out),
  opacity 200ms var(--ease-out),
  transform 80ms var(--ease-out);
```

`.is-visible` flips opacity to 1. `.is-pressing` sets `transform: scale(0.90)` and rides the base 80 ms transform transition declared above.

### Glow halo — exact spec

```
.nav__bg::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: 0 10px 26px -8px rgba(16, 185, 129, 0.45);
  opacity: 0;
  transform: scale(0.78);
  transform-origin: center bottom;
  pointer-events: none;
  transition:
    opacity 320ms var(--ease-out) 40ms,
    transform 380ms var(--ease-out) 40ms;
}
.nav__bg.is-visible::after { opacity: 1; transform: scale(1); }
```

The halo grows in (scale 0.78 → 1, opacity 0 → 1) the first time the bg becomes visible. While the bg slides between buttons, the halo rides along at full scale — there's no re-trigger because the trigger is a class flip, not a position change.

### Per-char flourish — exact spec

```
@keyframes nav-char-roll {
  0%      { transform: translateY(0);     color: var(--color-fg-2); }
  32%     { transform: translateY(-100%); color: var(--color-accent); }
  32.01%  { transform: translateY(110%); }
  100%    { transform: translateY(0);     color: var(--color-fg-1); }
}
.nav__char { display: inline-block; will-change: transform, color; }
.nav__roll { display: inline-flex; overflow: hidden; line-height: 1.2; }
a[data-nav-link].replay .nav__char {
  animation: nav-char-roll 460ms var(--ease-out) forwards;
}
```

Stagger is set per-char via inline `animation-delay` written by JS (so it can be capped on long labels — see Edge cases). Each char rolls up, color-flashes accent green at the apex, snaps below the line, then rolls back to settle at `--color-fg-1`. Same family as the logo's wordmark flourish.

### Press shrink

`.nav__bg.is-pressing { transform: scale(0.90); }` — the base `.nav__bg` transition declaration already has `transform 80ms var(--ease-out)`, so no class-level duration override is needed. The slide's 320 ms `left`/`width` is not affected.

Toggled on:
- `pointerdown` on any link → add. `pointerup` / `pointerleave-link` / `pointercancel` → remove.
- `keydown` Enter (when link is focused) → add. `keyup` Enter → remove. Space is omitted for `<a>` elements: browsers treat Space on a link as page-scroll, not activation, so visually pressing the bg without firing the link would be misleading.

### Color (text)

- Rest: `color: var(--color-fg-2)`
- `:hover` / `:focus-visible`: `color: var(--color-fg-1)` set directly so the brighter tone is on even before the flourish settles. The flourish keyframes end on `--color-fg-1`, so there's no jump on landing.

### Icon-only buttons (right cluster)

GitHub, LinkedIn, X have no label text. They get the slide, glow grow, and press shrink. No `.nav__roll`, no flourish. The SVG inherits text color, so the same `--color-fg-2` → `--color-fg-1` shift applies. A small `transform: scale(1.06)` over 200 ms on the SVG itself on hover/focus gives parity with the press shrink so the icons don't feel inert next to the rolling text labels.

---

## Architecture

### Files

- **Modified:** `src/components/Nav.astro`
  - Frontmatter / props unchanged.
  - Inner JSX: each text link wraps its label in `<span class="nav__roll"><span class="nav__char">…</span>…</span>`, split server-side from the prop string. One `<span class="nav__bg" data-nav-bg></span>` is added as the first child of each pill.
  - `<style>` block: removes the old `.nav__pill a:hover` / `.nav__right a:hover` background rules; adds `.nav__bg`, `.nav__bg::after`, `.is-visible`, `.is-pressing`, `.nav__roll`, `.nav__char`, and the `nav-char-roll` keyframes.
  - `<script>` block: contains the `initNavMagic()` controller inline. If during implementation it crosses ~120 LOC, lift it to `src/lib/nav-magic.ts` and import (matches the Logo.astro / logo-animation.ts split).
- **No new lib file unless the controller grows.**

### Controller shape

```ts
function initNavMagic(): void {
  // idempotency guard: data-nav-magic-init on each pill
  // for each [data-nav-pill]:
  //   bindPill(pillElement)
}

function bindPill(pill: HTMLElement): void {
  // queries:
  //   bg = pill.querySelector('[data-nav-bg]')
  //   links = pill.querySelectorAll('a[data-nav-link]')
  //
  // state:
  //   currentTarget: HTMLAnchorElement | null
  //   pendingRollTimer: number | null
  //
  // events bound (per link):
  //   pointerenter, focus  → moveBgTo(link)
  //   pointerdown, keydown(Enter)  → bg.classList.add('is-pressing')
  //   pointerup, pointerleave, pointercancel, keyup(Enter) → bg.classList.remove('is-pressing')
  //
  // events bound (per pill):
  //   pointerleave, focusout-with-no-internal-target → hide()
  //
  // moveBgTo(link):
  //   measure link rect relative to pill
  //   if bg is invisible: snap left/width with transitions disabled, force reflow, re-enable, add .is-visible
  //   else: just set left/width — transitions interpolate
  //   schedule flourish: clearTimeout(pendingRollTimer); setTimeout(flourish(link), 50)
  //   if reduced-motion: skip the flourish setTimeout entirely
  //
  // flourish(link):
  //   if link !== currentTarget OR not hovered/focused: skip
  //   write per-char animation-delays (capped stagger; see Edge cases)
  //   classList.remove('replay'); force reflow; classList.add('replay')
  //   setTimeout to remove .replay after total animation time
  //
  // hide():
  //   bg.classList.remove('is-visible', 'is-pressing')
  //   clearTimeout(pendingRollTimer)
  //   currentTarget = null
}
```

Two pills, two independent controller instances, each with its own state. No shared state between them.

### Markup shape (target)

```astro
<header class="nav fade-up">
  <Logo />

  <nav class="nav__pill" aria-label="Primary" data-nav-pill>
    <span class="nav__bg" data-nav-bg aria-hidden="true"></span>
    <a href="#work" aria-label="Work" data-nav-link>
      <span class="nav__roll" aria-hidden="true">
        <span class="nav__char">W</span>…
      </span>
    </a>
    <!-- Writing -->
    <span class="nav__pill-mark" aria-hidden="true"><svg>…</svg></span>
    <!-- Workshop, About -->
  </nav>

  <div class="nav__right" data-nav-pill>
    <span class="nav__bg" data-nav-bg aria-hidden="true"></span>
    <a href="mailto:…" aria-label="Email" data-nav-link>
      <span class="nav__roll" aria-hidden="true">…</span>
    </a>
    <a href="…" class="is-icon" aria-label="GitHub" data-nav-link>
      <svg>…</svg>
    </a>
    <!-- LinkedIn, X icons same pattern; no .nav__roll on icon-only links -->
    <a href="#contact" aria-label="Available June 2026" data-nav-link>
      <span class="nav__roll" aria-hidden="true">…</span>
    </a>
  </div>
</header>
```

`.nav__pill-mark` (the green chevron divider) keeps its current markup and styling unchanged. It has no `data-nav-link`, so the controller ignores it — passing the cursor over it leaves the bg parked on the previously hovered button until the cursor reaches a real link or leaves the pill.

---

## Edge cases

- **Chevron divider as dead zone.** Handlers bind only to `[data-nav-link]`. `pointerleave` on the pill only fires when the cursor exits the pill's bounding box. Hovering the chevron is a no-op.
- **Long labels.** "Available June 2026" is 17 chars (incl. spaces). Per-char stagger is capped: `staggerMs = min(22, floor(264 / charCount))`. For 17 chars that's ~15 ms/char — total flourish ~700 ms instead of 834 ms. Short labels (≤12 chars) keep the full 22 ms stagger that matches the logo wordmark.
- **Spaces.** Each space is its own `<span class="nav__char"> </span>`. It takes a stagger slot and runs the keyframes (no visible glyph to roll, but the slot keeps timing aligned with the logo wordmark's pattern).
- **Quick re-entry.** If the user leaves the pill mid-fade-out and returns within 200 ms, plain opacity transition resumes from the current value — no special handling.
- **Touch.** `pointer*` events handle mouse, pen, and touch uniformly. A tap fires `pointerenter` → `pointerdown` → `pointerup` in rapid sequence; the user sees a brief flourish + press + release before the page navigates.
- **View transitions / HMR.** `data-nav-magic-init="true"` set on each pill after binding prevents double-binding when Astro view transitions or HMR re-run the script.
- **Pre-JS / JS-disabled.** Bg is `opacity: 0` by default and never shows. The `:hover { color: var(--color-fg-1) }` rule still applies, so links still have a visible hover state.
- **Bg sliding past the chevron divider.** The center pill's `.nav__pill-mark` has `position: relative` and sits later in DOM order than the bg, so it paints above. The bg's emerald halo (box-shadow on `::after`) extends a few px beyond the bg's bounds, so it visually passes under the chevron when the bg slides Writing → Workshop. If implementation reveals visible collision, raise `.nav__pill-mark`'s `z-index` to `2` (above links and bg) so it cleanly clips the halo at its bounds.

## Accessibility

- **Keyboard navigation.** `focus` on a link drives the bg the same way `pointerenter` does. `focusout` on the pill (with no other internal target focused) hides the bg. Tab order is unchanged.
- **Activate via Enter.** Controller listens for `keydown` Enter → adds `.is-pressing`; `keyup` → removes. (Space is intentionally not bound — browsers treat Space on `<a>` as page-scroll, not activation.) Press feedback parity with mouse for keyboard activation.
- **Screen readers.** Each `<a>` carries an explicit `aria-label` matching its label text. The `.nav__roll` wrapper is `aria-hidden="true"` so the per-character spans aren't read individually.
- **Reduced motion.** The existing global rule in `global.css` already flattens `transition-duration` and `animation-duration` to 0.01 ms under `prefers-reduced-motion: reduce` — bg snaps, flourish completes instantly, hover color still applies. The controller additionally skips scheduling the flourish timer under reduced motion (no work, no setTimeout).
- **Pointer-only interactions stay intact.** No keyboard trap or focus theft. The ARIA semantics of the existing nav are preserved — only the visual layer changes.

## Manual test plan

1. Slow hover across all four center-pill buttons → bg slides smoothly, flourish fires ~50 ms after each `pointerenter`.
2. Fast hover across → bg races; flourish only fires on the resting target (because the prior link's roll timer was cancelled before firing).
3. Leave pill, re-enter on a different button → bg fades out, then snaps in at the new target on next `pointerenter`.
4. Press + release on the same button → shrink to 0.90 (80 ms) + spring back.
5. Press + drag off the button → shrink while held, returns when the cursor leaves the link bounds.
6. Tab through the nav → bg follows focus through each link in order.
7. Enter on a focused link → press shrink + spring back; activates the link normally. Space scrolls the page (default browser behavior) without firing the press visual.
8. Hover the green chevron divider → bg stays on the previously hovered button.
9. Repeat 1–8 on the right cluster (Email + 3 icons + Available); icon buttons get bg + press + a small SVG scale, no flourish.
10. OS-level reduced motion enabled → no animation; hover color still changes; bg appears instantly at the target.

## Open / deferred

- Local "light areas" of the page (when a section ships with a light bg). Possible mechanisms: `mix-blend-mode: difference` on the nav layer, scroll-driven custom-property swaps, or a per-section `data-nav-theme="light"` override. Out of scope for v1.
- Scroll-spy / "active section" indicator on the bg. Could layer on top of the v1 design without rework.
- Mobile/responsive shape. The current Nav already hides `.nav__right` below 900 px; this design keeps that breakpoint untouched. A future small-screen pass may redesign the center pill as a sheet or a bottom dock.
