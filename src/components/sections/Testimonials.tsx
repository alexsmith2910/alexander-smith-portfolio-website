"use client";

import Reveal from "@/components/ui/Reveal";
import Kicker from "@/components/ui/Kicker";
import { testimonials, testimonialsIntro, clients } from "@/data/testimonials";

/** Social-proof band: a row of short quotes + a clients strip. All placeholder
 *  until real, attributable quotes/logos are dropped into src/data/testimonials.ts. */
export default function Testimonials() {
  return (
    <section id="testimonials" className="relative z-[1] px-gutter py-[clamp(70px,14vh,180px)]">
      <Reveal className="mb-[clamp(34px,6vh,64px)]">
        <Kicker>{testimonialsIntro.kicker}</Kicker>
        <h2 className="mt-[clamp(20px,3vh,30px)] max-w-[20ch] font-serif text-[clamp(28px,4.4vw,64px)] font-normal leading-[1.02] tracking-[-.02em]">
          {testimonialsIntro.title}
        </h2>
      </Reveal>

      <div className="grid grid-cols-1 gap-[clamp(28px,4vw,64px)] md:grid-cols-3">
        {testimonials.map((t, i) => (
          <figure
            key={i}
            data-reveal
            className="group flex flex-col border-t border-ink/16 pt-[clamp(22px,3vh,34px)] opacity-0 transition-colors duration-500 hover:border-ink/45"
          >
            <blockquote className="font-serif text-[clamp(19px,1.9vw,27px)] leading-[1.3] tracking-[-.01em]">
              <span className="inline-block opacity-30 transition-[opacity,transform] duration-500 group-hover:-translate-y-0.5 group-hover:opacity-60">“</span>
              {t.quote}
              <span className="opacity-30">”</span>
            </blockquote>
            <figcaption className="mt-[clamp(20px,3vh,30px)] font-mono text-[11px] uppercase tracking-[.14em] opacity-[.6] transition-opacity duration-300 group-hover:opacity-90">
              {t.name}
              <span className="opacity-50">
                {" "}
                — {t.role}, {t.company}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>

      {/* clients strip */}
      <Reveal className="mt-[clamp(50px,9vh,110px)] border-t border-ink/14 pt-[clamp(26px,4vh,40px)]">
        <div className="mb-6 font-mono text-[11px] uppercase tracking-[.3em] opacity-40">
          Selected clients
        </div>
        <ul className="flex flex-wrap gap-x-[clamp(28px,5vw,72px)] gap-y-4">
          {clients.map((c) => (
            <li
              key={c}
              data-cursor=""
              className="font-serif text-[clamp(18px,2vw,28px)] italic opacity-[.5] transition-opacity duration-300 hover:opacity-100"
            >
              {c}
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
