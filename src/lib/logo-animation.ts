import { gsap } from "gsap";

/**
 * Mounts the logo's appear + hover animations on every [data-logo] element on
 * the page. Idempotent: a `data-logo-init` flag prevents double-binding when
 * Astro view transitions or HMR re-run the component script.
 *
 * Under prefers-reduced-motion, GSAP is bypassed entirely — the wrapper's CSS
 * fallback animation is cancelled and opacity set to 1 so the logo renders in
 * its static rest state. Hover affordance still works through CSS color rules.
 */
export function initLogo(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const logos = document.querySelectorAll<HTMLAnchorElement>("[data-logo]");
  if (logos.length === 0) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  for (const el of logos) {
    if (el.dataset.logoInit === "true") continue;
    el.dataset.logoInit = "true";

    el.style.animation = "none";

    if (reduceMotion) {
      el.style.opacity = "1";
      continue;
    }

    bindLogo(el);
  }
}

function bindLogo(el: HTMLAnchorElement): void {
  const mark = el.querySelector<HTMLElement>("[data-logo-mark]");
  const restLetters = el.querySelector<HTMLElement>("[data-logo-rest]");
  const altLetters = el.querySelector<HTMLElement>("[data-logo-prompt]");
  const wordmark = el.querySelector<HTMLElement>("[data-logo-wordmark]");
  const emEl = el.querySelector<HTMLElement>("[data-logo-em]");
  const dot = el.querySelector<HTMLElement>("[data-logo-dot]");

  if (!mark || !restLetters || !altLetters || !wordmark || !emEl || !dot) return;

  const restGlyphs = Array.from(
    restLetters.querySelectorAll<HTMLElement>(".logo__mark-glyph"),
  );
  const altGlyphs = Array.from(
    altLetters.querySelectorAll<HTMLElement>(".logo__mark-glyph"),
  );
  const chars = Array.from(
    wordmark.querySelectorAll<HTMLElement>(".logo__char"),
  );

  if (
    restGlyphs.length === 0 ||
    altGlyphs.length === 0 ||
    chars.length === 0
  )
    return;

  // Initial states. Wrapper visible; everything inside parked at its
  // pre-appear position. The alt layer's wrapper is forced visible (overriding
  // the CSS opacity: 0 used for FOUC prevention); its individual glyphs are
  // parked off-screen below so each can roll in with its own stagger.
  gsap.set(el, { opacity: 1 });
  gsap.set(mark, { opacity: 0, y: 6 });
  gsap.set(restGlyphs, { y: "100%", opacity: 0 });
  gsap.set(altLetters, { opacity: 1 });
  gsap.set(altGlyphs, { y: "100%", opacity: 0 });
  gsap.set(dot, { x: 0, y: 0, scale: 1 });
  gsap.set(chars, { y: "110%", opacity: 0 });
  gsap.set(emEl, { x: 30, opacity: 0 });

  const appear = buildAppearTimeline({ mark, restGlyphs, dot, chars, emEl });
  const hover = buildHoverTimeline({ restGlyphs, altGlyphs, dot, emEl });
  const wordmarkFlourish = buildWordmarkFlourishTimeline({ chars });
  const dotWink = buildDotWinkTimeline(dot);
  const dotPulse = buildDotPulseTimeline(dot);

  // Hover splits into multiple pieces. mark (AS↔❯_) is play/reverse via the
  // hover timeline. wordmark roll is a one-shot flourish (restart). dot wink
  // is play/reverse on its own timeline. /folio is CSS-only and not driven
  // from here — it reacts to :hover/:focus-visible directly.
  //
  // Hover handlers are gated behind appearComplete: if the cursor is already
  // over the logo when the page loads, the hover timelines would tween the
  // same chars/glyphs the appear timeline is animating, leaving them stuck
  // at intermediate positions. We hold hover off until appear finishes, then
  // re-fire enter() if the cursor is still over the logo at that moment.
  let appearComplete = false;
  let dotScaleResetTween: gsap.core.Tween | null = null;
  let pulseTimer: ReturnType<typeof setTimeout> | null = null;
  const enter = () => {
    if (!appearComplete) return;
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
  const leave = () => {
    if (!appearComplete) return;
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

  appear.eventCallback("onComplete", () => {
    appearComplete = true;
    if (el.matches(":hover") || document.activeElement === el) {
      enter();
    }
  });

  document.fonts.ready.then(() => appear.play());

  el.addEventListener("mouseenter", enter);
  el.addEventListener("mouseleave", leave);
  el.addEventListener("focus", enter);
  el.addEventListener("blur", leave);
}

interface AppearArgs {
  mark: HTMLElement;
  restGlyphs: HTMLElement[];
  dot: HTMLElement;
  chars: HTMLElement[];
  emEl: HTMLElement;
}

function buildAppearTimeline(args: AppearArgs): gsap.core.Timeline {
  const { mark, restGlyphs, dot, chars, emEl } = args;

  const tl = gsap.timeline({ paused: true });

  tl.to(mark, { opacity: 1, y: 0, duration: 0.36, ease: "power2.out" }, 0);

  tl.to(
    restGlyphs,
    { y: 0, opacity: 1, duration: 0.28, ease: "power2.out" },
    0.1,
  );

  tl.to(
    dot,
    {
      scale: 1.2,
      duration: 0.18,
      ease: "power2.inOut",
      yoyo: true,
      repeat: 1,
    },
    0.2,
  );

  tl.to(
    chars,
    {
      y: 0,
      opacity: 1,
      duration: 0.5,
      ease: "power3.out",
      stagger: 0.024,
    },
    0.22,
  );

  // /folio appears in two beats: fade in fully at +30, then slide left to rest.
  tl.to(emEl, { opacity: 1, duration: 0.22, ease: "power2.out" }, 0.85);
  tl.to(emEl, { x: 0, duration: 0.5, ease: "power3.out" }, 1.07);

  return tl;
}

interface HoverArgs {
  restGlyphs: HTMLElement[];
  altGlyphs: HTMLElement[];
  dot: HTMLElement;
  emEl: HTMLElement;
}

/**
 * Single state-changing hover timeline. Plays forward on enter, reverses on
 * leave. All elements settle into their hover state and stay there until the
 * cursor leaves — no flourishes that auto-revert.
 *
 * Composition:
 *   - AS rolls up and out
 *   - `>_` prompt rolls in from below
 *   - Accent dot drifts straight down (Y only, delayed so it doesn't pass
 *     through the AS letters during their exit)
 */
function buildHoverTimeline(args: HoverArgs): gsap.core.Timeline {
  const { restGlyphs, altGlyphs } = args;
  // dot is handled outside the timeline — see enter/leave handlers.

  const tl = gsap.timeline({ paused: true });

  // AS rolls upward out of the box. back.in gives a subtle anticipation dip
  // on the forward exit; on reverse (hover-leave) the curve plays backward
  // and produces a visible bounce as the letters arrive at rest.
  tl.to(
    restGlyphs,
    {
      y: "-100%",
      opacity: 0,
      duration: 0.24,
      ease: "back.in(1.4)",
      stagger: 0.04,
    },
    0,
  );

  // `❯` and `_` rise into the slot from below per-glyph with a stagger —
  // each lands with a soft bounce so the chevron arrives first, then the
  // underscore lands a beat after, like keys being pressed in sequence.
  tl.to(
    altGlyphs,
    {
      y: 0,
      opacity: 1,
      duration: 0.34,
      ease: "back.out(1.4)",
      stagger: 0.08,
    },
    0.14,
  );

  return tl;
}

/**
 * One-shot trajectory for the dot on each hover-enter. Rolls up and out
 * (synced with AS exit), then circles around and slides back into the
 * corner from the right edge with a soft bounce. Single continuous arc
 * instead of returning along the same vertical column it left from.
 */
function buildDotWinkTimeline(dot: HTMLElement): gsap.core.Timeline {
  const tl = gsap.timeline({ paused: true });
  // Roll up and out — fade and translate above the box.
  tl.to(dot, {
    y: -12,
    opacity: 0,
    duration: 0.18,
    ease: "power2.in",
  });
  // Snap off-screen to the right (the box's overflow: hidden keeps it
  // clipped) and restore opacity so the slide-in is purely positional.
  tl.set(dot, { y: 0, x: 20, opacity: 1 });
  // Slide in from the right with a soft bounce — overshoots slightly past
  // the corner, then settles back to rest.
  tl.to(dot, {
    x: 0,
    duration: 0.4,
    ease: "back.out(1.5)",
  });
  return tl;
}

/**
 * Continuous pulse + halo glow expansion for the accent dot. Loops with yoyo
 * while the cursor is over the logo, paused and explicitly reset to rest by
 * the leave handler. Reads as a "live cursor" indicator beside the `❯_`
 * prompt — pulsing in step with the terminal-prompt vibe.
 */
function buildDotPulseTimeline(dot: HTMLElement): gsap.core.Timeline {
  const tl = gsap.timeline({ paused: true, repeat: -1, yoyo: true });
  tl.to(dot, {
    scale: 1.45,
    "--glow-size": "14px",
    duration: 0.5,
    ease: "sine.inOut",
  });
  return tl;
}

interface WordmarkFlourishArgs {
  chars: HTMLElement[];
}

/**
 * One-shot per-character double-roll flourish on the wordmark. Each character
 * exits upward, jumps to below baseline, and re-enters from below — looks like
 * a clean swap. A color flash overlays via class toggle so theme tokens
 * resolve correctly in both dark and light themes.
 */
function buildWordmarkFlourishTimeline(
  args: WordmarkFlourishArgs,
): gsap.core.Timeline {
  const { chars } = args;

  const tl = gsap.timeline({ paused: true });

  chars.forEach((char, i) => {
    const t = 0.1 + i * 0.018;
    tl.to(
      char,
      { y: "-100%", opacity: 0, duration: 0.18, ease: "power2.in" },
      t,
    );
    tl.set(char, { y: "100%" }, t + 0.18);
    // Roll-in lands with a bounce — same strength as the rest of the family
    // so the bounces feel consistent across the logo.
    tl.to(
      char,
      { y: 0, opacity: 1, duration: 0.24, ease: "back.out(1.4)" },
      t + 0.18,
    );
    tl.add(() => {
      char.classList.remove("logo__char--flash");
      void char.offsetWidth;
      char.classList.add("logo__char--flash");
    }, t + 0.04);
  });

  return tl;
}
