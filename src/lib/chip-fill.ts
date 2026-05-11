/**
 * Mounts a circle-grow hover fill on every [data-chip-cta] button on the page.
 *
 * On mouseenter an emerald disc expands outward from the cursor entry point
 * until it covers the button surface. Text, bullet and arrow crossfade to the
 * dark accent-fg so they stay legible against the emerald, and the arrow
 * rotates 45° to point right. On mouseleave the disc tracks the cursor's exit
 * point and shrinks back to a point. Skipped entirely under
 * prefers-reduced-motion.
 *
 * Idempotent: a `data-chip-fill-init` flag prevents double-binding under HMR.
 */
import gsap from "gsap";

export function initChipFill(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const buttons = document.querySelectorAll<HTMLButtonElement>("[data-chip-cta]");
  if (buttons.length === 0) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  for (const btn of buttons) {
    if (btn.dataset.chipFillInit === "true") continue;
    btn.dataset.chipFillInit = "true";
    if (reduceMotion) continue;
    bindChip(btn);
  }
}

function bindChip(btn: HTMLButtonElement): void {
  const fill   = btn.querySelector<HTMLElement>(".stage__chip-fill");
  const label  = btn.querySelector<HTMLElement>(".stage__chip-label");
  const arrow  = btn.querySelector<SVGElement>(".stage__chip-arrow");
  const bullet = btn.querySelector<HTMLElement>(".stage__chip-bullet");
  if (!fill || !label || !arrow || !bullet) return;

  gsap.set(fill, { xPercent: -50, yPercent: -50, scale: 0 });

  // Kills any in-flight or scheduled tween on every animated target so a quick
  // hover-out can't be overtaken by a still-pending hover-in tween (the bug
  // that left the label stuck on black).
  const killAll = (): void => {
    gsap.killTweensOf([fill, label, arrow, bullet]);
  };

  btn.addEventListener("mouseenter", (e) => {
    const r  = btn.getBoundingClientRect();
    const x  = e.clientX - r.left;
    const y  = e.clientY - r.top;
    const dx = Math.max(x, r.width  - x);
    const dy = Math.max(y, r.height - y);
    // .stage__chip-fill is 100×100 — scale so its radius reaches the farthest corner.
    const target = Math.sqrt(dx * dx + dy * dy) / 50 + 0.4;

    killAll();
    gsap.set(fill, { x, y });
    gsap.to(fill, {
      scale: target,
      duration: 0.85,
      ease: "power3.inOut",
    });

    gsap.to(label,  { color: "#04130d", duration: 0.4,  ease: "power2.out", delay: 0.2 });
    gsap.to(arrow,  { color: "#04130d", rotate: 45, x: 2, duration: 0.55, ease: "power3.out" });
    gsap.to(bullet, {
      backgroundColor: "#04130d",
      boxShadow: "0 0 0 3px rgba(4,19,13,0.18), 0 0 10px rgba(4,19,13,0.32)",
      duration: 0.4,
      ease: "power2.out",
      delay: 0.2,
    });
  });

  btn.addEventListener("mouseleave", (e) => {
    const r = btn.getBoundingClientRect();
    const x = Math.max(0, Math.min(r.width,  e.clientX - r.left));
    const y = Math.max(0, Math.min(r.height, e.clientY - r.top));

    // Leave uses power2.out — fast initial drop, soft landing — so reversing
    // mid-state doesn't sit on a slow power3.inOut ease-in and feel paused.
    killAll();
    gsap.to(fill, {
      x, y,
      scale: 0,
      duration: 0.45,
      ease: "power2.out",
    });

    gsap.to(label,  { color: "#b8b8b3", duration: 0.3, ease: "power2.out" });
    gsap.to(arrow,  { color: "#7a7a75", rotate: 0, x: 0, duration: 0.35, ease: "power2.out" });
    gsap.to(bullet, {
      backgroundColor: "#10b981",
      boxShadow: "0 0 0 3px rgba(16,185,129,0.12), 0 0 10px rgba(16,185,129,0.35)",
      duration: 0.3,
      ease: "power2.out",
    });
  });
}
