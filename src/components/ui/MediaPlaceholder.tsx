"use client";

import { useId, useRef, type CSSProperties, type ReactNode } from "react";
import { gsap } from "gsap";
import { useExperience } from "@/experience/ExperienceProvider";

/** Striped media well on bone/obsidian with a mono caption naming the asset to
 *  drop in. 3D tilt + a one-shot liquid (SVG displacement) ripple on hover that
 *  distorts only the inner image — the outer border stays crisp — and reverses
 *  smoothly if the cursor leaves before it finishes. */
export default function MediaPlaceholder({
  stripe,
  file,
  tag,
  video = false,
  dark = false,
  height = "clamp(320px,58vh,620px)",
  glow,
  children,
  style,
  cursor = "view",
}: {
  stripe: string;
  file?: string;
  tag?: ReactNode;
  video?: boolean;
  dark?: boolean;
  height?: string;
  /** optional radial accent overlay (e.g. signal colour) */
  glow?: string;
  children?: ReactNode;
  style?: CSSProperties;
  cursor?: string;
}) {
  const { reduced } = useExperience();
  const rawId = useId().replace(/[:]/g, "");
  const filterId = `liquid-${rawId}`;
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLDivElement | null>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement | null>(null);
  const turbRef = useRef<SVGFETurbulenceElement | null>(null);

  const oRef = useRef({ v: 0 });
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const wobbleRaf = useRef(0);

  const setDisp = () => dispRef.current?.setAttribute("scale", oRef.current.v.toFixed(2));
  const startWobble = () => {
    if (wobbleRaf.current) return;
    const spin = (t: number) => {
      wobbleRaf.current = requestAnimationFrame(spin);
      turbRef.current?.setAttribute(
        "baseFrequency",
        `${(0.01 + Math.sin(t * 0.0011) * 0.004).toFixed(4)} ${(0.014 + Math.cos(t * 0.0009) * 0.004).toFixed(4)}`
      );
    };
    wobbleRaf.current = requestAnimationFrame(spin);
  };
  const stopWobble = () => {
    if (wobbleRaf.current) cancelAnimationFrame(wobbleRaf.current);
    wobbleRaf.current = 0;
  };
  const disengage = () => {
    stopWobble();
    oRef.current.v = 0;
    setDisp();
    if (imgRef.current) imgRef.current.style.filter = "none";
  };

  const onMove = (e: React.MouseEvent) => {
    if (reduced || !wrapRef.current) return;
    const b = wrapRef.current.getBoundingClientRect();
    const rx = ((e.clientY - b.top) / b.height - 0.5) * -7;
    const ry = ((e.clientX - b.left) / b.width - 0.5) * 7;
    wrapRef.current.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
  };
  const onEnter = () => {
    if (reduced || !imgRef.current) return;
    imgRef.current.style.filter = `url(#${filterId})`;
    startWobble();
    tlRef.current?.kill();
    gsap.killTweensOf(oRef.current);
    // one-shot ripple: rise then settle. Interruptible by onLeave.
    tlRef.current = gsap
      .timeline({ onComplete: disengage })
      .to(oRef.current, { v: 18, duration: 0.35, ease: "power2.out", onUpdate: setDisp })
      .to(oRef.current, { v: 0, duration: 0.75, ease: "power2.inOut", onUpdate: setDisp });
  };
  const onLeave = () => {
    if (wrapRef.current) wrapRef.current.style.transform = "perspective(1000px) rotateX(0) rotateY(0) scale(1)";
    if (reduced) return;
    tlRef.current?.kill();
    gsap.killTweensOf(oRef.current);
    // reverse smoothly to rest from wherever the ripple currently is
    gsap.to(oRef.current, { v: 0, duration: 0.4, ease: "power2.out", onUpdate: setDisp, onComplete: disengage });
  };

  return (
    <div
      ref={wrapRef}
      data-media=""
      data-cursor={cursor}
      onMouseMove={onMove}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={`relative overflow-hidden transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] [transform-style:preserve-3d] will-change-transform ${
        dark ? "bg-obsidian" : "bg-paper"
      }`}
      style={{ height, ...style }}
    >
      <svg width="0" height="0" className="pointer-events-none absolute" aria-hidden>
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence ref={turbRef} type="fractalNoise" baseFrequency="0.012 0.016" numOctaves={2} seed={7} result="noise" />
            <feDisplacementMap ref={dispRef} in="SourceGraphic" in2="noise" scale={0} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* inner image layer (oversized so the ripple never exposes a gap at the edge) */}
      <div ref={imgRef} className="absolute inset-[-8%] will-change-[filter]">
        <div className="absolute inset-0" style={{ background: stripe }} />
        {glow && <div className="pointer-events-none absolute inset-0" style={{ background: glow }} />}
      </div>

      {video && (
        <div
          className={`absolute left-1/2 top-1/2 flex h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border backdrop-blur-[2px] ${
            dark ? "border-bone/55 bg-obsidian/40" : "border-ink/50 bg-bone/28"
          }`}
        >
          <span
            className={`ml-1 block h-0 w-0 border-y-[9px] border-l-[14px] border-y-transparent ${
              dark ? "border-l-bone" : "border-l-ink"
            }`}
          />
        </div>
      )}

      {file && (
        <span
          className={`absolute bottom-3 left-4 font-mono text-[11px] tracking-[.14em] ${
            dark ? "text-mist" : "text-muted"
          }`}
        >
          {file}
        </span>
      )}
      {tag && (
        <span
          className={`absolute right-4 top-3.5 font-mono text-[10px] uppercase tracking-[.18em] ${
            dark ? "text-mist" : "text-muted"
          }`}
        >
          {tag}
        </span>
      )}
      {children}
    </div>
  );
}
