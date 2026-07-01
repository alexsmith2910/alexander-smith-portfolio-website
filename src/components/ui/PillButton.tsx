"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { useExperience } from "@/experience/ExperienceProvider";

/**
 * The signature primary CTA. A pill where, on hover, a filled circle grows from
 * the exact point the cursor entered until it covers the button; the label + arrow
 * crossfade to the inverse tone and the arrow rotates 45°. On exit the circle
 * tracks the cursor's exit point and shrinks back to nothing. Magnetic by default.
 *
 * Two tones: `ink` (dark fill on light surfaces) and `bone` (light fill on dark
 * surfaces / footers). Validated timing: enter power3.inOut .85s, leave power2.out .45s.
 */
export default function PillButton({
  children,
  href,
  onClick,
  tone = "ink",
  magnetic = true,
  cursor = "enter",
  arrow = "→",
  className,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  tone?: "ink" | "bone";
  magnetic?: boolean;
  cursor?: string;
  arrow?: string | null;
  className?: string;
}) {
  const { navigate } = useExperience();
  const elRef = useRef<HTMLAnchorElement | null>(null);
  const fillRef = useRef<HTMLSpanElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const arrowRef = useRef<HTMLSpanElement | null>(null);

  const restText = tone === "ink" ? "#0a0a0a" : "#e8e6e1";
  const fillColor = tone === "ink" ? "#0a0a0a" : "#e8e6e1";
  const overText = tone === "ink" ? "#e8e6e1" : "#0a0a0a";

  // place the fill circle centred on the cursor's local point, sized to cover the
  // whole pill from there (radius = distance to the farthest corner).
  const positionFill = (e: React.MouseEvent) => {
    const el = elRef.current!;
    const fill = fillRef.current!;
    const b = el.getBoundingClientRect();
    const x = e.clientX - b.left;
    const y = e.clientY - b.top;
    const r = Math.hypot(Math.max(x, b.width - x), Math.max(y, b.height - y));
    fill.style.left = `${x - r}px`;
    fill.style.top = `${y - r}px`;
    fill.style.width = `${r * 2}px`;
    fill.style.height = `${r * 2}px`;
  };

  const onEnter = (e: React.MouseEvent) => {
    gsap.killTweensOf([fillRef.current, labelRef.current]);
    positionFill(e);
    gsap.fromTo(
      fillRef.current,
      { scale: 0 },
      { scale: 1, duration: 0.85, ease: "power3.inOut" }
    );
    gsap.to(labelRef.current, { color: overText, duration: 0.5, ease: "power2.out" });
    if (arrowRef.current) gsap.to(arrowRef.current, { rotate: 45, duration: 0.5, ease: "power3.out" });
  };

  const onLeave = (e: React.MouseEvent) => {
    gsap.killTweensOf([fillRef.current, labelRef.current]);
    positionFill(e);
    gsap.to(fillRef.current, { scale: 0, duration: 0.45, ease: "power2.out" });
    gsap.to(labelRef.current, { color: restText, duration: 0.4, ease: "power2.out" });
    if (arrowRef.current) gsap.to(arrowRef.current, { rotate: 0, duration: 0.4, ease: "power2.out" });
    if (magnetic && elRef.current) {
      gsap.to(elRef.current, { x: 0, y: 0, duration: 0.5, ease: "power3.out" });
    }
  };

  const onMove = (e: React.MouseEvent) => {
    if (!magnetic || !elRef.current) return;
    const b = elRef.current.getBoundingClientRect();
    const x = (e.clientX - b.left - b.width / 2) * 0.25;
    const y = (e.clientY - b.top - b.height / 2) * 0.3;
    gsap.to(elRef.current, { x, y, duration: 0.3, ease: "power3.out" });
  };

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
      return;
    }
    if (href) {
      e.preventDefault();
      if (href.startsWith("http") || href.startsWith("mailto")) {
        window.open(href, href.startsWith("http") ? "_blank" : "_self");
      } else {
        navigate(href);
      }
    }
  };

  return (
    <a
      ref={elRef}
      href={href ?? "#"}
      data-cursor={cursor}
      onClick={handleClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onMouseMove={onMove}
      className={`relative inline-flex items-center gap-3 overflow-hidden rounded-full px-[clamp(22px,2vw,30px)] py-[clamp(12px,1.4vh,16px)] font-mono text-[12px] uppercase tracking-[.2em] no-underline border ${
        tone === "ink" ? "border-ink/30" : "border-bone/35"
      } cursor-none${className ? ` ${className}` : ""}`}
    >
      <span
        ref={fillRef}
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{ background: fillColor, transform: "scale(0)", transformOrigin: "center" }}
      />
      <span ref={labelRef} className="relative z-[1] inline-flex items-center gap-3" style={{ color: restText }}>
        {children}
        {arrow && (
          <span ref={arrowRef} className="inline-block">
            {arrow}
          </span>
        )}
      </span>
    </a>
  );
}
