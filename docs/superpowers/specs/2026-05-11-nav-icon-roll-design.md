# Nav Icon Roll Design — extending the per-char roll to icon-only links

**Date:** 2026-05-11
**Status:** Approved (pending plan)
**Owner:** Alexander Smith
**Builds on:** `2026-05-08-nav-interactions-design.md`

## Context

The nav interactions shipped in the 2026-05-08 spec gave every text link a 460 ms per-character "roll" — each char translates up out of an `overflow: hidden` window, color-flashes accent green at the apex, and another char takes its place from below settling in `--color-fg-1`. The icon-only links in the right cluster (GitHub, LinkedIn, X) were left with a smaller affordance: a 200 ms `transform: scale(1.06)` on the SVG itself on hover/focus. Sitting next to text labels that roll, the icons read as inert.

This spec extends the same roll language to icon links so all links in the nav share one motion vocabulary. The bg slide, halo, and press shrink are unchanged — this only touches what happens *inside* an icon link's content area.

## Goals

- Icon links use the same 460 ms roll register as text links.
- No new JS — the existing `bindPill` / `.replay` machinery in `src/lib/nav-magic.ts` already targets icon links and should drive the roll without modification.
- Identical static appearance: at rest, the icon looks exactly as it does today.
- Reduced-motion behavior is preserved by the existing global rule.

## Non-goals

- Per-icon brand-aware variation (e.g., octocat eye-tilt, "in" bob, X cross-rotate). Considered and rejected during brainstorming as more decisions per icon for less family cohesion.
- Animated icon libraries (Lordicon, Lottie). Heavy and unlikely to match the existing roll.
- Changes to the bg, halo, or press shrink layers.
- Text-link behavior. The text per-char roll stays exactly as specified in the 2026-05-08 doc.

---

## What is being built

### Rolling a single glyph

The text roll uses a keyframe that moves a `.nav__char` translateY `0 → -100% → 110% → 0`. Each char briefly snaps from above-the-window to below-the-window mid-animation; the visual continuity comes from the *neighboring* chars still being in view.

A single icon has no neighbors, so the same keyframe would read as a pop, not a roll. The fix is to give the icon a permanent neighbor: a duplicate SVG positioned one icon-height below the original, both inside an `overflow: hidden` window sized to one icon. On `.replay`, the wrapper translates by exactly one icon-height; the original rolls up out of view as the duplicate rolls into its place.

### Markup change in `src/components/Nav.astro`

Each icon link gains a `.nav__roll--icon` wrapper holding two copies of the same SVG path:

```astro
<a href={github} class="is-icon" aria-label="GitHub" data-nav-link>
  <span class="nav__roll nav__roll--icon" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="…"/></svg>
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="…"/></svg>
  </span>
</a>
```

To avoid duplicating each `<path d="…"/>` inline twice in the template, the three icon paths are hoisted into a small `const navIcons = { github: '…', linkedin: '…', x: '…' }` map at the top of the frontmatter and rendered through `<Fragment set:html={…}/>`. The wrapper itself is inlined per link — only the path data is shared.

### CSS — `.nav__roll--icon` modifier

```css
.nav__roll--icon {
  display: flex;
  flex-direction: column;
  width: 14px;
  height: 14px;
  /* .nav__roll already sets overflow: hidden and line-height: 1.2 */
}
.nav__roll--icon svg {
  flex: 0 0 14px;
  width: 14px;
  height: 14px;
  display: block;
}
```

The wrapper is 14×14 (matching the existing `.is-icon svg` size) but contains 28 px of stacked SVG. The second SVG sits at `translateY(0)` relative to its flex slot — i.e., one icon-height below the first, naturally clipped by the wrapper's `overflow: hidden`.

### CSS — keyframe and trigger

```css
@keyframes nav-icon-roll {
  0%   { transform: translateY(0);    color: var(--color-fg-2); }
  32%  { transform: translateY(-50%); color: var(--color-accent); }
  100% { transform: translateY(-50%); color: var(--color-fg-1); }
}
a[data-nav-link].replay .nav__roll--icon {
  animation: nav-icon-roll 460ms var(--ease-out) forwards;
}
```

