# Nav Interactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade both nav pills (`.nav__pill` and `.nav__right`) so hover/focus drives a single shared sliding background with a growing emerald halo, presses shrink the bg without touching the text, and the active button text rolls per character — matching the cinematic register of the Logo component.

**Architecture:** Vanilla CSS transitions on a single absolutely-positioned `<span class="nav__bg">` per pill (animated via `left`/`width`/`opacity`/`transform`), with a small inline TypeScript controller in the Astro `<script>` block that measures button rects on `pointerenter`/`focus`, toggles `is-visible`/`is-pressing` classes, and schedules the per-character flourish 50 ms after the cursor lands. No GSAP — the choreography is simple enough that CSS plus ~90 LOC of glue code is the right scale of tool. If the controller crosses ~120 LOC during implementation, lift it to `src/lib/nav-magic.ts` (mirrors the Logo.astro / logo-animation.ts split).

**Tech Stack:** Astro 6 component, scoped CSS with Tailwind v4 design tokens (`--color-accent`, `--color-fg-1`, `--color-fg-2`, `--ease-out`, `--radius-pill`), TypeScript inline in `<script>`. Uses `Pointer Events` for mouse/pen/touch parity.

**Spec:** `docs/superpowers/specs/2026-05-08-nav-interactions-design.md`

---

## File Structure

**Files modified:**

- `src/components/Nav.astro`
  - Frontmatter: define `navLinksLeft` and `navLinksRight` arrays so the JSX can iterate.
  - Markup (lines 21–69): wrap each text link's label in `<span class="nav__roll">` with one `<span class="nav__char">` per character; add `<span class="nav__bg" data-nav-bg>` as the first child of each pill; add `data-nav-pill` to both pill containers and `data-nav-link` to every `<a>`; ensure every `<a>` has an explicit `aria-label`.
  - Styles (lines 88–203): add `.nav__bg`, `.nav__bg::after`, `.is-visible`, `.is-pressing`, `.nav__roll`, `.nav__char`, `@keyframes nav-char-roll`, icon SVG transition; modify `.nav__pill`/`.nav__right` to add `position: relative`; modify `.nav__pill a`/`.nav__right a` to add `position: relative; z-index: 1` and drop `background` from their `transition`; remove `background` from the existing `:hover` rules; remove the `.theme-light` override block (the project has no theme toggle).
  - Script: add a new `<script>` block containing `initNavMagic()` and `bindPill()` inline.

**Files NOT modified (explicit non-goals):**

- `src/components/Logo.astro` and `src/lib/logo-animation.ts` — the logo's motion is the reference, not a target. Untouched.
- `src/styles/global.css` — the existing reduced-motion rule already flattens transitions/animations under `prefers-reduced-motion: reduce`; no changes needed there.
- The center pill's `.nav__pill-mark` (green chevron divider) — markup and styling untouched. The controller ignores it because handlers bind only to `[data-nav-link]`.

**No new lib file** unless the inline controller crosses ~120 LOC. The plan as written produces ~90 LOC of script — well under that threshold.

**No test files** — the project has no test suite (only `astro check`). Verification is (a) `pnpm run check` for type/template integrity and (b) manual interaction on the dev server (`http://localhost:4321`).

---

## Task 1: Update markup — char-split, data attributes, aria-labels

**Files:**
- Modify: `src/components/Nav.astro` (frontmatter + markup section, lines 1–69)

This task changes only structure. No CSS or JS changes yet — the page must render identically to before. Each text-bearing `<a>` gets its label split into per-character `<span>`s, every pill gets a `<span class="nav__bg">` first child (invisible without styles, so no visual effect yet), and data attributes are added so the controller can find pills and links.

- [ ] **Step 1: Add link arrays to frontmatter**

In `src/components/Nav.astro`, replace the existing frontmatter (lines 1–19) with:

```astro
---
import Logo from "./Logo.astro";

interface Props {
  email?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  available?: string;
}

const {
  email = "hello@alexsmith.dev",
  github = "#",
  linkedin = "#",
  twitter = "#",
  available = "Available June 2026",
} = Astro.props;

const navLinksLeft = [
  { href: "#work", label: "Work" },
  { href: "#writing", label: "Writing" },
];
const navLinksRight = [
  { href: "#workshop", label: "Workshop" },
  { href: "#about", label: "About" },
];
---
```

