"use client";

import { useRef } from "react";
import { useExperience, useTick } from "@/experience/ExperienceProvider";
import TextButton from "@/components/ui/TextButton";
import SketchCanvas from "@/components/lab/SketchCanvas";
import SiteFooter from "@/components/SiteFooter";
import { labEntries } from "@/data/lab";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export default function LabPage() {
  const { lenisRef } = useExperience();

  const railItemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const railMarkRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const railTitleRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const counterRef = useRef<HTMLSpanElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const openRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const activeRef = useRef(-1);

  // ---------- active-section sync + counter + progress + live count ----------
  useTick(() => {
    const sections = sectionRefs.current;
    if (sections.length) {
      const line = window.innerHeight * 0.42;
      let best = 0;
      let bd = 1e9;
      sections.forEach((s, i) => {
        if (!s) return;
        const b = s.getBoundingClientRect();
        const mid = b.top + b.height / 2;
        const d = Math.abs(mid - line);
        if (d < bd) {
          bd = d;
          best = i;
        }
      });

      if (best !== activeRef.current) {
        activeRef.current = best;
        railItemRefs.current.forEach((it, k) => {
          if (!it) return;
          const on = k === best;
          it.style.opacity = on ? "1" : ".36";
          const mk = railMarkRefs.current[k];
          const ti = railTitleRefs.current[k];
          if (mk) mk.style.width = on ? "26px" : "0";
          if (ti) ti.style.fontStyle = on ? "italic" : "normal";
        });
        if (counterRef.current) counterRef.current.textContent = String(best + 1).padStart(2, "0");
      }
    }

    const progress = progressRef.current;
    if (progress) {
      const dh = document.documentElement.scrollHeight - window.innerHeight;
      const scroll = window.scrollY || document.documentElement.scrollTop;
      const sp = dh > 0 ? clamp(scroll / dh, 0, 1) : 0;
      progress.style.height = sp * 100 + "%";
    }
  });

  const railTo = (i: number) => {
    const tgt = sectionRefs.current[i];
    if (!tgt) return;
    const l = lenisRef.current;
    if (l) l.scrollTo(tgt, { duration: 1.1 });
    else window.scrollTo(0, tgt.getBoundingClientRect().top + (window.scrollY || 0));
  };

  return (
    <div data-view="lab">
      {/* rail / section responsive handling (design hides the rail below 900px) */}
      <style>{`
        @media (max-width: 900px) {
          [data-rail] { display: none !important; }
          [data-lab-section] {
            min-height: auto !important;
            padding-top: clamp(40px,8vh,90px) !important;
            padding-bottom: clamp(40px,8vh,90px) !important;
          }
        }
      `}</style>

      <div id="top" className="relative z-[1] flex items-start">
        {/* ---------- STICKY RAIL ---------- */}
        <aside
          data-rail=""
          className="sticky top-0 h-screen flex-[0_0_clamp(300px,30vw,420px)] flex flex-col justify-start px-[clamp(28px,3vw,52px)] pt-[clamp(96px,13vh,150px)] pb-[clamp(26px,4vh,46px)] border-r border-ink/14 z-10"
        >
          <div className="mb-[clamp(22px,4vh,44px)]">
            <div className="font-mono text-[11px] tracking-[.3em] uppercase opacity-[.5] flex gap-[14px] items-center mb-[14px]">
              <span className="w-[30px] h-px bg-ink" />
              The Lab — <span ref={counterRef}>01</span> / 10
            </div>
            <div className="font-serif text-[clamp(30px,3vw,44px)] leading-none tracking-[-.02em] italic">
              Field notes
              <br />
              &amp; experiments
            </div>
          </div>

          <nav className="flex flex-col gap-[clamp(9px,1.5vh,17px)]">
            {labEntries.map((e, i) => (
              <a
                key={e.no}
                href="#"
                data-cursor="jump"
                ref={(el) => {
                  railItemRefs.current[i] = el;
                }}
                onClick={(ev) => {
                  ev.preventDefault();
                  railTo(i);
                }}
                className="flex items-center gap-[14px] no-underline text-inherit [transition:opacity_.5s_cubic-bezier(.22,1,.36,1)]"
                style={{ opacity: 0.36 }}
              >
                <span
                  ref={(el) => {
                    railMarkRefs.current[i] = el;
                  }}
                  className="h-px bg-ink [transition:width_.5s_cubic-bezier(.22,1,.36,1)] flex-[0_0_auto]"
                  style={{ width: 0 }}
                />
                <span className="font-mono text-[11px] tracking-[.08em] flex-[0_0_auto] opacity-[.7]">
                  {e.no}
                </span>
                <span
                  ref={(el) => {
                    railTitleRefs.current[i] = el;
                  }}
                  className="flex-[0_1_auto] min-w-0 whitespace-nowrap overflow-hidden text-ellipsis font-serif text-[clamp(19px,1.7vw,26px)] leading-[1.2] tracking-[-.015em] [transition:font-style_.3s]"
                >
                  {e.title}
                </span>
                <span className="font-mono text-[9px] tracking-[.16em] uppercase opacity-[.35] flex-[0_0_auto] ml-auto">
                  {e.kind}
                </span>
              </a>
            ))}
          </nav>

          <div
            ref={progressRef}
            className="absolute top-0 right-[-1px] w-0.5 bg-ink pointer-events-none"
            style={{ height: "0%" }}
          />
        </aside>

        {/* ---------- MAIN CONTENT ---------- */}
        <main data-content="" className="flex-[1_1_auto] min-w-0 pb-[clamp(40px,10vh,140px)]">
          {labEntries.map((e, i) => {
            const isExp = e.type === "exp";
            const typeLabel = isExp ? "Experiment" : "Note";
            return (
              <section
                key={e.no}
                data-lab-section=""
                ref={(el) => {
                  sectionRefs.current[i] = el;
                }}
                className="relative min-h-screen flex flex-col justify-start px-[clamp(28px,4vw,80px)] py-[clamp(96px,13vh,150px)] border-b border-ink/10"
              >
                {!isExp && (
                  <div
                    aria-hidden
                    className="absolute right-[clamp(20px,4vw,70px)] top-[clamp(70px,11vh,120px)] font-serif text-[clamp(150px,26vw,420px)] leading-[0.8] opacity-[.05] pointer-events-none italic"
                  >
                    {e.no}
                  </div>
                )}

                <div
                  data-reveal=""
                  className="relative max-w-[1100px]"
                  style={{
                    opacity: 0,
                    transform: "translateY(40px)",
                  }}
                >
                  <div className="font-mono text-xs tracking-[.2em] uppercase opacity-[.5] mb-[clamp(16px,2.4vh,24px)]">
                    {e.no} / 10 — {typeLabel} · {e.date} · {e.tags}
                  </div>

                  <h2
                    className="font-serif font-normal text-[clamp(40px,6.4vw,104px)] leading-[0.94] tracking-[-.03em]"
                    style={{ fontStyle: isExp ? "normal" : "italic" }}
                  >
                    {e.title}
                  </h2>

                  {isExp && (
                    <div
                      data-cursor="open"
                      onMouseEnter={() => {
                        const ol = openRefs.current[i];
                        if (ol) ol.style.opacity = "1";
                      }}
                      onMouseLeave={() => {
                        const ol = openRefs.current[i];
                        if (ol) ol.style.opacity = "0";
                      }}
                      className="mt-[clamp(26px,4vh,46px)] relative w-full h-[clamp(260px,46vh,520px)] bg-paper border border-ink/10 overflow-hidden"
                    >
                      <SketchCanvas kind={e.sketch as string} word={e.word} />
                      <span className="absolute left-[18px] bottom-[14px] inline-flex items-center gap-[9px] font-mono text-[10px] tracking-[.2em] uppercase text-muted">
                        <i className="w-1.5 h-1.5 rounded-full bg-ink animate-[lab-blink_1.8s_steps(1)_infinite]" />
                        Live — {e.tags}
                      </span>
                      <span className="absolute right-[18px] bottom-[14px] font-mono text-[10px] tracking-[.2em] uppercase text-muted">
                        Move the cursor
                      </span>
                      <span
                        ref={(el) => {
                          openRefs.current[i] = el;
                        }}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 [transition:opacity_.4s] font-mono text-[11px] tracking-[.2em] uppercase border border-ink/55 rounded-full px-[21px] py-[11px] bg-bone/55 backdrop-blur-[2px]"
                        style={{ opacity: 0 }}
                      >
                        Open ↗
                      </span>
                    </div>
                  )}

                  <p className="mt-[clamp(22px,3.4vh,34px)] text-[clamp(16px,1.5vw,20px)] leading-[1.6] opacity-[.72] max-w-[58ch]">
                    {e.body}
                  </p>

                  <div className="mt-[clamp(22px,3vh,32px)]">
                    <TextButton
                      href="/lab"
                      cursor={isExp ? "open" : "read"}
                      arrow={isExp ? "↗" : "→"}
                      mono
                    >
                      {isExp ? "Open experiment" : "Read note"}
                    </TextButton>
                  </div>
                </div>
              </section>
            );
          })}

        </main>
      </div>

      {/* dark CTA footer — full width, below the rail's flex container so the
          sticky rail releases cleanly before the dark zone */}
      <SiteFooter
        title={
          <>
            Let&rsquo;s build
            <br />
            something.
          </>
        }
      />
    </div>
  );
}
