# /folio Hover Animation Redesign — Alexander Smith Portfolio

**Date:** 2026-05-07
**Status:** Approved (pending plan)
**Owner:** Alexander Smith

## Context

The logo's italic `/ folio` em currently animates on hover by sliding ~20px to the right with a `back.out(1.4)` bounce, while the base text color toggles to emerald via a JS-applied `.logo__em--hover` class. The slide returns to rest with `power2.out` on hover-leave. Implemented in `src/components/Logo.astro` (styles, lines 210–225) and `src/lib/logo-animation.ts` (the `enter`/`leave` handlers, lines 105–134).

The horizontal slide reads as too busy and competes with the rest of the logo's hover orchestration (AS↔❯_, dot wink, wordmark flourish). The user wants a different treatment that keeps the emerald accent (project's `--color-accent`, `#10b981`) but replaces the slide+bounce with something that fits the terminal vocabulary the AS box already establishes (the `❯_` prompt that appears on hover).

## Goals

- Replace the current `/ folio` hover animation with a **type-on smooth-wipe reveal**: a green caret traverses left-to-right while a green-colored copy of the text reveals behind it via `clip-path`.
- Keep the project's emerald accent for the active state.
- Tighten coordination with the AS↔❯_ box transition (small enter-stagger so the box "opens the prompt", then `/folio` "types in").
- Drive the new animation with **CSS only** — no GSAP for this piece. Lighter, more predictable, easier to gate on `prefers-reduced-motion`.
- Preserve the existing page-load *appear* animation for `/folio` (fade-in then slide-left to rest). User confirmed this stays as-is.

## Non-goals

- Changing the AS↔❯_ mark animation, dot wink/pulse, or wordmark flourish — all out of scope.
- Changing the page-load appear sequence — explicitly retained.
- Adding new state beyond hover/focus (no click animations, no scroll-driven changes).
- Replacing the GSAP machinery elsewhere in `logo-animation.ts` — only the two `/folio` tweens and the `.logo__em--hover` class toggle are removed.

---

## Behavior

### Hover enter (forward, ~570ms total)

1. **t = 0ms** — User hovers the logo. AS↔❯_ box transition starts immediately (unchanged).
2. **t = 150ms** — `/folio`'s wipe begins (150ms enter-stagger so the box has visibly started its transition first; reads as "system shows the prompt, then completes the entry").
3. **t = 150 → 230ms** — Caret fades in at the left edge of `/folio` (opacity 0 → 1, ~80ms linear).
4. **t = 150 → 570ms** — Caret travels left-to-right via the `left` property (from `−2px` to `calc(100% + 2px)`), 420ms with `--ease-out` (`cubic-bezier(0.22, 1, 0.36, 1)`).
5. **t = 150 → 570ms** — Green reveal layer's `clip-path` animates from `inset(0 100% 0 0)` to `inset(0 0 0 0)`, 420ms with `--ease-out`. Caret position stays in sync with the wipe edge because both use the same duration, easing, and start time.
6. **t = 570ms onward** — Caret continues blinking at far-right (700ms `steps(2)` infinite). The base text underneath remains gray; the green reveal layer fully covers it.

### Hover leave (reverse-wipe, symmetric ~420ms)

User picked the **reverse-wipe** option (caret retracts right-to-left, green un-reveals). Implemented as a natural CSS-transition reversal — when the `:hover` selector no longer matches, the same properties tween back along the same curves.

1. **t = 0ms** — Hover ends. Box transition reverses immediately (unchanged GSAP timeline).
2. **t = 0ms** — Caret blink animation stops (the `:hover` rule that drove `animation` is gone, so the keyframe animation halts; opacity returns to whatever the base transition gives it).
3. **t = 0 → 80ms** — Caret opacity fades back to 0.
4. **t = 0 → 420ms** — Caret `left` returns from `calc(100% + 2px)` to `−2px` (right-to-left retraction), 420ms with `--ease-out`.
5. **t = 0 → 420ms** — Green reveal layer's `clip-path` returns to `inset(0 100% 0 0)` (un-reveal), 420ms with `--ease-out`. Symmetric with enter (no leave-stagger; both pieces retract together).

### Reduced motion (`prefers-reduced-motion: reduce`)

- No caret rendered (kept hidden).
- No `clip-path` transition — the reveal layer is either fully visible (when hovered) or fully hidden (when not), via a flat `opacity` swap with a tiny ~80ms fade.
- The base text color toggles via a simple `transition: color 80ms linear` for the hover state (since the reveal layer no longer carries the green visual).

This matches the project's existing reduced-motion pattern: instant or near-instant state change, no kinetic flourish.

---

## Visual specifics

| Property | Value |
|---|---|
| Reveal duration | 420ms |
| Reveal easing | `--ease-out` (`cubic-bezier(0.22, 1, 0.36, 1)`) |
| Caret travel duration | 420ms (matches reveal) |
| Caret travel easing | `--ease-out` (matches reveal) |
| Caret fade in | 80ms linear |
| Caret blink | 700ms `steps(2)` infinite, starts at +420ms after hover-enter |
| Enter stagger after box | 150ms (`transition-delay`) |
| Leave stagger | 0ms (symmetric retraction with box reverse) |
| Caret width × height | 1px × 92% of em-height |
| Caret start `left` | `−2px` |
| Caret end `left` | `calc(100% + 2px)` |
| Caret color | `var(--color-accent)` (`#10b981`) |
| Reveal text color | `var(--color-accent)` |
| Base text color (rest) | `var(--color-fg-3)` (unchanged) |