`-50%` of the wrapper's content height (28 px) is exactly one icon-height (14 px), so the original rolls fully out as the duplicate rolls fully in. The animation ends in the rolled state (`translateY(-50%)`, `--color-fg-1`) — the duplicate is now the visible icon and stays put. Because the two SVGs are identical, the user can't tell which one is showing; subsequent hovers re-fire `.replay` from the rolled state, which re-resets to `translateY(0)` at the next `replay` toggle (`forwards` holds the end state, but the `bindPill` controller removes `.replay`, force-reflows, and re-adds it on every entry, which restarts the keyframe from 0%).

### Removing the old icon scale

The 2026-05-08 spec added `transform: scale(1.06)` over 200 ms to icon SVGs on hover/focus as a parity gesture. With the roll in place, that rule fights the wrapper's transform and is no longer needed. The two declarations to remove:

```css
.nav__right a.is-icon svg {
  /* keep width/height/etc., remove the transition */
  transition: transform 200ms var(--ease-out);
}
.nav__right a.is-icon:hover svg,
.nav__right a.is-icon:focus-visible svg {
  transform: scale(1.06);
}
```

### Color (text already covered)

The existing rule `.nav__right a:hover, .nav__right a:focus-visible { color: var(--color-fg-1); }` already lifts text color on icon links (icons inherit via `currentColor`). The roll keyframe ends at `--color-fg-1`, which matches that hover color, so the steady-state after the roll equals the steady-state without it. No conflict.

---

## Architecture

### Files

- **Modified:** `src/components/Nav.astro`
  - Frontmatter: add a `navIcons` map (`github`, `linkedin`, `x`) holding each icon's path string.
  - JSX: each of the three icon `<a>` tags wraps its SVG content in `<span class="nav__roll nav__roll--icon" aria-hidden="true">` with two `<svg>` children, each rendering the path via `<Fragment set:html={navIcons.X}/>`.
  - `<style>` block: add `.nav__roll--icon` and child `svg` rules; add `nav-icon-roll` keyframes; add the `a[data-nav-link].replay .nav__roll--icon` selector. Remove the two `.nav__right a.is-icon svg` rules listed above.

- **Unchanged:** `src/lib/nav-magic.ts`. `bindPill` already toggles `.replay` on every `[data-nav-link]` and writes per-char `animation-delay`s based on `.nav__char` queries. Icon links contain zero `.nav__char` elements, so the per-char loop runs zero times and is a harmless no-op. The wrapper-level animation on `.nav__roll--icon` reads `.replay` directly.

### Why no JS change

The existing `flourish(link)` function does:
1. Query `.nav__char` inside the link.
2. Write inline `animation-delay`s to each char.
3. Force a reflow, then add `.replay` to the link.
4. After the animation duration, remove `.replay`.

For icon links, step 1 returns an empty NodeList; step 2 iterates zero times; steps 3 and 4 still run. The animation duration calc (`charCount * staggerMs + animationMs`) reduces to `0 * staggerMs + 460ms = 460ms` for icon links, which exactly matches the roll duration. The `.replay` toggle on the link triggers the wrapper animation through the new selector. Nothing in the controller needs to know icons exist.

### Markup shape (target — right cluster only)

```astro
<div class="nav__right" data-nav-pill>
  <span class="nav__bg" data-nav-bg aria-hidden="true"></span>
  <a href={`mailto:${email}`} aria-label="Email" data-nav-link>
    <span class="nav__roll" aria-hidden="true">…</span>
  </a>
  <a href={github} class="is-icon" aria-label="GitHub" target="_blank" rel="noopener" data-nav-link>
    <span class="nav__roll nav__roll--icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="currentColor"><Fragment set:html={navIcons.github}/></svg>
      <svg viewBox="0 0 24 24" fill="currentColor"><Fragment set:html={navIcons.github}/></svg>
    </span>
  </a>
  <!-- LinkedIn, X same shape -->
  <a href="#contact" aria-label={available} data-nav-link>
    <span class="nav__roll" aria-hidden="true">…</span>
  </a>
</div>
```

