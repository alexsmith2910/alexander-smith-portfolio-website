"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useExperience, useTick, type TickState } from "@/experience/ExperienceProvider";
import Kicker from "@/components/ui/Kicker";
import TextButton from "@/components/ui/TextButton";
import PillButton from "@/components/ui/PillButton";
import MediaPlaceholder from "@/components/ui/MediaPlaceholder";
import SiteFooter from "@/components/SiteFooter";
import Services from "@/components/sections/Services";
import ScrubStatement from "@/components/sections/ScrubStatement";
import Testimonials from "@/components/sections/Testimonials";
import TechStack from "@/components/sections/TechStack";
import { projects, stripeCss } from "@/data/projects";
import { site } from "@/data/site";
import { clamp, easeOutCubic } from "@/lib/math";
import { EASE } from "@/lib/ease";

// hero headline split into words so each can mask-reveal on its own beat
const HERO_LINES = [
  ["Immersive", "worlds"],
  ["for", "brands", "at", "the"],
  ["edge", "of", "the", "web."],
];
const WORD_OFFSET = HERO_LINES.map((_, i) => HERO_LINES.slice(0, i).reduce((a, l) => a + l.length, 0));

export default function HomePage() {
  const { reduced, navigate, introDoneRef } = useExperience();

  const kickerRef = useRef<HTMLDivElement | null>(null);
  const subRef = useRef<HTMLDivElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const hintRef = useRef<HTMLDivElement | null>(null);
  const grabHintRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const heroReady = useRef(false);
  // cached untransformed document-top + height per hero element (for the scroll-out fade)
  const heroMetaRef = useRef<{ top: number; h: number }[] | null>(null);

  // ---------- hero entrance (plays as the global loader lifts, or instantly on in-app nav) ----------
  useEffect(() => {
    let played = false;
    const reveal = () => {
      wordRefs.current.forEach((w) => w && (w.style.transform = "translateY(0)"));
      if (kickerRef.current) kickerRef.current.style.transform = "translateY(0)";
      if (subRef.current) subRef.current.style.transform = "translateY(0)";
      if (ctaRef.current) { ctaRef.current.style.opacity = "1"; ctaRef.current.style.transform = "translateY(0)"; }
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
      gsap.to(kickerRef.current, { y: 0, duration: 1.2, ease: EASE.entrance, delay: 0.15 });
      // word-by-word masked reveal — the headline writes itself in
      gsap.to(wordRefs.current.filter(Boolean), {
        y: 0,
        duration: 1.1,
        stagger: 0.06,
        ease: EASE.entrance,
        delay: 0.32,
        onComplete: () => (heroReady.current = true),
      });
      gsap.to(subRef.current, { y: 0, duration: 1.1, ease: EASE.entrance, delay: 0.9 });
      gsap.to(ctaRef.current, { y: 0, opacity: 1, duration: 1, ease: EASE.entrance, delay: 1.05 });
      gsap.to(hintRef.current, { opacity: 0.6, duration: 1, delay: 1.4 });
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

  // ---------- "drag me" hint: fades in after the intro, out on first grab ----------
  useEffect(() => {
    const el = grabHintRef.current;
    if (!el) return;
    const show = window.setTimeout(() => { el.style.opacity = "0.5"; }, 2200);
    const onGrab = () => { el.style.opacity = "0"; };
    window.addEventListener("ob:grab", onGrab, { once: true });
    return () => {
      clearTimeout(show);
      window.removeEventListener("ob:grab", onGrab);
    };
  }, []);

  // ---------- hero masked scroll-out + card parallax ----------
  useTick((s: TickState) => {
    if (heroReady.current && headerRef.current) {
      const hh = headerRef.current.offsetHeight || window.innerHeight;
      const hp = clamp(s.scroll / (hh * 0.72), 0, 1);
      const seq = [kickerRef.current, lineRefs.current[0], lineRefs.current[1], lineRefs.current[2], subRef.current, ctaRef.current];
      // cache layout positions once — offsetTop/offsetParent are immune to the transforms,
      // so this is accurate even mid-entrance
      if (!heroMetaRef.current) {
        const docTop = (el: HTMLElement) => {
          let y = 0;
          let n: HTMLElement | null = el;
          while (n) { y += n.offsetTop; n = n.offsetParent as HTMLElement | null; }
          return y;
        };
        heroMetaRef.current = seq.map((el) => (el ? { top: docTop(el), h: el.offsetHeight } : { top: 0, h: 0 }));
      }
      const meta = heroMetaRef.current;
      const sk = reduced ? 0 : clamp(s.velocity * 0.14, -3.5, 3.5);
      seq.forEach((l, i) => {
        if (!l) return;
        const p = clamp(hp * 1.28 - i * 0.1, 0, 1);
        const up = easeOutCubic(p) * 120; // % of element height, moved upward
        l.style.transform = `translateY(${-up}%) skewY(${sk.toFixed(2)}deg)`;
        // fade each line out as it rises into the fixed nav/logo so hero copy never collides
        // with the wordmark (the small mono tagline was merging into "Alexander Smith")
        if (meta && s.scroll > 2) {
          const screenTop = meta[i].top - s.scroll - (up / 100) * meta[i].h;
          l.style.opacity = clamp((screenTop - 70) / 40, 0, 1).toFixed(3);
        }
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
        className="relative z-[1] flex min-h-[100svh] flex-col justify-start px-gutter pt-[16vh] md:justify-center md:pt-0"
      >
        <div className="mb-[clamp(20px,4vh,46px)] overflow-hidden">
          <div ref={kickerRef} style={{ transform: reduced ? "none" : "translateY(120%)" }}>
            <Kicker>{site.tagline}</Kicker>
          </div>
        </div>
        <h1 className="max-w-[14ch] font-serif text-[clamp(46px,9.2vw,168px)] font-normal leading-[0.96] tracking-[-.03em]">
          {HERO_LINES.map((words, i) => (
            <span key={i} className="block overflow-hidden pb-[.3em] mb-[-.26em]">
              {/* line inner — the scroll-out + velocity-skew target */}
              <span ref={(el) => { lineRefs.current[i] = el; }} className={`block${i === 2 ? " italic" : ""}`}>
                {words.map((w, wi) => {
                  const gi = WORD_OFFSET[i] + wi;
                  return (
                    <span
                      key={wi}
                      ref={(el) => { wordRefs.current[gi] = el; }}
                      className="inline-block will-change-transform"
                      style={{ transform: reduced ? "none" : "translateY(135%)" }}
                    >
                      {w}
                      {wi < words.length - 1 ? " " : ""}
                    </span>
                  );
                })}
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
          ref={ctaRef}
          className="mt-[clamp(30px,5vh,52px)] flex flex-wrap items-center gap-x-8 gap-y-4"
          style={{ opacity: reduced ? 1 : 0, transform: reduced ? "none" : "translateY(24px)" }}
        >
          <PillButton href={site.cta.href}>{site.cta.label}</PillButton>
          <TextButton onClick={() => navigate("/work")} cursor="view" magnetic>
            View work
          </TextButton>
        </div>
        <div
          ref={grabHintRef}
          aria-hidden
          className="pointer-events-none absolute right-[6%] top-[46%] hidden items-center gap-2.5 font-mono text-[10px] uppercase tracking-[.28em] opacity-0 transition-opacity duration-700 md:flex"
        >
          <span className="inline-block h-px w-6 bg-ink/40" />
          drag me
        </div>
        <div
          ref={hintRef}
          className="absolute bottom-[30px] left-1/2 flex -translate-x-1/2 flex-col items-center gap-2.5 font-mono text-[11px] uppercase tracking-[.28em] opacity-0"
        >
          Scroll
          <span className="inline-block animate-[ob-bob_2.2s_ease-in-out_infinite]">↓</span>
        </div>
      </header>

      {/* what I do — the offer, before the work */}
      <Services />

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
                    living
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

      {/* signature scrubbed moment — scroll inks the statement in */}
      <ScrubStatement />

      {/* social proof */}
      <Testimonials />

      {/* depth signal for technical buyers */}
      <TechStack />

      <SiteFooter title={<>Let&rsquo;s build<br />something.</>} />
    </div>
  );
}