---

## Implementation

### `src/components/Logo.astro`

**Markup change** — wrap the `/folio` em into a relative container with two overlay children:

```html
<span class="logo__em" data-logo-em>
  <span class="logo__em-text">{em}</span>
  <span class="logo__em-reveal" aria-hidden="true">{em}</span>
  <span class="logo__em-caret" aria-hidden="true"></span>
</span>
```

The base `.logo__em-text` carries the visible gray text. `.logo__em-reveal` is a positioned-absolute duplicate in green with `clip-path`. `.logo__em-caret` is the blinking line. Both overlay children are `aria-hidden` (the readable text is the base layer; assistive tech sees `/folio` once).

**Style changes:**

- `.logo__em` becomes `position: relative; display: inline-block;`. Removes the `transition: color ...` rule (no longer needed; the reveal handles green).
- New `.logo__em-text` rule (no styles needed beyond inheriting from `.logo__em`; exists as the base text layer).
- New `.logo__em-reveal` rule: `position: absolute; inset: 0; color: var(--color-accent); clip-path: inset(0 100% 0 0); transition: clip-path 420ms var(--ease-out) 0ms; pointer-events: none;` and on `.logo:hover .logo__em-reveal`: `clip-path: inset(0 0 0 0); transition-delay: 150ms;` (delay only on enter).
- New `.logo__em-caret` rule: positioned absolute at `left: −2px; top: 4%; width: 1px; height: 92%; background: var(--color-accent); opacity: 0; transition: opacity 80ms linear, left 420ms var(--ease-out) 0ms; pointer-events: none;` and on `.logo:hover .logo__em-caret`: `left: calc(100% + 2px); opacity: 1; transition-delay: 150ms; animation: logo-em-caret-blink 700ms steps(2) infinite 570ms;` (animation starts 570ms after hover-enter = 150ms stagger + 420ms travel).
- New `@keyframes logo-em-caret-blink`: 0%–50% opacity 1; 50.01%–100% opacity 0.
- Remove the existing `.logo__em--hover` rule (no longer used).
- Reduced-motion override: under `@media (prefers-reduced-motion: reduce)`, set the reveal layer's transition to `opacity 80ms linear` (and use opacity instead of clip-path); hide the caret entirely (`display: none`).

### `src/lib/logo-animation.ts`

In `bindLogo`'s `enter` handler, **remove**:

```ts
emEl.classList.add("logo__em--hover");
gsap.to(emEl, {
  x: 20,
  duration: 0.4,
  ease: "back.out(1.4)",
  overwrite: "auto",
});
```

In the `leave` handler, **remove**:

```ts
emEl.classList.remove("logo__em--hover");
gsap.to(emEl, {
  x: 0,
  duration: 0.34,
  ease: "power2.out",
  overwrite: "auto",
});
```

Keep all other GSAP tweens for the mark, dot, wordmark, and the appear timeline. Keep the `gsap.set(emEl, { x: 30, opacity: 0 })` initial state and the appear-timeline tweens that move emEl to its rest position — these drive the page-load *appear*, which is explicitly retained.

The `emEl` reference in `bindLogo` may still be needed for any leftover focus/blur logic. Re-confirm during plan that no unused references can be cleaned up.

### What gets removed

- The horizontal slide of `/folio` on hover (and its bounce).
- The JS color toggle via `.logo__em--hover`.
- The `.logo__em--hover` CSS rule.

### What stays

- The page-load appear sequence for `/folio` (fade in, slide left to rest).
- The AS↔❯_ box hover transition.
- The dot wink and pulse.
- The wordmark flourish.
- All other appear-timeline behavior.

---

## Accessibility

- The `.logo__em-reveal` and `.logo__em-caret` elements are decorative duplicates / pure ornament, so both are `aria-hidden="true"`. Screen readers continue to read the single base `/folio`.
- The hover state already lives on the parent `<a>` and is keyboard-reachable via `:focus` (existing `focus`/`blur` listeners on the logo). The new CSS rules should target both `:hover` and `:focus-visible` on the logo so keyboard users see the same effect.
- Under `prefers-reduced-motion: reduce`, the caret is hidden and the green crossfades in via opacity rather than animating in via `clip-path`. No motion is perceived.

---

## Out of scope

- Changing any other part of the logo's hover or appear animation.
- Touch/coarse-pointer behavior (the existing `:hover` rule is unchanged; touch users don't trigger hover, which is acceptable for a portfolio nav).
- Theme-specific tuning (light theme inherits the same emerald — no separate keyframes needed).
- Cleanup of any unused GSAP references in `logo-animation.ts` once the `/folio` tweens are removed; flag for the implementation plan but don't expand scope here.
