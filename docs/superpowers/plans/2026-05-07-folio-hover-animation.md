# /folio Hover Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/folio` slide-right hover animation with a CSS-only smooth-wipe reveal: a green caret travels left-to-right while a `clip-path`-revealed green copy of the text follows behind it.

**Architecture:** Pure CSS transitions on a relative-positioned `.logo__em` container with two overlay siblings (`.logo__em-reveal` and `.logo__em-caret`). Hover/focus state is driven by `:hover` and `:focus-visible` on the parent `.logo` anchor — no JS for this piece. The existing GSAP machinery for the AS↔❯_ box, dot, wordmark, and the page-load *appear* sequence is left untouched.

**Tech Stack:** Astro 6 component, scoped CSS with Tailwind v4 design tokens (`--color-accent`, `--ease-out`), GSAP 3 for unrelated animations.

**Spec:** `docs/superpowers/specs/2026-05-07-folio-hover-animation-design.md`

---

## File Structure

**Files modified:**

- `src/components/Logo.astro`
  - Markup (lines 47–48): wrap `/folio` em into a relative container with two overlay siblings.
  - Styles: update `.logo__em`; add `.logo__em-text`, `.logo__em-reveal`, `.logo__em-caret`, `:hover`/`:focus-visible` rules, `@keyframes logo-em-caret-blink`; remove `.logo__em--hover`; extend reduced-motion block.
- `src/lib/logo-animation.ts`
  - `bindLogo` `enter` handler (lines 102–104, 105–112): remove the `.logo__em--hover` class toggle and the `gsap.to(emEl, x: 20, ...)` tween.
  - `bindLogo` `leave` handler (lines 122–123, 128–134): remove the matching class toggle and the `gsap.to(emEl, x: 0, ...)` tween.

**Files NOT modified (explicit non-goals):**

- `buildAppearTimeline` and the `gsap.set(emEl, { x: 30, opacity: 0 })` initial state stay — they drive the page-load appear, which the spec retains.
- `buildHoverTimeline`, `buildDotWinkTimeline`, `buildDotPulseTimeline`, `buildWordmarkFlourishTimeline` — out of scope.
- The `HoverArgs` interface still lists `emEl` (and `dot`) as unused arguments. Pre-existing condition; spec explicitly defers this cleanup.

**No test files** — the project has no test suite (only `astro check`). Verification is (a) `pnpm run check` for type/template integrity and (b) manual hover on the dev server (`http://localhost:4321`).

---

## Task 1: Add new markup + base styles (animation invisible at rest)

**Files:**
- Modify: `src/components/Logo.astro` (markup ~line 47; styles ~lines 210–219)

This task introduces the new structure and base CSS *only*. The reveal layer starts fully clipped and the caret starts at opacity 0, so visually nothing changes at rest. Hover currently still triggers the *old* slide+color via the existing JS — that's removed in Task 3.

- [ ] **Step 1: Update the `/folio` em markup**

In `src/components/Logo.astro`, replace the single span at line 47:

```astro
    <span class="logo__em" data-logo-em>{em}</span>
```

with the new three-child structure:

```astro
    <span class="logo__em" data-logo-em>
      <span class="logo__em-text">{em}</span>
      <span class="logo__em-reveal" aria-hidden="true">{em}</span>
      <span class="logo__em-caret" aria-hidden="true"></span>
    </span>
```

- [ ] **Step 2: Update the `.logo__em` style block**

In `src/components/Logo.astro`, replace lines 210–219:

```css
  .logo__em {
    font-family: var(--font-serif);
    font-style: italic;
    color: var(--color-fg-3);
    font-weight: var(--w-regular);
    font-size: 14px;
    will-change: transform, opacity, color;
    /* Smooth color transition for the hover state change (fg-3 → accent). */
    transition: color var(--dur-base) var(--ease-out);
  }
```

with:

```css
  .logo__em {
    position: relative;
    display: inline-block;
    font-family: var(--font-serif);
    font-style: italic;
    color: var(--color-fg-3);
    font-weight: var(--w-regular);
    font-size: 14px;
    will-change: transform, opacity;
  }

  /* Base text layer — inherits font + color from .logo__em. Exists so the
     reveal layer can overlay it cleanly. */
  .logo__em-text {
    position: relative;
  }

  /* Green-colored duplicate of the em text. Stacked over .logo__em-text via
     absolute positioning; clipped from the right at rest. The :hover rule
     animates clip-path to inset(0 0 0 0), revealing left-to-right. */
  .logo__em-reveal {
    position: absolute;
    inset: 0;
    color: var(--color-accent);
    clip-path: inset(0 100% 0 0);
    transition: clip-path 420ms var(--ease-out) 0ms;
    pointer-events: none;
  }

  /* Vertical 1px caret. Sits at the left edge invisible at rest; on hover
     fades in and travels to past-the-right-edge in sync with the reveal,
     then loops a steps(2) blink. */
  .logo__em-caret {
    position: absolute;
    left: -2px;
    top: 4%;
    width: 1px;
    height: 92%;
    background: var(--color-accent);
    opacity: 0;
    transition:
      opacity 80ms linear,
      left 420ms var(--ease-out) 0ms;
    pointer-events: none;
  }
```

- [ ] **Step 3: Run type / template check**

Run: `pnpm run check`

Expected: completes with no errors. (Astro check parses the template + TypeScript; the new markup is valid Astro.)

- [ ] **Step 4: Visually verify rest state in dev server**

Run: `pnpm run dev`