---

## Edge cases

- **Mid-roll re-hover.** If the user re-enters an icon link before its roll completes, `bindPill` removes `.replay`, force-reflows, re-adds `.replay`. The wrapper jumps back to `translateY(0)` and rolls again. Same behavior as the text per-char roll today.
- **Sequential roll on the same link.** After the first roll, the wrapper is held at `translateY(-50%)` by the `forwards` fill. Removing `.replay` returns it to `translateY(0)` instantly because no static rule pins the rolled state. The forced reflow before re-adding `.replay` ensures the keyframe restarts from 0%, not mid-cycle.
- **Stacking with `currentColor`.** Both SVGs use `fill="currentColor"`. The keyframe animates `color` on the wrapper, both icons paint that color simultaneously. During the apex flash, both the rolling-out and rolling-in icons show accent green, which reads as a single icon's color flashing through the roll — exactly like the text behavior.
- **Touch / pen.** Inherits the existing `pointer*` event coverage. A tap fires `pointerenter` → `pointerdown` → `pointerup`; the bg appears + presses + releases, the roll fires once, page navigates.
- **HMR / view transitions.** The `data-nav-magic-init` guard on each pill in `bindPill` prevents double-binding. Adding new markup inside a link doesn't disturb that guard.
- **Pre-JS / JS-disabled.** Without `.replay` ever being added, the `nav-icon-roll` animation never runs. The wrapper sits at `translateY(0)`, showing the first SVG. The duplicate stays clipped below. Static appearance is identical to today's nav.
- **Icon size changes.** If `.is-icon svg` width/height ever changes from 14 px, the `.nav__roll--icon` width/height and the `flex: 0 0 14px` value need to change in lockstep, otherwise the `-50%` translate stops aligning. A future refactor could express the size as a single CSS custom property (`--nav-icon-size`) referenced from all three places — out of scope for v1, called out here so a future maintainer doesn't change one and not the others.

## Accessibility

- Both SVGs sit inside a wrapper that's already `aria-hidden="true"`. The duplicate doesn't introduce any new content for assistive tech.
- The `<a>`'s `aria-label` (`"GitHub"`, `"LinkedIn"`, `"X"`) is unchanged.
- Keyboard activation: `bindPill` already adds `.replay` on `focus`. Tabbing to an icon link triggers the same roll as hovering it.
- Reduced motion: the global `prefers-reduced-motion: reduce` rule in `global.css` flattens both `transition-duration` and `animation-duration` to `0.01 ms`, so the roll completes instantly. The duplicate ends up at `translateY(-50%)` immediately, but because both SVGs are identical, the user sees no change. The bg + color shift still apply.

## Manual test plan

1. Hover GitHub, LinkedIn, X in turn → bg slides + halo, icon rolls up with green flash at apex, settles white. The pre-existing `scale(1.06)` artifact is gone.
2. Tab through the right cluster → focus drives the roll on each icon the same way hover does.
3. Mixed sequence: hover Email → GitHub → Available → LinkedIn → Email. The bg interpolates smoothly across mixed text/icon links; each target's flourish (text per-char or icon wrapper) fires once per entry.
4. Press + release on an icon link → bg shrinks 80 ms; icon roll runs on a separate transform layer (the wrapper, not the bg), so the shrink and roll don't fight.
5. Quick re-hover on the same icon mid-roll → roll restarts from `translateY(0)`; no stuck state.
6. OS reduced motion enabled → instant color shift, instant bg appearance, no visible roll.
7. JS disabled (DevTools → Disable JavaScript) → nav looks identical to today's static state; no broken layout from the duplicated SVG.

## Open / deferred

- `--nav-icon-size` custom property to centralize the icon-height value referenced by `.is-icon`, `.nav__roll--icon`, the child `svg`, and the keyframe percentage. Cosmetic; revisit only if the icon size needs to change.
- Per-icon variation (e.g., a different "second" icon for the rolled-in state — filled vs outlined, or a brand-specific glyph). Out of scope; would change the visual character from "roll" to "morph" and merits its own design pass.
