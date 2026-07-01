"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";

// useLayoutEffect on the client (apply the hidden start state before paint), useEffect on
// the server to avoid React's SSR warning.
const useIsoLayoutEffect = typeof document !== "undefined" ? useLayoutEffect : useEffect;
import { useExperience } from "@/experience/ExperienceProvider";
import Reveal from "@/components/ui/Reveal";
import Kicker from "@/components/ui/Kicker";
import TextButton from "@/components/ui/TextButton";
import MediaPlaceholder from "@/components/ui/MediaPlaceholder";
import {
  getNextProject,
  projects,
  stripeCss,
  type Project,
} from "@/data/projects";
import { site } from "@/data/site";

const MONO_LABEL = "font-mono text-[11px] uppercase tracking-[.3em] opacity-[.45]";

/** Renders a title with its final word set in serif italic. */
function ItalicLastWord({ title }: { title: string }) {
  const words = title.trim().split(/\s+/);
  const last = words.pop();
  const head = words.join(" ");
  return (
    <>
      {head ? `${head} ` : ""}
      <span className="italic">{last}</span>
    </>
  );
}

/** Mono "NN / Label" section header used to open most sections. */
function SectionHead({ no, label }: { no: string; label: string }) {
  return (
    <Reveal className="flex gap-[14px] items-baseline">
      <span className={MONO_LABEL}>{no}</span>
      <span className={MONO_LABEL}>{label}</span>
    </Reveal>
  );
}

export default function CaseStudy({ project }: { project: Project }) {
  const { navigate, reduced } = useExperience();
  const cs = project.caseStudy;

  const total = String(projects.length).padStart(2, "0");

  // ---------- hero intro refs ----------
  const backRef = useRef<HTMLAnchorElement | null>(null);
  const maskRef = useRef<HTMLHeadingElement | null>(null);
  const titleRef = useRef<HTMLSpanElement | null>(null);
  const lineRef = useRef<HTMLDivElement | null>(null);
  const metaRef = useRef<HTMLDivElement | null>(null);

  useIsoLayoutEffect(() => {
    const back = backRef.current;
    const title = titleRef.current;
    const line = lineRef.current;
    const meta = metaRef.current;
    const els = [back, title, line, meta];

    const unmask = () => {
      if (maskRef.current) maskRef.current.style.overflow = "visible";
    };
    // Snap to rest. Clearing the GSAP-owned props (rather than setting raw inline values)
    // keeps everything on GSAP's own transform channels, so nothing is left half-applied.
    const reveal = () => {
      gsap.killTweensOf(els);
      gsap.set(els, { clearProps: "transform,opacity" });
      unmask();
    };

    if (reduced) {
      reveal();
      return;
    }

    // GSAP owns the hidden start state via gsap.set on its OWN yPercent/opacity channels.
    // This is the crux of the fix: the start state must NOT come from a CSS `transform`
    // (inline or class). GSAP parses an existing `translateY(116%)` into its *pixel* `y`
    // channel, then animates `yPercent` 116→0 on a SEPARATE channel — the two add, so the
    // title settles at 225px + 0% instead of 0, sitting on top of the meta until a timer
    // force-clears it. Setting yPercent directly keeps one channel, so it lands at rest.
    // Runs in a layout effect so the hidden state is applied before paint (no flash).
    gsap.set(back, { yPercent: 120, opacity: 0 });
    gsap.set(title, { yPercent: 116 });
    gsap.set(line, { opacity: 0, y: 24 });
    gsap.set(meta, { opacity: 0 });

    const tl = gsap.timeline();
    tl.to(back, { yPercent: 0, opacity: 1, duration: 1.1, ease: "power4.out", delay: 0.15 }, 0);
    // unmask only once the title has actually reached rest (GSAP/rAF time, never a
    // wall-clock timer), so the clip can't lift while the title is still travelling.
    tl.to(title, { yPercent: 0, duration: 1.2, ease: "power4.out", delay: 0.28, onComplete: unmask }, 0);
    tl.to(line, { opacity: 1, y: 0, duration: 1.1, ease: "power3.out", delay: 0.42 }, 0);
    tl.to(meta, { opacity: 1, duration: 1, ease: "power2.out", delay: 0.8 }, 0);

    // Last-resort fallback only if GSAP never finishes; kills tweens before forcing rest.
    const safety = window.setTimeout(reveal, 6000);
    return () => {
      tl.kill();
      clearTimeout(safety);
    };
  }, [reduced, project.slug]);

  return (
    <div data-view="case-study">
      <style>{`.cs-prose em{font-family:var(--font-serif);font-style:italic;}`}</style>

      {/* ================= HERO ================= */}
      <header className="relative z-[1] px-gutter pt-[clamp(116px,17vh,190px)] pb-[clamp(28px,5vh,52px)]">
        <a
          ref={backRef}
          href="/work"
          data-cursor="enter"
          onClick={(e) => {
            e.preventDefault();
            navigate("/work");
          }}
          className="inline-flex gap-[14px] items-center no-underline text-inherit font-mono text-xs uppercase tracking-[.32em] mb-[clamp(26px,5vh,52px)]"
        >
          <span className="w-[30px] h-px bg-ink inline-block" />
          Case study — {project.no} / {total} · index
        </a>

        {/* The h1 is the reveal mask. The inner span carries pb-[0.2em] so its box
            contains the descender (leading-[0.9] otherwise lets y/g/p fall below the
            line box and get clipped); the mask grows to fit, and translateY% still
            hides it at the start. mb pulls the following copy back up to compensate. */}
        <h1
          ref={maskRef}
          className="font-serif font-normal text-[clamp(58px,13.5vw,224px)] leading-[0.9] tracking-[-.035em] overflow-hidden mb-[-0.14em]"
        >
          <span ref={titleRef} className="block pb-[0.2em]">
            <ItalicLastWord title={project.title} />
          </span>
        </h1>

        <div
          ref={lineRef}
          className="mt-[clamp(20px,3.5vh,38px)] max-w-[48ch] font-serif text-[clamp(22px,3vw,42px)] leading-[1.16] tracking-[-.01em]"
        >
          {cs ? cs.hero.line : project.desc}
        </div>

        <div
          ref={metaRef}
          className="mt-[clamp(34px,6vh,68px)] flex flex-wrap gap-[clamp(28px,5vw,90px)] border-t border-ink/16 pt-[26px]"
        >
          {(cs
            ? cs.hero.meta
            : [
                { k: "Year", v: project.year },
                { k: "Role", v: project.meta },
                { k: "Status", v: "Case study in progress" },
              ]
          ).map((m) => (
            <div key={m.k} className="min-w-[140px]">
              <div className="font-mono text-[11px] uppercase tracking-[.22em] opacity-[.45] mb-3">{m.k}</div>
              <div className="text-[clamp(15px,1.5vw,18px)] leading-[1.4]">{m.v}</div>
            </div>
          ))}
        </div>
      </header>

      {cs ? <FullCaseStudy project={project} /> : <MinimalCaseStudy project={project} />}

      <NextProjectFooter slug={project.slug} total={total} />
    </div>
  );
}

