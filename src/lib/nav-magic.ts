/**
 * Mounts the nav pill's sliding bg + glow halo + press shrink + per-character
 * flourish on every [data-nav-pill] element on the page. Idempotent: a
 * `data-nav-magic-init` flag prevents double-binding when Astro view
 * transitions or HMR re-run the component script.
 *
 * Pointer (hover/press) and keyboard (focus/Enter) drive the same controller —
 * tabbing through the nav slides the bg the same way mouse hover does, and
 * pressing Enter on a focused link triggers the press-shrink. Space is
 * intentionally NOT bound (browsers treat Space on `<a>` as page-scroll, not
 * activation).
 */
export function initNavMagic(): void {
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

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  let currentTarget: HTMLAnchorElement | null = null;
  let pendingRollTimer: number | null = null;
  const replayClearTimers = new Map<HTMLAnchorElement, number>();

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

    // Cancel any in-flight cleanup timer from a previous flourish on this
    // same link so it can't yank the `.replay` class out from under the new
    // animation.
    const stale = replayClearTimers.get(link);
    if (stale !== undefined) window.clearTimeout(stale);

    // Remove the class once the full roll completes, and remember the timer
    // so we can cancel it if a fresh flourish lands first.
    const totalMs = chars.length * staggerMs + 460;
    const timerId = window.setTimeout(() => {
      link.classList.remove("replay");
      replayClearTimers.delete(link);
    }, totalMs);
    replayClearTimers.set(link, timerId);
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
    replayClearTimers.forEach((id) => window.clearTimeout(id));
    replayClearTimers.clear();
    currentTarget = null;
  };

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

  pill.addEventListener("pointerleave", () => hide());
  pill.addEventListener("focusout", (e) => {
    const next = e.relatedTarget as HTMLElement | null;
    if (!next || !pill.contains(next)) hide();
  });
}
