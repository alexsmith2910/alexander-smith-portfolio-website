"use client";

import { useEffect, useRef } from "react";
import { useExperience } from "./ExperienceProvider";

const LABELS: Record<string, string> = {
  home: "Home",
  enter: "Enter",
  view: "View",
  open: "View",
  read: "Read",
  jump: "View",
  email: "Say hi",
  link: "Open",
  sound: "Audio",
  menu: "Menu",
  scroll: "Scroll",
  contact: "Say hi",
};

export default function Cursor() {
  const ringRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLDivElement | null>(null);
  const { reduced, menuOpen } = useExperience();

  // `difference` blend reads well on the light pages + dark footer, but washes out
  // over the mid-tone violet menu plasma. While the menu is up, switch to a solid
  // light cursor with a dark halo so it stays crisp on the plasma.
  useEffect(() => {
    const ring = ringRef.current;
    const dot = dotRef.current;
    const label = labelRef.current;
    if (!ring || !dot || !label) return;
    const blend = menuOpen ? "normal" : "difference";
    ring.style.mixBlendMode = blend;
    dot.style.mixBlendMode = blend;
    label.style.mixBlendMode = blend;
    ring.style.borderColor = menuOpen ? "rgba(232,230,225,.95)" : "rgba(232,230,225,.6)";
    ring.style.boxShadow = menuOpen ? "0 0 7px rgba(6,6,6,.45)" : "none";
    dot.style.boxShadow = menuOpen ? "0 0 5px 1px rgba(6,6,6,.5)" : "none";
    label.style.textShadow = menuOpen ? "0 1px 6px rgba(6,6,6,.6)" : "none";
  }, [menuOpen]);

  useEffect(() => {
    if (reduced) return;
    const ring = ringRef.current!;
    const dot = dotRef.current!;
    const label = labelRef.current!;
    const cur = { x: window.innerWidth / 2, y: window.innerHeight / 2, ex: window.innerWidth / 2, ey: window.innerHeight / 2 };

    const onMove = (e: PointerEvent) => {
      cur.x = e.clientX;
      cur.y = e.clientY;
      dot.style.transform = `translate(${e.clientX}px,${e.clientY}px) translate(-50%,-50%)`;
      label.style.left = e.clientX + "px";
      label.style.top = e.clientY + "px";
      label.style.transform =
        e.clientX > window.innerWidth - 170
          ? "translate(calc(-100% - 46px),15px)"
          : "translate(35px,15px)";
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    // delegated hover for grow + contextual label
    const interactiveSel = "[data-cursor], a, button, input, textarea, [role='button']";
    const onOver = (e: Event) => {
      const el = (e.target as HTMLElement)?.closest?.(interactiveSel) as HTMLElement | null;
      if (!el) return;
      ring.style.width = "66px";
      ring.style.height = "66px";
      ring.style.background = "rgba(232,230,225,.10)";
      const k = el.getAttribute("data-cursor");
      if (k && LABELS[k]) {
        label.textContent = LABELS[k];
        label.style.opacity = "1";
      }
    };
    const onOut = (e: Event) => {
      const el = (e.target as HTMLElement)?.closest?.(interactiveSel) as HTMLElement | null;
      if (!el) return;
      // ignore moves to a child still inside an interactive el
      const related = (e as MouseEvent).relatedTarget as HTMLElement | null;
      if (related?.closest?.(interactiveSel)) return;
      ring.style.width = "38px";
      ring.style.height = "38px";
      ring.style.background = "transparent";
      label.style.opacity = "0";
    };
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      cur.ex += (cur.x - cur.ex) * 0.18;
      cur.ey += (cur.y - cur.ey) * 0.18;
      ring.style.transform = `translate(${cur.ex}px,${cur.ey}px) translate(-50%,-50%)`;
    };
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return (
    <>
      <div
        ref={ringRef}
        data-cursor-ring=""
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 80,
          pointerEvents: "none",
          width: 38,
          height: 38,
          border: "1px solid rgba(232,230,225,.6)",
          borderRadius: "50%",
          transform: "translate(-50%,-50%)",
          transition: "width .35s cubic-bezier(.22,1,.36,1),height .35s cubic-bezier(.22,1,.36,1),background .35s,border-color .35s,opacity .3s",
          mixBlendMode: "difference",
        }}
      />
      <div
        ref={dotRef}
        data-cursor-dot=""
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 81,
          pointerEvents: "none",
          width: 6,
          height: 6,
          background: "#e8e6e1",
          borderRadius: "50%",
          transform: "translate(-50%,-50%)",
          mixBlendMode: "difference",
        }}
      />
      <div
        ref={labelRef}
        data-cursor-label=""
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 81,
          pointerEvents: "none",
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          color: "#e8e6e1",
          mixBlendMode: "difference",
          opacity: 0,
          transform: "translate(35px,15px)",
          whiteSpace: "nowrap",
          transition: "opacity .3s",
        }}
      />
    </>
  );
}