Open `http://localhost:4321`. Verify:
- The logo renders with `Alexander Smith /folio` exactly as before.
- No visible caret line, no visible green text — only the gray italic `/folio`.
- Hovering still shows the *old* slide-right + green color (because Task 3 hasn't removed the old JS yet). This is expected.

- [ ] **Step 5: Commit**

```bash
git add src/components/Logo.astro
git commit -m "Add /folio reveal + caret structure (rest-invisible)"
```

---

## Task 2: Wire hover + focus to drive the wipe and caret

**Files:**
- Modify: `src/components/Logo.astro` (styles, append after the `.logo__em-caret` block from Task 1)

This task adds the `:hover` / `:focus-visible` rules that animate `clip-path` and `left`/`opacity`, plus the blink keyframes. After this task the new wipe is visible on hover *alongside* the old slide+color from the existing JS — they coexist briefly until Task 3 removes the old behavior.

- [ ] **Step 1: Add the hover/focus CSS rules**

In `src/components/Logo.astro`, append immediately after the `.logo__em-caret` block (after the closing `}` of the rule added in Task 1):

```css
  /* Hover / keyboard-focus drives the wipe + caret. The transition-delay
     override (150ms only on enter; 0ms on leave) staggers the wipe so the
     AS↔❯_ box transition starts visibly first. */
  .logo:hover .logo__em-reveal,
  .logo:focus-visible .logo__em-reveal {
    clip-path: inset(0 0 0 0);
    transition-delay: 150ms;
  }

  .logo:hover .logo__em-caret,
  .logo:focus-visible .logo__em-caret {
    left: calc(100% + 2px);
    opacity: 1;
    transition-delay: 150ms;
    /* Blink begins after the 150ms stagger + 420ms travel = 570ms. */
    animation: logo-em-caret-blink 700ms steps(2) infinite 570ms;
  }

  @keyframes logo-em-caret-blink {
    0%,
    50% {
      opacity: 1;
    }
    50.01%,
    100% {
      opacity: 0;
    }
  }
```

- [ ] **Step 2: Visually verify the wipe + caret on hover**

Dev server should hot-reload. Hover the logo. Verify:
- A short delay (~150ms) after the AS↔❯_ box starts transitioning, a green caret appears at the left edge of `/folio` and travels rightward.
- A green-colored copy of `/folio` reveals left-to-right behind the caret.
- After the wipe completes, the caret blinks at the far right (700ms cadence).
- Mouse off: the caret retracts right-to-left and the green un-reveals (reverse-wipe).
- The OLD slide-right + base-color shift is also still happening (the JS hasn't been removed yet) — this is expected for one more task.

- [ ] **Step 3: Verify keyboard focus path**

Tab to the logo from elsewhere on the page. Verify the same wipe + caret play on focus. Tab away — verify the reverse plays.

- [ ] **Step 4: Commit**

```bash
git add src/components/Logo.astro
git commit -m "Drive /folio wipe + caret on hover/focus"
```

---

## Task 3: Remove the old slide+color hover behavior from JS

**Files:**
- Modify: `src/lib/logo-animation.ts` (`bindLogo` `enter` handler ~lines 102–112; `leave` handler ~lines 122–134)

After this task the only hover-time animation on `/folio` is the new CSS-driven wipe + caret. The page-load appear sequence is untouched.

- [ ] **Step 1: Remove the JS class toggle and GSAP tween from `enter`**

In `src/lib/logo-animation.ts`, find the `enter` arrow function inside `bindLogo` (starting around line 92). Delete these two contiguous chunks:

```ts
    emEl.classList.add("logo__em--hover");
```

and:

```ts
    // /folio slides right with a bounce. overwrite: "auto" kills any pending
    // leave tween so rapid hover-toggles don't compound.
    gsap.to(emEl, {
      x: 20,
      duration: 0.4,
      ease: "back.out(1.4)",
      overwrite: "auto",
    });
```

After the edit, the `enter` body should look like:

```ts
  const enter = () => {
    if (dotScaleResetTween) {
      dotScaleResetTween.kill();
      dotScaleResetTween = null;
    }
    if (pulseTimer) {
      clearTimeout(pulseTimer);
      pulseTimer = null;
    }
    hover.play();
    wordmarkFlourish.restart();
    dotWink.play();
    // Wait for the wink (~580ms) before starting the pulse so the dot's
    // x/y/opacity changes don't fight the pulse's scale/glow tweens.
    pulseTimer = setTimeout(() => dotPulse.play(0), 600);
  };
```

- [ ] **Step 2: Remove the matching pieces from `leave`**

Still in `bindLogo`, delete from the `leave` arrow function:

```ts
    emEl.classList.remove("logo__em--hover");
```

and:

```ts
    // /folio glides smoothly back to rest — no bounce on the return so it
    // doesn't risk crossing over into "Smith".
    gsap.to(emEl, {
      x: 0,
      duration: 0.34,
      ease: "power2.out",
      overwrite: "auto",
    });
```

After the edit, the `leave` body should look like:

```ts
  const leave = () => {
    if (pulseTimer) {
      clearTimeout(pulseTimer);
      pulseTimer = null;
    }
    hover.reverse();
    dotPulse.pause();
    // Wink reverses: slides off right, snaps above, rolls down to corner.
    dotWink.reverse();
    // Scale/glow were left at intermediate values by the paused pulse — tween
    // them back to rest in parallel with the wink reverse.
    dotScaleResetTween = gsap.to(dot, {
      scale: 1,
      "--glow-size": "6px",
      duration: 0.32,
      ease: "power2.out",
    });
  };
```

- [ ] **Step 3: Run type check**

Run: `pnpm run check`

Expected: completes with no errors. The `emEl` reference is still used by the appear timeline (`gsap.set(emEl, { x: 30, opacity: 0 })` and `tl.to(emEl, ...)` calls), so it remains a live identifier — no unused-variable warning.

- [ ] **Step 4: Visually verify hover is now wipe-only**

Dev server reloads. Hover the logo. Verify:
- `/folio` does NOT slide right anymore.
- `/folio`'s base text color does NOT shift (the green now lives entirely in the reveal layer).
- The wipe + caret + blink still play exactly as in Task 2.
- Hover-leave: reverse-wipe still plays; no slide-back tween.
- Page reload: the appear sequence still plays normally — `/folio` fades in and slides into rest position from the right.

- [ ] **Step 5: Commit**

```bash
git add src/lib/logo-animation.ts
git commit -m "Remove /folio slide+color tweens (replaced by CSS wipe)"
```

---

## Task 4: Remove the now-unused `.logo__em--hover` CSS rule

**Files:**
- Modify: `src/components/Logo.astro` (delete lines 221–225 of the original file — adjust if line numbers shifted from Task 1's edit)

The `.logo__em--hover` rule existed solely to provide the green color while the JS class toggle was active. With the toggle gone (Task 3), the rule is dead code.

- [ ] **Step 1: Delete the dead CSS rule**

In `src/components/Logo.astro`, find and delete this block:

```css
  /* Hover state for /folio: persistent green while the cursor is over the
     logo. Toggled on/off by JS in step with the mark transformation. */
  .logo__em--hover {
    color: var(--color-accent);
  }
```

- [ ] **Step 2: Visually verify no regression**

Dev server reloads. Hover the logo. Verify the wipe + caret + blink still play exactly the same. (Removing dead CSS should produce zero visual change.)

- [ ] **Step 3: Commit**

```bash
git add src/components/Logo.astro
git commit -m "Remove dead .logo__em--hover CSS rule"
```

---

## Task 5: Add reduced-motion override

**Files:**
- Modify: `src/components/Logo.astro` (the existing `@media (prefers-reduced-motion: reduce)` block, which currently spans lines 232–238 of the original — adjust for shifted line numbers)

Under reduced motion the caret is hidden entirely and the green crossfades in via `opacity` instead of animating via `clip-path`. This matches the project's existing reduced-motion pattern (instant or near-instant state change, no kinetic flourish).

- [ ] **Step 1: Extend the reduced-motion block**

In `src/components/Logo.astro`, find the existing reduced-motion block:

```css
  /* ---------- Reduced motion: cancel the fallback fade, render immediately ---------- */
  @media (prefers-reduced-motion: reduce) {
    .logo {
      opacity: 1;
      animation: none;
    }
  }
```

Replace it with:

```css
  /* ---------- Reduced motion: cancel the fallback fade, render immediately;
     swap the /folio wipe for a flat opacity crossfade and hide the caret ---------- */
  @media (prefers-reduced-motion: reduce) {
    .logo {
      opacity: 1;
      animation: none;
    }

    .logo__em-caret {
      display: none;
    }

    .logo__em-reveal {
      clip-path: inset(0 0 0 0);
      opacity: 0;
      transition: opacity 80ms linear;
    }

    .logo:hover .logo__em-reveal,
    .logo:focus-visible .logo__em-reveal {
      opacity: 1;
      transition-delay: 0ms;
    }
  }
```

Note: the `.logo__em-reveal` is reset to fully unclipped (so opacity controls visibility), and the hover/focus rule from Task 2 is overridden to drive `opacity` instead of `clip-path` and to drop the 150ms stagger.

- [ ] **Step 2: Verify reduced-motion behavior**

Enable reduced motion in your OS, OR open Chrome DevTools → Rendering panel → "Emulate CSS media feature prefers-reduced-motion" → "reduce".

Hover the logo. Verify:
- No caret appears.
- The green `/folio` simply fades in over ~80ms (no horizontal wipe).
- Hover-leave: the green fades out over ~80ms.
- The rest of the logo (AS box, dot, wordmark) likely also has its own reduced-motion handling — that's not changed here.

- [ ] **Step 3: Commit**

```bash
git add src/components/Logo.astro
git commit -m "Add /folio reduced-motion override (opacity crossfade)"
```

---

## Task 6: Final integration verification

**Files:**
- No code changes. Verification only.

- [ ] **Step 1: Verify production build**

Run: `pnpm run build`

Expected: build completes with no errors. (The new CSS uses standard properties — `clip-path`, `transform`, `opacity`, `transition`, `@keyframes` — all of which Astro's CSS pipeline passes through unchanged.)

- [ ] **Step 2: Run type/template check one more time**

Run: `pnpm run check`

Expected: 0 errors, 0 warnings.

- [ ] **Step 3: Full hover walk-through in dev server**

Run: `pnpm run dev`. Open `http://localhost:4321`. Verify each scenario:

| Scenario | Expected behavior |
|---|---|
| Page load | `/folio` fades in then slides left into place (the appear sequence is untouched). |
| Hover enter | AS↔❯_ box flips first; ~150ms later, caret appears at `/folio`'s left edge and travels right; green reveals behind it; caret blinks at the far right after ~570ms. |
| Hover leave | Caret stops blinking, retracts right-to-left; green un-reveals (reverse-wipe). The base text remains gray throughout. |
| Rapid hover toggle | No compounding / no broken state — each enter/leave cleanly drives the CSS transition. |
| Keyboard focus (Tab) | Same wipe + caret play. |
| Keyboard blur (Tab away) | Reverse-wipe plays. |
| Reduced motion | Caret hidden; `/folio` simply crossfades green↔gray on hover. |
| Dark / light theme | Both use `var(--color-accent)`; verify no visual issue if you toggle `.theme-light` on `<html>` via DevTools (the existing light-theme overrides apply automatically). |
| Console | No errors or warnings emitted by the logo on hover/focus. |

- [ ] **Step 4: No final commit needed if Step 3 surfaces no issues**

If any scenario above fails, debug and commit a fix before claiming the plan complete.

---

## Out of scope (do not address in this plan)

- Cleanup of the unused `emEl` and `dot` parameters in the `HoverArgs` interface in `src/lib/logo-animation.ts` (lines 207–209). Pre-existing dead arguments; the spec explicitly defers this.
- Changes to the appear timeline or any other GSAP-driven hover piece (mark, dot, wordmark).
- Touch / coarse-pointer behavior — the spec accepts the existing `:hover`-only model.
- Any new tests — the project has no test suite; manual verification is the established pattern.
