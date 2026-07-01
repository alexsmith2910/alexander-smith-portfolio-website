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

// keys that morph the cursor into a large filled disc with the label centred
// inside it (the media / "view" affordance), vs a small ring + side label.
const DISC = new Set(["view", "open", "jump"]);

export default function Cursor() {
  const ringRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLDivElement | null>(null);
  const trailRef = useRef<HTMLDivElement | null>(null);
  const { reduced } = useExperience();

  useEffect(() => {
    if (reduced) return;
    const ring = ringRef.current!;
    const dot = dotRef.current!;
    const label = labelRef.current!;
    const trail = trailRef.current!;
    const cur = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      ex: window.innerWidth / 2,
      ey: window.innerHeight / 2,
      tx: window.innerWidth / 2,
      ty: window.innerHeight / 2,
    };
    let mode: "idle" | "link" | "disc" = "idle";

    const onMove = (e: PointerEvent) => {
      cur.x = e.clientX;
      cur.y = e.clientY;
      dot.style.transform = `translate(${e.clientX}px,${e.clientY}px) translate(-50%,-50%)`;
      if (mode !== "disc") {
        // side label follows the pointer (flips left near the right edge)
        label.style.left = e.clientX + "px";
        label.style.top = e.clientY + "px";
        label.style.transform =
          e.clientX > window.innerWidth - 170 ? "translate(calc(-100% - 46px),15px)" : "translate(35px,15px)";
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const interactiveSel = "[data-cursor], a, button, input, textarea, [role='button']";
    const setIdle = () => {
      mode = "idle";
      ring.style.width = "38px";
      ring.style.height = "38px";
      ring.style.background = "transparent";
      ring.style.borderColor = "rgba(232,230,225,.6)";
      dot.style.opacity = "1";
      label.style.opacity = "0";
    };
    const onOver = (e: Event) => {
      const el = (e.target as HTMLElement)?.closest?.(interactiveSel) as HTMLElement | null;
      if (!el) return;
      const k = el.getAttribute("data-cursor");
      const disc = !!k && DISC.has(k);
      mode = disc ? "disc" : "link";
      if (disc) {
        ring.style.width = "92px";
        ring.style.height = "92px";
        ring.style.background = "rgba(232,230,225,.14)";
        ring.style.borderColor = "transparent";
        dot.style.opacity = "0";
      } else {
        ring.style.width = "60px";
        ring.style.height = "60px";
        ring.style.background = "rgba(232,230,225,.08)";
        ring.style.borderColor = "rgba(232,230,225,.6)";
        dot.style.opacity = "1";
      }
      if (k && LABELS[k]) {
        label.textContent = LABELS[k];
        label.style.opacity = "1";
      } else {
        label.style.opacity = "0";
      }
    };
    const onOut = (e: Event) => {
      const el = (e.target as HTMLElement)?.closest?.(interactiveSel) as HTMLElement | null;
      if (!el) return;
      const related = (e as MouseEvent).relatedTarget as HTMLElement | null;
      if (related?.closest?.(interactiveSel)) return;
      setIdle();
    };
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      cur.ex += (cur.x - cur.ex) * 0.18;
      cur.ey += (cur.y - cur.ey) * 0.18;
      ring.style.transform = `translate(${cur.ex}px,${cur.ey}px) translate(-50%,-50%)`;
      // soft inertia trail — a slower-lagging ring behind the cursor (hidden over media)
      cur.tx += (cur.x - cur.tx) * 0.09;
      cur.ty += (cur.y - cur.ty) * 0.09;
      trail.style.transform = `translate(${cur.tx}px,${cur.ty}px) translate(-50%,-50%)`;
      trail.style.opacity = mode === "disc" ? "0" : "0.35";
      if (mode === "disc") {
        // label rides centred inside the disc (follows the lerped ring, not the pointer)
        label.style.left = cur.ex + "px";
        label.style.top = cur.ey + "px";
        label.style.transform = "translate(-50%,-50%)";
      }
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
        ref={trailRef}
        data-cursor-trail=""
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 79,
          pointerEvents: "none",
          width: 30,
          height: 30,
          border: "1px solid rgba(232,230,225,.5)",
          borderRadius: "50%",
          transform: "translate(-50%,-50%)",
          opacity: 0.35,
          mixBlendMode: "difference",
          transition: "opacity .3s",
        }}
      />
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
          transition:
            "width .4s cubic-bezier(.22,1,.36,1),height .4s cubic-bezier(.22,1,.36,1),background .4s,border-color .4s,opacity .3s",
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
          transition: "opacity .3s",
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