- [ ] **Step 2: Replace the markup body**

Replace lines 21–69 (the entire `<header class="nav fade-up">…</header>` block) with:

```astro
<header class="nav fade-up">
  <Logo />

  <nav class="nav__pill" aria-label="Primary" data-nav-pill>
    <span class="nav__bg" data-nav-bg aria-hidden="true"></span>
    {
      navLinksLeft.map(({ href, label }) => (
        <a href={href} aria-label={label} data-nav-link>
          <span class="nav__roll" aria-hidden="true">
            {[...label].map((ch) => (
              <span class="nav__char">{ch === " " ? " " : ch}</span>
            ))}
          </span>
        </a>
      ))
    }
    <span class="nav__pill-mark" aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M5 12h14"></path>
        <path d="m12 5 7 7-7 7"></path>
      </svg>
    </span>
    {
      navLinksRight.map(({ href, label }) => (
        <a href={href} aria-label={label} data-nav-link>
          <span class="nav__roll" aria-hidden="true">
            {[...label].map((ch) => (
              <span class="nav__char">{ch === " " ? " " : ch}</span>
            ))}
          </span>
        </a>
      ))
    }
  </nav>

  <div class="nav__right" data-nav-pill>
    <span class="nav__bg" data-nav-bg aria-hidden="true"></span>
    <a href={`mailto:${email}`} aria-label="Email" data-nav-link>
      <span class="nav__roll" aria-hidden="true">
        {[..."Email"].map((ch) => <span class="nav__char">{ch}</span>)}
      </span>
    </a>
    <a
      href={github}
      class="is-icon"
      aria-label="GitHub"
      target="_blank"
      rel="noopener"
      data-nav-link
    >
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.69 1.25 3.35.96.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18.91-.25 1.89-.38 2.86-.38.97 0 1.95.13 2.86.38 2.18-1.49 3.14-1.18 3.14-1.18.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.36-5.25 5.65.41.36.78 1.05.78 2.12v3.14c0 .31.21.67.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"
        ></path>
      </svg>
    </a>
    <a
      href={linkedin}
      class="is-icon"
      aria-label="LinkedIn"
      target="_blank"
      rel="noopener"
      data-nav-link
    >
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.22 8h4.56v14H.22V8zm7.55 0h4.37v1.92h.06c.61-1.15 2.1-2.36 4.32-2.36 4.62 0 5.48 3.04 5.48 7v7.44h-4.56v-6.59c0-1.57-.03-3.59-2.18-3.59-2.19 0-2.52 1.71-2.52 3.48V22H7.77V8z"
        ></path>
      </svg>
    </a>
    <a
      href={twitter}
      class="is-icon"
      aria-label="X"
      target="_blank"
      rel="noopener"
      data-nav-link
    >
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z"
        ></path>
      </svg>
    </a>
    <a href="#contact" aria-label={available} data-nav-link>
      <span class="nav__roll" aria-hidden="true">
        {[...available].map((ch) => (
          <span class="nav__char">{ch === " " ? " " : ch}</span>
        ))}
      </span>
    </a>
  </div>
</header>
```

- [ ] **Step 3: Run type-check**

Run: `pnpm run check`
Expected: PASS — no template or type errors.

- [ ] **Step 4: Run dev server and verify visual no-op**

Run: `pnpm run dev`
Open `http://localhost:4321` in a browser.

