"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useExperience, useTick, type TickState } from "@/experience/ExperienceProvider";
import Kicker from "@/components/ui/Kicker";
import TextButton from "@/components/ui/TextButton";
import MediaPlaceholder from "@/components/ui/MediaPlaceholder";
import SiteFooter from "@/components/SiteFooter";
import { projects, stripeCss } from "@/data/projects";
import { site } from "@/data/site";
import { clamp, easeOutCubic } from "@/lib/math";

export default function HomePage() {
  const { reduced, navigate, introDoneRef } = useExperience();

  const kickerRef = useRef<HTMLDivElement | null>(null);
  const subRef = useRef<HTMLDivElement | null>(null);
  const hintRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const heroReady = useRef(false);

  // ---------- hero entrance (plays as the global loader lifts, or instantly on in-app nav) ----------
  useEffect(() => {
    let played = false;
    const reveal = () => {
      lineRefs.current.forEach((l) => l && (l.style.transform = "translateY(0)"));
      if (kickerRef.current) kickerRef.current.style.transform = "translateY(0)";
      if (subRef.current) subRef.current.style.transform = "translateY(0)";
      if (hintRef.current) hintRef.current.style.opacity = ".6";
      heroReady.current = true;
    };
    const play = () => {
      if (played) return;
      played = true;
      if (reduced) {
        reveal();
        return;
      }
      gsap.to(kickerRef.current, { y: 0, duration: 1.3, ease: "power4.out", delay: 0.15 });
      gsap.to(lineRefs.current.filter(Boolean), { y: 0, duration: 1.3, stagger: 0.12, ease: "power4.out", delay: 0.3, onComplete: () => (heroReady.current = true) });
      gsap.to(subRef.current, { y: 0, duration: 1.3, ease: "power4.out", delay: 0.8 });
      gsap.to(hintRef.current, { opacity: 0.6, duration: 1, delay: 1.3 });
    };

    if (reduced || introDoneRef.current) {
      play();
      return;
    }
    window.addEventListener("ob:introdone", play, { once: true });
    const safety = window.setTimeout(play, 4200);
    return () => {
      window.removeEventListener("ob:introdone", play);
      clearTimeout(safety);
    };
  }, [reduced, introDoneRef]);

  // ---------- hero masked scroll-out + card parallax ----------
  useTick((s: TickState) => {
    if (heroReady.current && headerRef.current) {
      const hh = headerRef.current.offsetHeight || window.innerHeight;
      const hp = clamp(s.scroll / (hh * 0.72), 0, 1);
      const seq = [kickerRef.current, lineRefs.current[0], lineRefs.current[1], lineRefs.current[2], subRef.current];
      seq.forEach((l, i) => {
        if (!l) return;
        const p = clamp(hp * 1.28 - i * 0.1, 0, 1);
        l.style.transform = `translateY(${-easeOutCubic(p) * 120}%)`;
      });
      if (hintRef.current) hintRef.current.style.opacity = String(Math.max(0, 1 - hp * 3.5) * 0.6);
    }
  });

  return (
    <div data-view="home">
      {/* hero */}
      <header
        ref={headerRef}
        id="top"
        className="relative z-[1] flex min-h-screen flex-col justify-center px-gutter"
      >
        <div className="mb-[clamp(20px,4vh,46px)] overflow-hidden">
          <div ref={kickerRef} style={{ transform: reduced ? "none" : "translateY(120%)" }}>
            <Kicker>{site.tagline}</Kicker>
          </div>
        </div>
        <h1 className="max-w-[14ch] font-serif text-[clamp(46px,9.2vw,168px)] font-normal leading-[0.96] tracking-[-.025em]">
          {["Immersive worlds", "for brands at the", "edge of the web."].map((line, i) => (
            <span key={i} className="block overflow-hidden pb-[.2em] mb-[-.16em]">
              <span
                ref={(el) => { lineRefs.current[i] = el; }}
                className={`block${i === 2 ? " italic" : ""}`}
                style={{ transform: reduced ? "none" : "translateY(115%)" }}
              >
                {line}
              </span>
            </span>
          ))}
        </h1>
        <div className="mt-[clamp(26px,5vh,52px)] overflow-hidden">
          <div ref={subRef} className="max-w-[760px]" style={{ transform: reduced ? "none" : "translateY(120%)" }}>
            <p className="max-w-[46ch] text-[clamp(14px,1.4vw,17px)] leading-[1.5] opacity-[.72]">
              I design and build digital experiences that bring brands to life; interactive worlds, product launches and stories that make people stop and pay attention.
            </p>
          </div>
        </div>
        <div
          ref={hintRef}
          className="absolute bottom-[30px] left-1/2 flex -translate-x-1/2 flex-col items-center gap-2.5 font-mono text-[11px] uppercase tracking-[.28em] opacity-0"
        >
          Scroll
          <span className="inline-block animate-[ob-bob_2.2s_ease-in-out_infinite]">↓</span>
        </div>
      </header>

      {/* selected work */}
      <section id="work" className="relative z-[1] py-[clamp(60px,12vh,160px)]">
        <div data-reveal="" className="mb-[clamp(28px,5vh,60px)] px-gutter opacity-0">
          <Kicker>Selected work</Kicker>
        </div>

        {projects.map((p) => (
          <article key={p.slug} className="flex min-h-[96vh] items-center px-gutter">
            <div className={`flex w-full flex-wrap items-center gap-[clamp(28px,5vw,80px)] ${p.dir === "row-reverse" ? "flex-row-reverse" : "flex-row"}`}>
              <div data-reveal="" className="flex-[1_1_460px] opacity-0">
                <div onClick={() => navigate(`/work/${p.slug}`)}>
                  <MediaPlaceholder
                    stripe={stripeCss(p.stripe)}
                    file={p.file}
                    tag={p.meta.split(" / ")[1]}
                    video
                    height="clamp(320px,58vh,620px)"
                    cursor="view"
                  />
                </div>
              </div>
              <div data-reveal="" className="flex-[1_1_320px] opacity-0">
                <div className="mb-[18px] font-mono text-xs tracking-[.2em] opacity-50">{p.meta}</div>
                <h3 className="font-serif text-[clamp(36px,5.5vw,80px)] leading-[0.98] tracking-[-.02em]">{p.title}</h3>
                <p className="mt-[22px] max-w-[38ch] text-body opacity-[.7]">{p.desc}</p>
                <div className="mt-[30px]">
                  <TextButton href={`/work/${p.slug}`} cursor="view" magnetic>
                    View project
                  </TextButton>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      <SiteFooter title={<>Let&rsquo;s build<br />something.</>} />
    </div>
  );
}
