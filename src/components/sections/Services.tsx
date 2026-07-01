"use client";

import Reveal from "@/components/ui/Reveal";
import Kicker from "@/components/ui/Kicker";
import { services, servicesIntro } from "@/data/services";

/** Outcome-framed services. Each card shows the offer + benefit at rest; the
 *  detail blurb fades up on hover so the interaction carries the content. */
export default function Services() {
  return (
    <section id="services" className="relative z-[1] px-gutter py-[clamp(70px,14vh,180px)]">
      <Reveal className="mb-[clamp(34px,6vh,70px)] max-w-[820px]">
        <Kicker>{servicesIntro.kicker}</Kicker>
        <h2 className="mt-[clamp(20px,3vh,30px)] font-serif text-[clamp(30px,5vw,72px)] font-normal leading-[1.0] tracking-[-.02em]">
          {servicesIntro.title}
        </h2>
        <p className="mt-[clamp(18px,2.6vh,28px)] max-w-[54ch] text-[clamp(14px,1.4vw,17px)] leading-[1.55] opacity-[.7]">
          {servicesIntro.sub}
        </p>
      </Reveal>

      <Reveal className="grid grid-cols-1 gap-px overflow-hidden border border-ink/14 bg-ink/14 sm:grid-cols-2">
        {services.map((s) => (
          <div
            key={s.no}
            data-cursor=""
            className="group relative flex flex-col bg-bone p-[clamp(24px,3vw,46px)] [transition:background-color_.5s_ease] hover:bg-paper"
          >
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-xs tracking-[.2em] opacity-40">{s.no}</span>
              <span className="font-mono text-[10px] uppercase tracking-[.16em] opacity-0 [transition:opacity_.5s_ease] group-hover:opacity-50">
                {s.tags.join(" · ")}
              </span>
            </div>

            <h3 className="mt-[clamp(28px,5vh,64px)] font-serif text-[clamp(26px,2.8vw,42px)] leading-[1.05] tracking-[-.02em]">
              {s.title}
            </h3>
            <p className="mt-3 font-serif text-[clamp(17px,1.6vw,22px)] italic opacity-[.62]">
              {s.outcome}
            </p>

            {/* benefit detail — settles in on hover */}
            <p className="mt-[18px] max-w-[42ch] translate-y-1.5 text-[14px] leading-[1.55] opacity-0 [transition:opacity_.5s_ease,transform_.5s_cubic-bezier(.22,1,.36,1)] group-hover:translate-y-0 group-hover:opacity-[.72]">
              {s.blurb}
            </p>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