- The nav pill should look identical to before this task: same labels (Work, Writing, Workshop, About on the center pill; Email + 3 social icons + "Available June 2026" on the right pill), same colors, same hover behavior (the *old* hover bg is still in CSS — it'll be removed in Task 2).
- Open DevTools → Elements. Confirm:
  - Each pill has `data-nav-pill` and a child `<span class="nav__bg" data-nav-bg>` as its first child.
  - Each `<a>` has `data-nav-link` and an explicit `aria-label`.
  - Each text-bearing `<a>` contains a `<span class="nav__roll" aria-hidden="true">` with one `<span class="nav__char">` per character.

- [ ] **Step 5: Commit**

```bash
git add src/components/Nav.astro
git commit -m "feat(nav): add data attributes and per-character text split for upcoming hover treatment"
```

---

## Task 2: Sliding bg + glow halo + press shrink (CSS + controller core)

**Files:**
- Modify: `src/components/Nav.astro` (style block + new script block)

This task delivers the headline visual change: a single bg pill slides between buttons with the emerald halo growing in, and presses shrink it. The old per-link hover background is removed. After this task, hovering text or icon buttons shows the new sliding bg; clicking shrinks it; leaving the pill fades it out. Per-character text rolling and keyboard support arrive in Tasks 3 and 5.

- [ ] **Step 1: Update the `.nav__pill` and `.nav__right` containers**

In `src/components/Nav.astro`, find the `.nav__pill` rule (currently lines ~89–101) and add `position: relative;` so the absolutely-positioned bg can anchor to it. Replace the existing rule with:

```css
  .nav__pill {
    justify-self: center;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 5px;
    background: rgba(17, 17, 20, 0.6);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--color-line-1);
    border-radius: var(--radius-pill);
    box-shadow: var(--shadow-1);
    position: relative;
  }
```

Find the `.nav__right` rule (currently lines ~148–159) and apply the same change:

```css
  .nav__right {
    justify-self: end;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px;
    background: rgba(17, 17, 20, 0.6);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--color-line-1);
    border-radius: var(--radius-pill);
    position: relative;
  }
```

- [ ] **Step 2: Update link rules — stack above the bg, drop background transition**

Find the `.nav__pill a` rule (currently lines ~102–116) and replace it with:

```css
  .nav__pill a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: var(--w-medium);
    color: var(--color-fg-2);
    border-radius: var(--radius-pill);
    letter-spacing: -0.005em;
    text-decoration: none;
    position: relative;
    z-index: 1;
    transition: color var(--dur-fast) var(--ease-out);
  }
```

Find the `.nav__pill a:hover` rule (currently lines ~117–120) and replace it with:

```css
  .nav__pill a:hover,
  .nav__pill a:focus-visible {
    color: var(--color-fg-1);
  }
```

Find the `.nav__right a` rule (currently lines ~160–173) and replace it with:

```css
  .nav__right a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    font-size: 13px;
    color: var(--color-fg-2);
    font-weight: var(--w-medium);
    border-radius: var(--radius-pill);
    text-decoration: none;
    position: relative;
    z-index: 1;
    transition: color var(--dur-fast) var(--ease-out);
  }
```

Find the `.nav__right a:hover` rule (currently lines ~174–177) and replace it with:

```css
  .nav__right a:hover,
  .nav__right a:focus-visible {
    color: var(--color-fg-1);
  }
```

- [ ] **Step 3: Add the sliding bg, glow halo, and state classes**

Insert the following block after the `.nav__right a.is-icon svg` rule (currently around line 187, before the `.theme-light` overrides block):

```css
  /* ---------- Sliding bg (shared per pill) ---------- */
  .nav__bg {
    position: absolute;
    top: 5px;
    bottom: 5px;
    left: 0;
    width: 0;
    border-radius: var(--radius-pill);
    background: linear-gradient(
      180deg,
      rgba(245, 245, 244, 0.12),
      rgba(245, 245, 244, 0.04)
    );
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.10),
      inset 0 0 0 1px rgba(245, 245, 244, 0.06);
    opacity: 0;
    pointer-events: none;
    z-index: 0;
    transform-origin: center;
    transition:
      left 320ms var(--ease-out),
      width 320ms var(--ease-out),
      opacity 200ms var(--ease-out),
      transform 80ms var(--ease-out);
  }
  .nav__bg.is-visible {
    opacity: 1;
  }
  .nav__bg.is-pressing {
    transform: scale(0.9);
  }

  /* Emerald halo grows in on first appearance, rides along during slides. */
  .nav__bg::after {
    content: "";
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
  .nav__bg.is-visible::after {
    opacity: 1;
    transform: scale(1);
  }
```

- [ ] **Step 4: Remove the now-unused `.theme-light` override block**

The project has no global theme toggle; the existing `.theme-light` rules in this component are dead code. Delete the entire block (currently lines ~189–193):

```css
  /* ---------- Light theme overrides ---------- */
  :global(.theme-light) .nav__pill,
  :global(.theme-light) .nav__right {
    background: rgba(255, 255, 255, 0.7);
  }
```

- [ ] **Step 5: Add the inline controller `<script>` block**

Insert a new `<script>` block immediately before the closing `</style>` tag's preceding line (i.e., after the `<style>` block, at the bottom of the file just before EOF):

```astro
<script>
  function initNavMagic(): void {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    const pills = document.querySelectorAll<HTMLElement>("[data-nav-pill]");
    if (pills.length === 0) return;

    for (const pill of pills) {
      if (pill.dataset.navMagicInit === "true") continue;
      pill.dataset.navMagicInit = "true";
      bindPill(pill);
    }
  }

  function bindPill(pill: HTMLElement): void {
    const bg = pill.querySelector<HTMLElement>("[data-nav-bg]");
    const links = Array.from(
      pill.querySelectorAll<HTMLAnchorElement>("a[data-nav-link]"),
    );
    if (!bg || links.length === 0) return;

    let currentTarget: HTMLAnchorElement | null = null;

    const moveTo = (link: HTMLAnchorElement): void => {
      const r = link.getBoundingClientRect();
      const pr = pill.getBoundingClientRect();
      const left = r.left - pr.left;
      const width = r.width;

      const justAppearing = !bg.classList.contains("is-visible");
      if (justAppearing) {
        // Snap to position with transitions disabled, then fade in.
        bg.style.transition = "none";
        bg.style.left = `${left}px`;
        bg.style.width = `${width}px`;
        // Force reflow so the snap takes effect before re-enabling transitions.
        void bg.offsetWidth;
        bg.style.transition = "";
        bg.classList.add("is-visible");
      } else if (link !== currentTarget) {
        bg.style.left = `${left}px`;
        bg.style.width = `${width}px`;
      }
      currentTarget = link;
    };

    const hide = (): void => {
      bg.classList.remove("is-visible");
      bg.classList.remove("is-pressing");
      currentTarget = null;
    };

    for (const link of links) {
      link.addEventListener("pointerenter", () => moveTo(link));
      link.addEventListener("pointerdown", () =>
        bg.classList.add("is-pressing"),
      );
      link.addEventListener("pointerup", () =>
        bg.classList.remove("is-pressing"),
      );
      link.addEventListener("pointerleave", () =>
        bg.classList.remove("is-pressing"),
      );
      link.addEventListener("pointercancel", () =>
        bg.classList.remove("is-pressing"),
      );
    }

    pill.addEventListener("pointerleave", () => hide());
  }

  initNavMagic();
</script>
```

- [ ] **Step 6: Run type-check**

Run: `pnpm run check`
Expected: PASS — no errors.

- [ ] **Step 7: Verify in the browser**

Run: `pnpm run dev` and open `http://localhost:4321`.

- Slowly hover Work → Writing → Workshop → About: the bg slides smoothly from one to the next, with the emerald halo visibly growing in (scale + opacity) when the bg first appears.
- Press and hold any button: the bg shrinks to ~0.9 scale within 80 ms; release: it springs back to 1.
- Hover the green chevron between Writing and Workshop: the bg stays parked on the previously hovered button.
- While sliding the bg from Writing → Workshop, watch the chevron. The chevron paints above the bg by default (later in DOM order, both positioned). If the bg's halo glow visibly bleeds through the chevron's green pill in a way that looks wrong, add `z-index: 2;` to the existing `.nav__pill-mark` rule (currently around lines 121–131) to clip the halo at the chevron's bounds. Most likely no fix is needed.
- Move the cursor away from the entire pill: the bg fades out over 200 ms.
- Repeat all of the above on the right pill (Email + 3 icons + Available).
- Open DevTools → Elements and watch a `.nav__bg` element while hovering: `left`, `width`, and the `is-visible` / `is-pressing` classes should toggle.

- [ ] **Step 8: Commit**

```bash
git add src/components/Nav.astro
git commit -m "feat(nav): add sliding bg with growing emerald halo and press-shrink behavior"
```

---

## Task 3: Per-character flourish on hover (CSS + controller flourish)

**Files:**
- Modify: `src/components/Nav.astro` (style block + script block)

This task adds the rolling-text flourish on text-bearing buttons. Each character rolls up, color-flashes accent green at the apex, snaps below the line, and rolls back to settle at `--color-fg-1`. The controller schedules the flourish 50 ms after `pointerenter` and cancels if the user moves to another button before it fires. Stagger is capped on long labels. Reduced motion skips the schedule entirely.

- [ ] **Step 1: Add roll/char styles + keyframes**

Insert the following block in the `<style>` section, after the `.nav__bg.is-visible::after` rule from Task 2:

```css
  /* ---------- Per-character text flourish ---------- */
  .nav__roll {
    display: inline-flex;
    overflow: hidden;
    line-height: 1.2;
  }
  .nav__char {
    display: inline-block;
    will-change: transform, color;
  }
  a[data-nav-link].replay .nav__char {
    animation: nav-char-roll 460ms var(--ease-out) forwards;
  }

  @keyframes nav-char-roll {
    0% {
      transform: translateY(0);
      color: var(--color-fg-2);
    }
    32% {
      transform: translateY(-100%);
      color: var(--color-accent);
    }
    32.01% {
      transform: translateY(110%);
    }
    100% {
      transform: translateY(0);
      color: var(--color-fg-1);
    }
  }
```

- [ ] **Step 2: Extend the controller with flourish scheduling**

Edit the controller in the `<script>` block to add the flourish logic. Replace the entire body of `bindPill(pill)` with:

```ts
  function bindPill(pill: HTMLElement): void {
    const bg = pill.querySelector<HTMLElement>("[data-nav-bg]");
    const links = Array.from(
      pill.querySelectorAll<HTMLAnchorElement>("a[data-nav-link]"),
    );
    if (!bg || links.length === 0) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let currentTarget: HTMLAnchorElement | null = null;
    let pendingRollTimer: number | null = null;

    const cancelPendingRoll = (): void => {
      if (pendingRollTimer !== null) {
        window.clearTimeout(pendingRollTimer);
        pendingRollTimer = null;
      }
    };

    const flourish = (link: HTMLAnchorElement): void => {
      const chars = Array.from(
        link.querySelectorAll<HTMLElement>(".nav__char"),
      );
      if (chars.length === 0) return; // icon-only links — nothing to roll

      // Stagger cap: short labels keep 22 ms/char (matches the logo wordmark).
      // Long labels compress to keep total stagger ≤ ~264 ms.
      const staggerMs = Math.min(22, Math.floor(264 / chars.length));
      chars.forEach((char, i) => {
        char.style.animationDelay = `${i * staggerMs}ms`;
      });

      link.classList.remove("replay");
      // Force reflow so re-adding `replay` retriggers the animation.
      void link.offsetWidth;
      link.classList.add("replay");

      // Remove the class once the full roll completes.
      const totalMs = chars.length * staggerMs + 460;
      window.setTimeout(() => link.classList.remove("replay"), totalMs);
    };

    const moveTo = (link: HTMLAnchorElement): void => {
      const r = link.getBoundingClientRect();
      const pr = pill.getBoundingClientRect();
      const left = r.left - pr.left;
      const width = r.width;

      const justAppearing = !bg.classList.contains("is-visible");
      if (justAppearing) {
        bg.style.transition = "none";
        bg.style.left = `${left}px`;
        bg.style.width = `${width}px`;
        void bg.offsetWidth;
        bg.style.transition = "";
        bg.classList.add("is-visible");
      } else if (link !== currentTarget) {
        bg.style.left = `${left}px`;
        bg.style.width = `${width}px`;
      }
      currentTarget = link;

      cancelPendingRoll();
      if (!reduceMotion) {
        pendingRollTimer = window.setTimeout(() => {
          if (currentTarget === link) flourish(link);
        }, 50);
      }
    };

    const hide = (): void => {
      bg.classList.remove("is-visible");
      bg.classList.remove("is-pressing");
      cancelPendingRoll();
      currentTarget = null;
    };

    for (const link of links) {
      link.addEventListener("pointerenter", () => moveTo(link));
      link.addEventListener("pointerdown", () =>
        bg.classList.add("is-pressing"),
      );
      link.addEventListener("pointerup", () =>
        bg.classList.remove("is-pressing"),
      );
      link.addEventListener("pointerleave", () =>
        bg.classList.remove("is-pressing"),
      );
      link.addEventListener("pointercancel", () =>
        bg.classList.remove("is-pressing"),
      );
    }

    pill.addEventListener("pointerleave", () => hide());
  }
```

- [ ] **Step 3: Run type-check**

Run: `pnpm run check`
Expected: PASS — no errors.

- [ ] **Step 4: Verify in the browser**

With `pnpm run dev` running, visit `http://localhost:4321`.

- Hover Work → ~50 ms after the bg starts moving, every character rolls up, flashes green at the apex, then rolls back from below to settle bright white.
- Hover Work → quickly move to Writing → Writing's flourish fires; Work's does not (because the timer was cancelled).
- Hover "Available June 2026" → flourish completes faster than a 22 ms stagger × 17 chars would imply (because the cap kicks in). Eyeball check: total roll feels under ~750 ms.
- Hover the GitHub/LinkedIn/X icons → bg slides in, no roll fires (icon links have no `.nav__char` children).
- Toggle OS-level reduced motion (System Settings → Accessibility on macOS, or Windows equivalent) and refresh. Hovering should snap the bg into place with no character roll.

- [ ] **Step 5: Commit**

```bash
git add src/components/Nav.astro
git commit -m "feat(nav): add per-character text flourish on hover with capped stagger"
```

---

## Task 4: Subtle icon scale on hover

**Files:**
- Modify: `src/components/Nav.astro` (style block)

Tiny polish task. The icon-only links (GitHub/LinkedIn/X) get the same bg + press treatment as text links, but without text to roll, they can feel inert next to the rolling text. A 1.06× scale on the inner SVG over 200 ms gives them parity.

- [ ] **Step 1: Add the icon SVG transition**

Find the existing `.nav__right a.is-icon svg` rule (currently around lines 184–187) and replace it with:

```css
  .nav__right a.is-icon svg {
    width: 14px;
    height: 14px;
    transition: transform 200ms var(--ease-out);
  }
  .nav__right a.is-icon:hover svg,
  .nav__right a.is-icon:focus-visible svg {
    transform: scale(1.06);
  }
```

- [ ] **Step 2: Run type-check**

Run: `pnpm run check`
Expected: PASS.

- [ ] **Step 3: Verify in the browser**

With `pnpm run dev` running, hover GitHub/LinkedIn/X. Each icon scales up slightly (~1.06×) over 200 ms when the bg arrives, and returns when you move off.

- [ ] **Step 4: Commit**

```bash
git add src/components/Nav.astro
git commit -m "feat(nav): add subtle icon scale on hover for icon-only nav buttons"
```

---

## Task 5: Keyboard focus + Enter-key press support

**Files:**
- Modify: `src/components/Nav.astro` (script block)

Accessibility task. Tab focus drives the bg the same way `pointerenter` does; tabbing out fades it. Pressing Enter on a focused link adds `is-pressing` and removes it on key release, giving keyboard users the same press feedback as mouse users. Space is intentionally not bound (browsers treat Space on `<a>` as page-scroll).

- [ ] **Step 1: Add focus and key handlers to `bindPill`**

In the `<script>` block, find the `for (const link of links)` loop in `bindPill` and replace it with:

```ts
    for (const link of links) {
      link.addEventListener("pointerenter", () => moveTo(link));
      link.addEventListener("focus", () => moveTo(link));
      link.addEventListener("pointerdown", () =>
        bg.classList.add("is-pressing"),
      );
      link.addEventListener("pointerup", () =>
        bg.classList.remove("is-pressing"),
      );
      link.addEventListener("pointerleave", () =>
        bg.classList.remove("is-pressing"),
      );
      link.addEventListener("pointercancel", () =>
        bg.classList.remove("is-pressing"),
      );
      link.addEventListener("keydown", (e) => {
        if (e.key === "Enter") bg.classList.add("is-pressing");
      });
      link.addEventListener("keyup", (e) => {
        if (e.key === "Enter") bg.classList.remove("is-pressing");
      });
    }
```

- [ ] **Step 2: Add the pill-level `focusout` handler**

Below the existing `pill.addEventListener("pointerleave", () => hide());` line, add:

```ts
    pill.addEventListener("focusout", (e) => {
      const next = e.relatedTarget as HTMLElement | null;
      if (!next || !pill.contains(next)) hide();
    });
```

- [ ] **Step 3: Run type-check**

Run: `pnpm run check`
Expected: PASS.

- [ ] **Step 4: Verify in the browser**

With `pnpm run dev` running:

- Tab into the page from the URL bar; focus should land on the Logo first, then advance through the nav links. As each link gains focus, the bg slides to it and the flourish fires (same as hover).
- Tab through all links and onto the next focusable element on the page. The bg should fade out as focus leaves the pill.
- Tab back into a link, press Enter: the bg shrinks to 0.9 while Enter is held, returns when released, and the link activates (anchor scroll or new tab for icons).
- Tab back into a link, press Space: the page scrolls (default browser behavior); the bg should NOT show a press shrink.

- [ ] **Step 5: LOC check — lift to lib if needed**

Open `src/components/Nav.astro` and count the lines inside the `<script>` block (excluding the wrapping `<script>` tags). If the count exceeds **120 LOC**, lift the controller to a new file:

1. Create `src/lib/nav-magic.ts` with `export function initNavMagic()` and the `bindPill` helper, copied verbatim from the inline script.
2. Replace the inline `<script>` block in `Nav.astro` with:
   ```astro
   <script>
     import { initNavMagic } from "~/lib/nav-magic";
     initNavMagic();
   </script>
   ```
3. Run `pnpm run check` again to verify the import resolves.

If the count is at or under 120 LOC (expected: ~90), keep it inline.

- [ ] **Step 6: Commit**

```bash
git add src/components/Nav.astro
# If lifted to lib in Step 5:
# git add src/lib/nav-magic.ts
git commit -m "feat(nav): add keyboard focus and Enter-key press support"
```

---

## Task 6: Final manual verification (full spec test plan)

**Files:** None modified — verification only.

Run through the manual test plan from the spec section "Manual test plan". This is the gold standard for sign-off.

- [ ] **Step 1: Run dev server**

Run: `pnpm run dev`
Open `http://localhost:4321`.

- [ ] **Step 2: Run all 10 spec test-plan items**

For each item, perform the action and confirm the expected behavior.

1. **Slow hover** across all four center-pill buttons → bg slides smoothly, flourish fires ~50 ms after each `pointerenter`.
2. **Fast hover** across → bg races; flourish only fires on the resting target.
3. **Leave + re-enter** on a different button → bg fades out, snaps in at the new target.
4. **Press + release** on the same button → shrink to 0.90 (~80 ms) + spring back.
5. **Press + drag off** → shrink while held, returns when the cursor leaves the link bounds.
6. **Tab through** the nav → bg follows focus through each link in order.
7. **Enter** on a focused link → press shrink + spring back; activates the link normally. Space scrolls without firing the press visual.
8. **Hover the green chevron divider** → bg stays on the previously hovered button.
9. **Repeat 1–8 on the right cluster** (Email + 3 icons + Available); icon buttons get bg + press + a small SVG scale, no flourish.
10. **OS-level reduced motion enabled** → no animation; hover color still changes; bg appears instantly at the target.

If any item fails, file the issue against the corresponding task above and re-run the relevant verification steps.

- [ ] **Step 3: Run final type-check + production build**

```bash
pnpm run check
pnpm run build
```

Both should complete without errors. The build output should include the updated `Nav.astro` with the new motion behavior.

- [ ] **Step 4: Final commit (if any cleanup happened)**

If steps above produced no further changes, no commit is needed. If you made adjustments during verification, commit them with a descriptive message.

---

## Summary

After all 6 tasks land, the nav has:
- A single sliding background per pill that moves between buttons with a buttery 320 ms `var(--ease-out)` interpolation.
- An emerald halo that grows in (scale 0.78 → 1, opacity 0 → 1) on first appearance.
- A bg shrink to scale 0.90 on press (mouse and keyboard Enter), springing back on release.
- Per-character text flourish on text-bearing links, gated to fire 50 ms after the bg starts moving (with stagger capped on long labels).
- Subtle icon scale on hover/focus for the social icons.
- Keyboard focus parity with mouse hover.
- Reduced-motion support via the existing global rule plus an explicit JS skip on the flourish timer.
- No light-theme machinery — the dead `.theme-light` block in `Nav.astro` is removed (project has no theme toggle; local "light areas" are deferred).
