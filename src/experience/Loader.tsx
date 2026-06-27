"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useExperience } from "./ExperienceProvider";
import { site } from "@/data/site";

/**
 * First-load intro loader. Lives in SiteChrome (mounts once per hard page load,
 * on ANY route), counts to 100%, then lifts away and signals `ob:introdone`.
 * Subsequent in-app navigations don't remount it, so they use the ink transition.
 */
export default function Loader() {
  const { reduced, introDoneRef } = useExperience();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pctRef = useRef<HTMLSpanElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    let finished = false;
    const signalDone = () => {
      introDoneRef.current = true;
      window.dispatchEvent(new Event("ob:introdone"));
    };

    if (reduced) {
      if (root) root.style.display = "none";
      signalDone();
      return;
    }

    let pct = 0;
    let raf = 0;
    const finish = () => {
      if (finished) return;
      finished = true;
      signalDone();
      if (root) {
        root.style.pointerEvents = "none";
        gsap.to(root, {
          yPercent: -100,
          duration: 1.1,
          ease: "power4.inOut",
          onComplete: () => {
            root.style.display = "none";
          },
        });
      }
    };
    const tick = () => {
      pct += (100 - pct) * 0.06 + 0.6;
      if (pct >= 99.5) pct = 100;
      if (pctRef.current) pctRef.current.textContent = String(Math.round(pct));
      if (barRef.current) barRef.current.style.width = pct + "%";
      if (pct < 100) raf = requestAnimationFrame(tick);
      else window.setTimeout(finish, 300);
    };
    raf = requestAnimationFrame(tick);
    const safety = window.setTimeout(finish, 4000);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(safety);
    };
  }, [reduced, introDoneRef]);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[60] flex-col items-center justify-center bg-bone text-ink"
      style={{
        display: reduced ? "none" : "flex",
      }}
    >
      <div className="font-serif text-[clamp(72px,16vw,220px)] leading-[0.9] tracking-[-.02em]">
        <span ref={pctRef}>0</span>
        <span className="text-[.3em] align-super font-mono ml-[.08em]">%</span>
      </div>
      <div className="mt-6 w-[min(70vw,420px)] h-px bg-ink/18 overflow-hidden">
        <div ref={barRef} className="h-full bg-ink" style={{ width: "0%" }} />
      </div>
      <div className="mt-[18px] font-mono text-[11px] tracking-[.3em] uppercase opacity-[.55]">
        {site.name} &nbsp;/&nbsp; loading
      </div>
    </div>
  );
}
