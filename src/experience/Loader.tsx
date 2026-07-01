"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useExperience } from "./ExperienceProvider";
import { EASE } from "@/lib/ease";
import { site } from "@/data/site";

const MARK = ["Alexander", "Smith"];

/**
 * First-load intro loader. Lives in SiteChrome (mounts once per hard page load,
 * on ANY route), counts to 100%, then lifts away and signals `ob:introdone`.
 * Subsequent in-app navigations don't remount it, so they use the ink transition.
 *
 * The wordmark masks up on entrance (the house kinetic-type idiom), the counter +
 * meta anchor the corners, and the exit is choreographed (wordmark masks out, meta
 * fades, then the panel lifts) so the load reads as a branded moment, not a spinner.
 */
export default function Loader() {
  const { reduced, introDoneRef } = useExperience();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pctRef = useRef<HTMLSpanElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const topRef = useRef<HTMLDivElement | null>(null);
  const botRef = useRef<HTMLDivElement | null>(null);

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

    // entrance — the wordmark writes itself up (animate y from the inline
    // translateY(115%) → 0, the proven hero/about idiom), meta fades in
    const lines = lineRefs.current.filter(Boolean) as HTMLSpanElement[];
    gsap.to(lines, { y: 0, duration: 1.0, ease: EASE.entrance, stagger: 0.09, delay: 0.06 });
    gsap.fromTo([topRef.current, botRef.current], { opacity: 0 }, { opacity: 1, duration: 0.9, delay: 0.3 });

    let pct = 0;
    let raf = 0;
    const finish = () => {
      if (finished) return;
      finished = true;
      // signal early so the hero entrance can begin as the loader lifts (overlap)
      signalDone();
      if (!root) return;
      root.style.pointerEvents = "none";
      // exit — meta fades, then the whole panel lifts (carrying the wordmark up)
      gsap
        .timeline({ onComplete: () => { root.style.display = "none"; } })
        .to([topRef.current, botRef.current], { opacity: 0, duration: 0.4 }, 0)
        .to(root, { yPercent: -100, duration: 1.05, ease: "power4.inOut" }, 0.2);
    };
    const tick = () => {
      pct += (100 - pct) * 0.06 + 0.6;
      if (pct >= 99.5) pct = 100;
      if (pctRef.current) pctRef.current.textContent = String(Math.round(pct));
      if (barRef.current) barRef.current.style.width = pct + "%";
      if (pct < 100) raf = requestAnimationFrame(tick);
      else window.setTimeout(finish, 320);
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
      className="fixed inset-0 z-[60] flex flex-col justify-between bg-bone px-gutter py-[clamp(24px,4vh,48px)] text-ink"
      style={{ display: reduced ? "none" : "flex" }}
    >
      {/* top meta */}
      <div ref={topRef} className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[.28em] opacity-0">
        <span className="opacity-60">{site.role}</span>
        <span className="opacity-40">{site.location.coords}</span>
      </div>

      {/* centre — masked wordmark reveal (the branded moment) */}
      <div className="flex flex-1 items-center">
        <h1 className="font-serif font-normal leading-[0.92] tracking-[-.03em] text-[clamp(56px,13vw,200px)]">
          {MARK.map((word, i) => (
            <span key={word} className="block overflow-hidden pb-[.12em] mb-[-.1em]">
              <span
                ref={(el) => { lineRefs.current[i] = el; }}
                className={`block ${i === 1 ? "italic" : ""}`}
                style={{ transform: reduced ? "none" : "translateY(115%)" }}
              >
                {word}
              </span>
            </span>
          ))}
        </h1>
      </div>

      {/* bottom — progress bar + counter */}
      <div ref={botRef} className="opacity-0">
        <div className="h-px w-full overflow-hidden bg-ink/15">
          <div ref={barRef} className="h-full bg-ink" style={{ width: "0%" }} />
        </div>
        <div className="mt-[clamp(14px,2vh,22px)] flex items-end justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[.3em] opacity-55">Loading the studio</span>
          <span className="font-serif leading-none text-[clamp(28px,5vw,64px)]">
            <span ref={pctRef}>0</span>
            <span className="ml-[.04em] align-super font-mono text-[.32em]">%</span>
          </span>
        </div>
      </div>
    </div>
  );
}
