"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useExperience } from "@/experience/ExperienceProvider";
import Kicker from "@/components/ui/Kicker";
import Reveal from "@/components/ui/Reveal";
import TextButton from "@/components/ui/TextButton";
import SiteFooter from "@/components/SiteFooter";
import Testimonials from "@/components/sections/Testimonials";
import TechStack from "@/components/sections/TechStack";
import { aboutIntro, processActs, capabilities, bio, interests, now } from "@/data/about";
import { site } from "@/data/site";

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
        className="relative z-[1] flex flex-col justify-center px-gutter pt-[16vh] pb-[10vh] md:min-h-screen md:pt-[clamp(120px,18vh,200px)] md:pb-[clamp(40px,8vh,80px)]"
      >
        <div className="overflow-hidden mb-[clamp(20px,4vh,40px)]">
          <div ref={kickerRef} style={{ transform: reduced ? "none" : "translateY(120%)" }}>
            <Kicker>{aboutIntro.kicker}</Kicker>
          </div>
        </div>

        <h1 className="font-serif font-normal text-[clamp(32px,6.6vw,124px)] leading-[1.02] tracking-[-.03em]">
          {aboutIntro.titleLines.map((line, i) => (
            // pb on the inner (sliding) span so its box holds the descender — leading-[1.02]
            // alone lets y/g/p fall below the line box into the overflow-hidden clip. Because
            // translateY% is relative to the inner span, the taller box still hides at start.
            <span key={i} className="block overflow-hidden mb-[-.2em]">
              <span
                ref={(el) => {
                  lineRefs.current[i] = el;
                }}
                className={`block whitespace-nowrap pb-[.18em]${i === 2 ? " italic" : ""}`}
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

      {/* BIO — the person */}
      <section className="relative z-[1] px-gutter pt-[clamp(20px,4vh,60px)] pb-[clamp(50px,10vh,140px)]">
        <Reveal className="grid grid-cols-1 gap-[clamp(32px,5vw,80px)] md:grid-cols-[0.8fr_1.2fr] md:items-start">
          {/* portrait slot — drop a photo path in src/data/about.ts (bio.portrait) */}
          <div className="relative aspect-[4/5] w-full max-w-[420px] overflow-hidden border border-ink/12 bg-paper">
            {bio.portrait ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bio.portrait} alt="Alexander Smith" className="h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted">
                <span className="font-serif text-[clamp(40px,6vw,80px)] italic opacity-40">AS</span>
                <span className="font-mono text-[10px] uppercase tracking-[.24em] opacity-50">
                  Portrait — add a photo
                </span>
              </div>
            )}
          </div>

          <div>
            <Kicker>{bio.kicker}</Kicker>
            <div className="mt-[clamp(22px,3vh,34px)] flex flex-col gap-[clamp(16px,2.4vh,24px)]">
              {bio.paragraphs.map((p, i) => (
                <p
                  key={i}
                  className={`max-w-[56ch] leading-[1.6] ${
                    i === 0 ? "font-serif text-[clamp(20px,2.2vw,30px)] opacity-90" : "text-[clamp(15px,1.4vw,18px)] opacity-[.72]"
                  }`}
                >
                  {p}
                </p>
              ))}
            </div>
            <div className="mt-[clamp(24px,3.5vh,40px)] flex flex-wrap items-center gap-x-8 gap-y-4">
              <span className="font-serif text-[clamp(20px,2vw,28px)] italic opacity-60">{bio.signature}</span>
              {site.cv.href && (
                <TextButton href={site.cv.href} cursor="read" magnetic arrow="↗">
                  {site.cv.label}
                </TextButton>
              )}
            </div>
          </div>
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
            className="group flex gap-[clamp(24px,5vw,90px)] flex-wrap items-start py-[clamp(28px,5vh,56px)] border-b border-ink/12 transition-colors duration-500 hover:border-ink/30"
          >
            <div className="flex-[0_0_auto] font-serif text-[clamp(30px,4vw,64px)] italic opacity-[.3] min-w-[2.5ch] transition-opacity duration-[450ms] group-hover:opacity-60">
              {a.no}
            </div>
            <div className="flex-[1_1_240px]">
              <h3 className="font-serif text-[clamp(28px,3.4vw,52px)] tracking-[-.02em] leading-none transition-transform duration-[550ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-x-2">
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

      {/* CAPABILITIES + INTERESTS */}
      <section className="relative z-[1] px-gutter pt-[clamp(50px,10vh,140px)] pb-[clamp(40px,8vh,100px)]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[clamp(36px,6vw,90px)]">
          <div>
            <div data-reveal className="mb-[26px] opacity-0">
              <span className="font-mono text-xs tracking-[.3em] uppercase opacity-50">Capabilities</span>
            </div>
            <ul className="list-none font-serif text-[clamp(22px,2.4vw,34px)] leading-[1.5]">
              {capabilities.map((c) => (
                <li key={c} data-reveal className="group opacity-0">
                  <span className="flex items-center py-1 cursor-default" data-cursor="">
                    <span
                      aria-hidden
                      className="h-px w-0 bg-ink/55 transition-[width,margin] duration-[550ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:w-7 group-hover:mr-4"
                    />
                    <span className="opacity-80 transition-opacity duration-[450ms] group-hover:opacity-100">{c}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div data-reveal className="mb-[26px] opacity-0">
              <span className="font-mono text-xs tracking-[.3em] uppercase opacity-50">Off the clock</span>
            </div>
            <ul className="list-none text-[clamp(15px,1.4vw,18px)] leading-[1.5]">
              {interests.map((it, i) => (
                <li
                  key={it}
                  data-reveal
                  className={`group opacity-0 flex gap-4 py-[15px]${i === interests.length - 1 ? "" : " border-b border-ink/12"}`}
                >
                  <span className="font-mono text-xs opacity-[.4] transition-opacity duration-300 group-hover:opacity-90">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="opacity-[.78] transition-[transform,opacity] duration-[450ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-x-1.5 group-hover:opacity-100">
                    {it}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* NOW — a living snapshot */}
      <section className="relative z-[1] px-gutter pb-[clamp(50px,10vh,140px)]">
        <Reveal className="border-t border-ink/14 pt-[clamp(28px,4vh,44px)]">
          <Kicker>{now.kicker}</Kicker>
          <div className="mt-[clamp(24px,4vh,40px)] grid grid-cols-1 gap-[clamp(20px,3vw,48px)] sm:grid-cols-2 lg:grid-cols-4">
            {now.items.map((n) => (
              <div key={n.label} className="group">
                <span
                  aria-hidden
                  className="mb-3 block h-px w-6 bg-ink/30 transition-[width] duration-[550ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:w-12"
                />
                <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[.2em] opacity-40 transition-opacity duration-300 group-hover:opacity-70">
                  {n.label}
                </div>
                <div className="font-serif text-[clamp(19px,1.8vw,26px)] leading-[1.2] tracking-[-.01em] transition-transform duration-[450ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-x-1">
                  {n.value}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* TESTIMONIALS */}
      <Testimonials />

      {/* TECH STACK */}
      <TechStack />

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