/* ============================================================= *
 *  FULL CASE STUDY (project.caseStudy present)
 * ============================================================= */
function FullCaseStudy({ project }: { project: Project }) {
  const cs = project.caseStudy!;

  return (
    <>
      {/* hero media */}
      <div className="relative z-[1] px-gutter pb-[clamp(96px,16vh,210px)]">
        <MediaPlaceholder
          stripe={stripeCss(cs.heroMedia.stripe)}
          file={cs.heroMedia.file}
          tag={cs.heroMedia.tag}
          video={cs.heroMedia.video}
          height="clamp(320px,64vh,720px)"
          glow="radial-gradient(120% 100% at 70% 40%,rgba(135,121,236,.12),transparent 55%)"
        />
      </div>

      {/* ================= OVERVIEW ================= */}
      <section className="relative z-[1] px-gutter py-[clamp(78px,13vh,180px)] border-t border-ink/16">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-[clamp(40px,6vw,90px)]">
          <SectionHead no="01" label="Overview" />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[clamp(36px,6vw,90px)] items-start">
            <Reveal>
              {cs.overview.facts.map((o) => (
                <div key={o.k} className="flex justify-between gap-5 border-b border-ink/12 py-4">
                  <span className="font-mono text-[11px] tracking-[.18em] uppercase opacity-[.5]">{o.k}</span>
                  <span className="text-[15px] text-right max-w-[24ch]">{o.v}</span>
                </div>
              ))}
            </Reveal>
            <Reveal className="cs-prose">
              <p className="font-serif text-[clamp(24px,3.2vw,46px)] leading-[1.2] tracking-[-.015em]">
                {cs.overview.lead}
              </p>
              {cs.overview.paras.map((p, i) => (
                <p
                  key={i}
                  dangerouslySetInnerHTML={{ __html: p }}
                  className="text-[clamp(15px,1.4vw,17px)] leading-[1.62] opacity-[.72] max-w-[54ch]"
                  style={{ marginTop: i === 0 ? 30 : 22 }}
                />
              ))}
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= FLAGSHIP (statically dark) ================= */}
      <section className="relative z-[1] bg-void text-bone px-gutter py-[clamp(100px,17vh,230px)] overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(90% 80% at 80% 10%,rgba(87,219,166,.10),transparent 55%),radial-gradient(80% 70% at 10% 90%,rgba(135,121,236,.12),transparent 55%)",
          }}
        />
        <div className="relative flex flex-col gap-[clamp(34px,5vh,60px)]">
          <Reveal>
            <Kicker light className="text-[11px] tracking-[.3em] opacity-[.6]">
              {cs.flagship.kicker}
            </Kicker>
          </Reveal>
          <Reveal className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[clamp(30px,5vw,80px)] items-end">
            <h2 className="font-serif font-normal text-[clamp(40px,6.4vw,108px)] leading-[0.96] tracking-[-.025em]">
              {cs.flagship.title}
              <span className="italic">{cs.flagship.titleEmph}</span>
            </h2>
            <p className="text-[clamp(15px,1.4vw,17px)] leading-[1.64] opacity-[.78] max-w-[46ch]">{cs.flagship.body}</p>
          </Reveal>
          <Reveal>
            <MediaPlaceholder
              stripe={stripeCss(cs.flagship.media.stripe)}
              file={cs.flagship.media.file}
              tag={cs.flagship.media.tag}
              video={cs.flagship.media.video}
              dark
              height="clamp(300px,58vh,640px)"
              glow="radial-gradient(60% 60% at 50% 45%,rgba(67,194,210,.22),transparent 60%)"
            />
          </Reveal>
        </div>
      </section>

      {/* ================= KEY COMPONENTS ================= */}
      <section className="relative z-[1] px-gutter py-[clamp(82px,14vh,190px)] border-t border-ink/16">
        <div className="mb-[clamp(36px,6vh,64px)]">
          <SectionHead no="02" label="Key components" />
        </div>
        {cs.components.map((c) => (
          <Reveal
            key={c.no}
            as="article"
            className={`flex gap-[clamp(24px,5vw,80px)] items-center flex-wrap ${c.dir === "row-reverse" ? "flex-row-reverse" : "flex-row"} py-[clamp(44px,7vh,90px)] border-b border-ink/12`}
          >
            <MediaPlaceholder
              stripe={stripeCss(c.stripe)}
              file={c.file}
              tag={c.tag}
              video={c.video}
              height="clamp(230px,38vh,400px)"
              style={{ flex: "1 1 380px" }}
            />
            <div className="flex-[1_1_340px]">
              <div className="font-serif text-[clamp(30px,3.6vw,56px)] italic opacity-[.32] leading-none mb-[18px]">{c.no}</div>
              <h3 className="font-serif text-[clamp(28px,3.4vw,52px)] leading-none tracking-[-.02em]">{c.title}</h3>
              <p className="mt-5 text-[clamp(15px,1.4vw,17px)] leading-[1.62] opacity-[.72] max-w-[44ch]">{c.body}</p>
            </div>
          </Reveal>
        ))}
      </section>

      {/* ================= DESIGN PHILOSOPHY ================= */}
      <section className="relative z-[1] px-gutter py-[clamp(88px,16vh,210px)] border-t border-ink/16">
        <div className="mb-[clamp(36px,6vh,70px)]">
          <SectionHead no="03" label="Design philosophy" />
        </div>
        <Reveal className="font-serif text-[clamp(28px,4.4vw,72px)] leading-[1.1] tracking-[-.02em] text-balance max-w-[18ch] mb-[clamp(50px,8vh,100px)]">
          {cs.philosophy.statement}
          <span className="italic">{cs.philosophy.statementEmph}</span>
        </Reveal>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[clamp(40px,6vw,90px)]">
          {/* palette */}
          <Reveal>
            <div className="font-mono text-[11px] tracking-[.3em] uppercase opacity-[.5] mb-[26px] border-b border-ink/14 pb-[14px]">
              Aurora palette — an aurora in an obsidian sky
            </div>
            {cs.philosophy.palette.map((s) => (
              <div key={s.hex} className="flex gap-[22px] items-center py-4 border-b border-ink/10">
                <span className="w-[84px] h-[56px] flex-[0_0_84px] border border-ink/14" style={{ background: s.hex }} />
                <div className="flex-1">
                  <div className="font-serif text-[22px] italic">{s.name}</div>
                  <div className="text-[13px] opacity-[.6] leading-[1.4] mt-[3px]">{s.use}</div>
                </div>
                <span className="font-mono text-xs opacity-[.55]">{s.hex}</span>
              </div>
            ))}
          </Reveal>

          {/* principles + specimens */}
          <Reveal>
            <div className="font-mono text-[11px] tracking-[.3em] uppercase opacity-[.5] mb-[26px] border-b border-ink/14 pb-[14px]">
              Principles
            </div>
            <ul className="list-none font-serif text-[clamp(22px,2.4vw,34px)] leading-[1.5]">
              {cs.philosophy.principles.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <div className="mt-10 flex flex-col gap-[18px]">
              <div className="bg-[#0A0C11] text-[#C7D0D9] px-[26px] py-6 flex justify-between items-baseline">
                <span className="font-grotesk text-[clamp(26px,3vw,40px)] tracking-[-.01em] font-medium">Aa Display</span>
                <span className="font-mono text-[11px] tracking-[.16em] opacity-[.6]">GROTESK · TIGHT</span>
              </div>
              <div className="bg-[#0A0C11] text-[#57DBA6] px-[26px] py-6 flex justify-between items-baseline">
                <span className="font-mono text-[clamp(22px,2.6vw,34px)]">99.982% · 04ms</span>
                <span className="font-mono text-[11px] tracking-[.16em] opacity-[.6] text-[#C7D0D9]">MONO · DATA</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= GALLERY ================= */}
      <section className="relative z-[1] px-gutter py-[clamp(82px,14vh,190px)] border-t border-ink/16">
        <Reveal className="flex justify-between items-baseline flex-wrap gap-4 mb-[clamp(34px,5vh,58px)]">
          <div className="flex gap-[14px] items-baseline">
            <span className={MONO_LABEL}>04</span>
            <span className={MONO_LABEL}>Gallery</span>
          </div>
          <span className="font-mono text-[11px] tracking-[.16em] opacity-[.4]">06 frames · drop media to replace</span>
        </Reveal>
        <div className="grid grid-cols-3 gap-[clamp(12px,1.4vw,22px)]">
          {cs.gallery.map((g, i) => (
            <Reveal key={i} style={{ gridColumn: g.col }}>
              <MediaPlaceholder stripe={stripeCss(g.stripe)} file={g.file} video={g.video} height={g.h} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= LIVE SITE ================= */}
      <section className="relative z-[1] px-gutter py-[clamp(88px,16vh,210px)] border-t border-ink/16">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-[clamp(38px,5vw,80px)] items-end">
          <Reveal>
            <div className="font-mono text-[11px] tracking-[.3em] uppercase opacity-[.45] mb-[22px]">Live site</div>
            <TextButton
              arrow="↗"
              magnetic
              cursor="link"
              onClick={() => {
                if (cs.live.url && cs.live.url !== "#") window.open(cs.live.url, "_blank", "noopener");
              }}
              className="font-serif text-[clamp(38px,6vw,92px)] leading-[0.95] tracking-[-.03em]"
            >
              Visit the site
            </TextButton>
            <div className="mt-6 font-mono text-xs tracking-[.14em] opacity-[.5]">{cs.live.label}</div>
          </Reveal>
          <Reveal>
            <MediaPlaceholder
              stripe={stripeCss(cs.live.media.stripe)}
              file={cs.live.media.file}
              video={cs.live.media.video}
              height="clamp(230px,32vh,340px)"
              glow="radial-gradient(120% 100% at 70% 40%,rgba(87,219,166,.12),transparent 55%)"
              tag={
                <span className="inline-flex items-center gap-[7px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#57DBA6]" style={{ boxShadow: "0 0 7px 1px rgba(87,219,166,.6)" }} />
                  Live
                </span>
              }
            />
          </Reveal>
        </div>
        <Reveal className="mt-[clamp(26px,4vh,44px)] grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-[clamp(12px,1.2vw,18px)]">
          {cs.live.outcomes.map((o) => (
            <div key={o.k} className="bg-[#0A0C11] text-[#57DBA6] p-[clamp(20px,2.2vw,28px)] flex flex-col gap-3 min-h-[118px] justify-between">
              <span className="font-mono text-[clamp(30px,3.6vw,48px)] tracking-[-.01em]">{o.v}</span>
              <span className="font-mono text-[11px] tracking-[.16em] uppercase text-[#C7D0D9] opacity-[.72] leading-[1.4]">{o.k}</span>
            </div>
          ))}
        </Reveal>
      </section>

      {/* ================= CREDITS / DELIVERABLES / STACK ================= */}
      <section className="relative z-[1] px-gutter pt-[clamp(82px,14vh,190px)] pb-[clamp(120px,21vh,280px)] border-t border-ink/16">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-[clamp(36px,5vw,80px)]">
          <Reveal>
            <div className="font-mono text-[11px] tracking-[.3em] uppercase opacity-[.5] mb-6 border-b border-ink/14 pb-[14px]">Credits</div>
            {cs.credits.map((c, i) => (
              <div key={i} className="flex justify-between gap-4 py-[13px] border-b border-ink/10 text-[14px]">
                <span className="opacity-[.55]">{c.role}</span>
                <span>{c.name}</span>
              </div>
            ))}
          </Reveal>
          <Reveal>
            <div className="font-mono text-[11px] tracking-[.3em] uppercase opacity-[.5] mb-6 border-b border-ink/14 pb-[14px]">Deliverables</div>
            <ul className="list-none text-[15px] leading-[1.5]">
              {cs.deliverables.map((d) => (
                <li key={d} className="py-[11px] border-b border-ink/10">{d}</li>
              ))}
            </ul>
          </Reveal>
          <Reveal>
            <div className="font-mono text-[11px] tracking-[.3em] uppercase opacity-[.5] mb-6 border-b border-ink/14 pb-[14px]">Tech stack</div>
            <div className="flex flex-wrap gap-2.5">
              {cs.stack.map((s) => (
                <span key={s} className="font-mono text-[11px] tracking-[.08em] uppercase border border-ink/22 rounded-full px-[15px] py-[9px]">{s}</span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

/* ============================================================= *
 *  MINIMAL "IN PROGRESS" CASE STUDY (no project.caseStudy)
 * ============================================================= */
function MinimalCaseStudy({ project }: { project: Project }) {
  return (
    <>
      {/* hero media */}
      <div className="relative z-[1] px-gutter pb-[clamp(96px,16vh,210px)]">
        <MediaPlaceholder
          stripe={stripeCss(project.stripe)}
          file={project.file}
          tag={project.meta}
          video
          height="clamp(320px,64vh,720px)"
        />
      </div>

      {/* in-progress note */}
      <section className="relative z-[1] px-gutter pt-[clamp(60px,12vh,150px)] pb-[clamp(120px,21vh,280px)] border-t border-ink/16">
        <Reveal className="max-w-[30ch] mx-auto text-center">
          <p className="font-serif text-[clamp(26px,3.6vw,52px)] leading-[1.18] tracking-[-.015em]">
            The full case study for <span className="italic">{project.title}</span> is coming soon.
          </p>
          <div className="mt-[clamp(30px,5vh,48px)] inline-flex">
            <TextButton href="/work" cursor="enter" magnetic>
              Back to all work
            </TextButton>
          </div>
        </Reveal>
      </section>
    </>
  );
}

/* ============================================================= *
 *  NEXT PROJECT — dark-zone footer (data-driven for any slug)
 * ============================================================= */
function NextProjectFooter({ slug, total }: { slug: string; total: string }) {
  const { navigate, reduced } = useExperience();
  const next = getNextProject(slug);

  const metaLabel = next.meta.replace(/^\s*\d+\s*\/\s*/, "");

  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const ctaRef = useRef<HTMLSpanElement | null>(null);
  const arrowRef = useRef<HTMLSpanElement | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);

  const onEnter = () => {
    if (reduced) return;
    if (titleRef.current) titleRef.current.style.transform = "translateX(16px)";
    if (ctaRef.current) {
      ctaRef.current.style.background = "#e8e6e1";
      ctaRef.current.style.color = "#060606";
      ctaRef.current.style.borderColor = "#e8e6e1";
    }
    if (arrowRef.current) arrowRef.current.style.transform = "translateX(6px)";
    if (thumbRef.current) thumbRef.current.style.transform = "scale(1.035)";
  };
  const onLeave = () => {
    if (titleRef.current) titleRef.current.style.transform = "translateX(0)";
    if (ctaRef.current) {
      ctaRef.current.style.background = "transparent";
      ctaRef.current.style.color = "inherit";
      ctaRef.current.style.borderColor = "rgba(232,230,225,.4)";
    }
    if (arrowRef.current) arrowRef.current.style.transform = "translateX(0)";
    if (thumbRef.current) thumbRef.current.style.transform = "scale(1)";
  };

  return (
    <footer
      id="contact"
      data-darkzone=""
      // full-viewport dark panel so the previous section can't creep in at the top
      className="relative z-[1] flex min-h-[100dvh] flex-col justify-end text-ink pb-10"
    >
      <a
        href={`/work/${next.slug}`}
        data-cursor="enter"
        onClick={(e) => {
          e.preventDefault();
          navigate(`/work/${next.slug}`);
        }}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        className="relative block no-underline text-inherit overflow-hidden px-gutter pt-[clamp(74px,14vh,200px)] pb-[clamp(74px,13vh,190px)] border-t border-bone/18"
      >
        <div className="flex justify-between items-center flex-wrap gap-5 mb-[clamp(40px,7vh,72px)]">
          <span className="font-mono text-xs tracking-[.3em] uppercase inline-flex gap-[14px] items-center">
            <span className="w-[30px] h-px bg-current inline-block opacity-[.55]" />
            Next project — {next.no} / {total}
          </span>
          <span
            ref={ctaRef}
            className="inline-flex items-center gap-3 font-mono text-xs tracking-[.2em] uppercase rounded-full px-6 py-[14px] transition-[background,color,border-color] duration-[.4s]"
            style={{ border: "1px solid rgba(232,230,225,.4)" }}
          >
            Open case study
            <span ref={arrowRef} className="inline-block" style={{ transition: "transform .45s cubic-bezier(.22,1,.36,1)" }}>→</span>
          </span>
        </div>
        <div className="flex justify-between items-end flex-wrap gap-[clamp(30px,5vw,72px)]">
          <div className="flex-[1_1_380px]">
            <div className="font-mono text-[11px] tracking-[.2em] uppercase opacity-[.55] mb-4">
              {metaLabel} · {next.year}
            </div>
            <h2
              ref={titleRef}
              className="font-serif font-normal text-[clamp(60px,13vw,232px)] leading-[0.86] tracking-[-.035em] italic"
              style={{ transition: "transform .6s cubic-bezier(.22,1,.36,1)" }}
            >
              {next.title}
            </h2>
            <p className="mt-[clamp(20px,3vh,30px)] text-[clamp(14px,1.4vw,17px)] leading-[1.55] opacity-[.7] max-w-[42ch]">{next.desc}</p>
          </div>
          <div
            ref={thumbRef}
            className="flex-[0_0_auto] w-[clamp(210px,28vw,380px)] h-[clamp(150px,20vw,250px)] relative overflow-hidden bg-obsidian"
            style={{ transition: "transform .6s cubic-bezier(.22,1,.36,1)" }}
          >
            <div className="absolute inset-0" style={{ background: stripeCss({ ang: 62, w: 8, c1: "#11161f", c2: "#171d28" }) }} />
            <div className="absolute inset-0" style={{ background: "radial-gradient(72% 72% at 60% 38%,rgba(67,194,210,.20),transparent 60%)" }} />
            <span className="absolute left-[14px] bottom-[11px] font-mono text-[10px] tracking-[.14em] text-[#7d8694]">{next.file}</span>
          </div>
        </div>
      </a>
      <div className="flex justify-between flex-wrap gap-4 px-gutter pt-[34px] font-mono text-[11px] tracking-[.14em] uppercase opacity-[.4]">
        <span>{site.copyright}</span>
        <span>{site.location.coords}</span>
        <span>{site.builtWith}</span>
      </div>
    </footer>
  );
}
