"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useExperience } from "@/experience/ExperienceProvider";
import Kicker from "@/components/ui/Kicker";
import Reveal from "@/components/ui/Reveal";
import SiteFooter from "@/components/SiteFooter";
import { aboutIntro, processActs, capabilities, recognition } from "@/data/about";

export default function AboutPage() {
  const { reduced } = useExperience();

  const kickerRef = useRef<HTMLDivElement | null>(null);
  const subRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // ---------- intro masked reveal ----------
  useEffect(() => {
    const reveal = () => {
      lineRefs.current.forEach((l) => l && (l.style.transform = "translateY(0)"));
      if (kickerRef.current) kickerRef.current.style.transform = "translateY(0)";
      if (subRef.current) subRef.current.style.transform = "translateY(0)";
    };

    if (reduced) {
      reveal();
      return;
    }

    const tl = gsap.timeline();
    tl.to(kickerRef.current, { y: 0, duration: 1.1, ease: "power4.out", delay: 0.15 })
      .to(
        lineRefs.current.filter(Boolean),
        { y: 0, duration: 1.2, stagger: 0.12, ease: "power4.out" },
        0.28
      )
      .to(subRef.current, { y: 0, duration: 1.1, ease: "power4.out" }, 0.72);

    // safety: never leave the header hidden
    const safety = window.setTimeout(reveal, 2300);
    return () => {
      tl.kill();
      clearTimeout(safety);
    };
  }, [reduced]);

  return (
    <div data-view="about">
      {/* HEADER */}
      <header
        id="top"
        className="relative z-[1] min-h-screen flex flex-col justify-center px-gutter pt-[clamp(120px,18vh,200px)] pb-[clamp(40px,8vh,80px)]"
      >
        <div className="overflow-hidden mb-[clamp(20px,4vh,40px)]">
          <div ref={kickerRef} style={{ transform: reduced ? "none" : "translateY(120%)" }}>
            <Kicker>{aboutIntro.kicker}</Kicker>
          </div>
        </div>

        <h1 className="font-serif font-normal text-[clamp(32px,6.6vw,124px)] leading-[1.02] tracking-[-.03em]">
          {aboutIntro.titleLines.map((line, i) => (
            <span key={i} className="block overflow-hidden pb-[.14em] mb-[-.12em]">
              <span
                ref={(el) => {
                  lineRefs.current[i] = el;
                }}
                className={`block whitespace-nowrap${i === 2 ? " italic" : ""}`}
                style={{ transform: reduced ? "none" : "translateY(115%)" }}
              >
                {line}
              </span>
            </span>
          ))}
        </h1>

        <div className="mt-[clamp(28px,5vh,52px)] flex justify-between items-end flex-wrap gap-5">
          <div className="overflow-hidden">
            <div ref={subRef} className="max-w-[48ch]" style={{ transform: reduced ? "none" : "translateY(120%)" }}>
              <p className="text-body opacity-[.7]">{aboutIntro.sub}</p>
            </div>
          </div>
          <span className="font-mono text-xs tracking-[.14em] opacity-[.45]">
            {aboutIntro.meta}
          </span>
        </div>
      </header>

      {/* LEAD STATEMENT */}
      <section className="relative z-[1] px-gutter pt-[clamp(40px,10vh,140px)] pb-[clamp(40px,8vh,100px)]">
        <Reveal className="max-w-[1100px] font-serif text-[clamp(26px,3.6vw,56px)] leading-[1.18] tracking-[-.015em]">
          <span dangerouslySetInnerHTML={{ __html: aboutIntro.lead }} />
        </Reveal>
      </section>

      {/* PROCESS */}
      <section className="relative z-[1] px-gutter pt-0 pb-[clamp(40px,8vh,120px)]">
        <Reveal className="font-mono text-xs tracking-[.3em] uppercase text-ink/50 mb-[clamp(20px,4vh,40px)] border-b border-ink/16 pb-[18px]">
          The process — five acts
        </Reveal>

        {processActs.map((a) => (
          <Reveal
            key={a.no}
            className="flex gap-[clamp(24px,5vw,90px)] flex-wrap items-start py-[clamp(28px,5vh,56px)] border-b border-ink/12"
          >
            <div className="flex-[0_0_auto] font-serif text-[clamp(30px,4vw,64px)] italic opacity-[.3] min-w-[2.5ch]">
              {a.no}
            </div>
            <div className="flex-[1_1_240px]">
              <h3 className="font-serif text-[clamp(28px,3.4vw,52px)] tracking-[-.02em] leading-none">
                {a.title}
              </h3>
            </div>
            <div className="flex-[1_1_360px]">
              <p className="text-[clamp(14px,1.3vw,17px)] leading-[1.6] opacity-[.7] max-w-[46ch]">
                {a.body}
              </p>
            </div>
          </Reveal>
        ))}
      </section>

      {/* CAPABILITIES + RECOGNITION */}
      <section className="relative z-[1] px-gutter pt-[clamp(50px,10vh,140px)] pb-[clamp(100px,20vh,240px)]">
        <Reveal className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[clamp(36px,6vw,90px)]">
          <div>
            <div className="font-mono text-xs tracking-[.3em] uppercase opacity-[.5] mb-[26px]">
              Capabilities
            </div>
            <ul className="list-none font-serif text-[clamp(22px,2.4vw,34px)] leading-[1.5]">
              {capabilities.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>

          <div>
            <div className="font-mono text-xs tracking-[.3em] uppercase opacity-[.5] mb-[26px]">
              Recognition
            </div>
            <ul className="list-none text-[15px] leading-[1.5] opacity-[.78]">
              {recognition.map((r, i) => (
                <li
                  key={r.name}
                  className={`flex justify-between gap-5 py-[15px]${i === recognition.length - 1 ? "" : " border-b border-ink/12"}`}
                >
                  <span>{r.name}</span>
                  <span className="opacity-[.45] font-mono text-xs">{r.year}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <SiteFooter
        title={
          <>
            Start a<br />project.
          </>
        }
        secondary={{ label: "View the work →", href: "/work", arrow: null }}
      />
    </div>
  );
}
