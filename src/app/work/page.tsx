"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";

// useLayoutEffect on the client (apply the hidden start state before paint), useEffect on
// the server to avoid React's SSR warning.
const useIsoLayoutEffect = typeof document !== "undefined" ? useLayoutEffect : useEffect;
import { useExperience } from "@/experience/ExperienceProvider";
import Kicker from "@/components/ui/Kicker";
import SiteFooter from "@/components/SiteFooter";
import DissolvePreview, { type DissolvePreviewHandle } from "@/components/work/DissolvePreview";
import { projects } from "@/data/projects";

export default function WorkIndexPage() {
  const { reduced, navigate } = useExperience();

  const previewRef = useRef<DissolvePreviewHandle | null>(null);

  // header intro refs
  const kickerRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLSpanElement | null>(null);
  const subRef = useRef<HTMLDivElement | null>(null);

  // row refs (one per project, indexed)
  const rowRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const innerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ulRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const arrowRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // ---------- intro entrance ----------
  useIsoLayoutEffect(() => {
    const heads = [kickerRef.current, titleRef.current, subRef.current];
    const rows = rowRefs.current.filter(Boolean) as HTMLAnchorElement[];
    const reveal = () => {
      gsap.killTweensOf([...heads, ...rows]);
      gsap.set(heads, { clearProps: "transform" });
      rows.forEach((r) => (r.style.opacity = "1"));
    };
    if (reduced) {
      reveal();
      return;
    }
    // GSAP owns the hidden start state on its own yPercent channel via gsap.set. The start
    // must NOT come from a CSS `transform` — GSAP parses an existing translateY(%) into its
    // pixel `y` channel and then animates `yPercent` on a separate channel, so the two add
    // and the header never reaches rest (it sits hidden, then a timer snaps it). Runs in a
    // layout effect so the hidden state lands before paint (no flash).
    gsap.set(kickerRef.current, { yPercent: 120 });
    gsap.set(titleRef.current, { yPercent: 116 });
    gsap.set(subRef.current, { yPercent: 120 });
    gsap.set(rows, { opacity: 0 });

    const tl = gsap.timeline();
    tl.to(kickerRef.current, { yPercent: 0, duration: 1.1, ease: "power4.out", delay: 0.15 }, 0);
    tl.to(titleRef.current, { yPercent: 0, duration: 1.2, ease: "power4.out", delay: 0.28 }, 0);
    tl.to(subRef.current, { yPercent: 0, duration: 1.1, ease: "power4.out", delay: 0.5 }, 0);
    tl.to(rows, { opacity: 1, duration: 0.9, ease: "power2.out", stagger: 0.09, delay: 0.6 }, 0);
    const safety = window.setTimeout(reveal, 3200);
    return () => {
      tl.kill();
      clearTimeout(safety);
    };
  }, [reduced]);

  // ---------- row hover ----------
  const onEnter = (i: number) => {
    previewRef.current?.show(i);
    if (!reduced && innerRefs.current[i]) innerRefs.current[i]!.style.transform = "translateX(22px)";
    const ul = ulRefs.current[i];
    if (ul) {
      ul.style.transformOrigin = "left";
      ul.style.transform = "scaleX(1)";
    }
    const ar = arrowRefs.current[i];
    if (ar) {
      ar.style.opacity = "1";
      ar.style.transform = "translateX(0)";
    }
    rowRefs.current.forEach((r, j) => {
      if (r && j !== i) r.style.opacity = "0.34";
    });
  };

  const onLeave = (i: number) => {
    previewRef.current?.hide();
    if (innerRefs.current[i]) innerRefs.current[i]!.style.transform = "translateX(0)";
    const ul = ulRefs.current[i];
    if (ul) {
      ul.style.transformOrigin = "right";
      ul.style.transform = "scaleX(0)";
    }
    const ar = arrowRefs.current[i];
    if (ar) {
      ar.style.opacity = "0";
      ar.style.transform = "translateX(-8px)";
    }
    rowRefs.current.forEach((r) => {
      if (r) r.style.opacity = "1";
    });
  };

  return (
    <div data-view="work">
      <DissolvePreview ref={previewRef} />

      {/* HEADER */}
      <header className="relative z-[1] px-gutter pt-[clamp(120px,18vh,200px)] pb-[clamp(30px,6vh,60px)]">
        <div className="mb-[22px] overflow-hidden">
          <div ref={kickerRef}>
            <Kicker>Index — every project, 2024—26</Kicker>
          </div>
        </div>
        <div className="overflow-hidden pb-[.18em]">
          <h1 className="font-serif text-[clamp(58px,13vw,200px)] font-normal leading-[0.92] tracking-[-.03em]">
            <span ref={titleRef} className="block">
              Selected <span className="italic">work</span>
            </span>
          </h1>
        </div>
        <div className="mt-[clamp(24px,4vh,42px)] flex flex-wrap items-end justify-between gap-5">
          <div className="overflow-hidden">
            <div ref={subRef} className="max-w-[44ch]">
              <p className="text-body opacity-[.7]">
                Five worlds, rendered live in the browser. Hover any line to glimpse it — open one to step inside.
              </p>
            </div>
          </div>
          <span className="font-mono text-xs tracking-[.14em] opacity-[.45]">
            05 projects
          </span>
        </div>
      </header>

      {/* THE INDEX */}
      <main className="relative z-[1] px-gutter pb-[clamp(120px,22vh,260px)]">
        {projects.map((p, i) => (
          <a
            key={p.slug}
            ref={(el) => {
              rowRefs.current[i] = el;
            }}
            href={`/work/${p.slug}`}
            data-cursor="open"
            onMouseEnter={() => onEnter(i)}
            onMouseLeave={() => onLeave(i)}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/work/${p.slug}`);
            }}
            className="relative block border-t border-ink/16 text-inherit no-underline"
            style={{
              opacity: reduced ? 1 : 0,
              transition: "opacity .45s ease",
            }}
          >
            <div
              ref={(el) => {
                innerRefs.current[i] = el;
              }}
              className="flex items-center gap-[clamp(20px,3vw,48px)] py-[clamp(22px,3.4vh,40px)]"
              style={{
                transition: "transform .55s cubic-bezier(.22,1,.36,1)",
                willChange: "transform",
              }}
            >
              <span className="font-mono text-[13px] tracking-[.1em] opacity-[.4] w-[38px] flex-[0_0_38px]">
                {p.no}
              </span>
              <span className="font-serif text-[clamp(34px,5.4vw,76px)] leading-[0.95] tracking-[-.02em] flex-1">
                {p.title}
              </span>
              <span className="font-mono text-xs tracking-[.1em] opacity-[.4] flex-[0_0_auto]">
                {p.year}
              </span>
              <span
                ref={(el) => {
                  arrowRefs.current[i] = el;
                }}
                className="text-[22px] flex-[0_0_auto] [transition:transform_.5s_cubic-bezier(.22,1,.36,1),opacity_.4s_ease]"
                style={{
                  transform: "translateX(-8px)",
                  opacity: 0,
                }}
              >
                →
              </span>
            </div>
            <span
              ref={(el) => {
                ulRefs.current[i] = el;
              }}
              className="absolute left-0 bottom-0 h-px w-full bg-ink [transition:transform_.6s_cubic-bezier(.22,1,.36,1)]"
              style={{
                transform: "scaleX(0)",
                transformOrigin: "left",
              }}
            />
          </a>
        ))}
        <div className="border-t border-ink/16" />
      </main>

      <SiteFooter title={<>Let&rsquo;s build<br />something.</>} />
    </div>
  );
}
