"use client";

import Reveal from "@/components/ui/Reveal";
import Kicker from "@/components/ui/Kicker";
import { techStack } from "@/data/about";

/** A tidy stack strip — signals depth to technical buyers (CTOs, founders).
 *  `dark` renders it as a self-contained void-on-violet feature that leads into the
 *  footer's dark zone (kept independent of the darkFactor system so the footer
 *  dissolve timing is untouched). */
export default function TechStack({ kicker = "Built with", dark = false }: { kicker?: string; dark?: boolean }) {
  return (
    <section
      className={`relative z-[1] overflow-hidden px-gutter ${
        dark ? "bg-void text-bone py-[clamp(72px,15vh,180px)]" : "py-[clamp(50px,10vh,120px)]"
      }`}
    >
      {dark && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(120% 95% at 72% 22%, rgba(58,52,110,0.42), transparent 60%)" }}
        />
      )}
      <div className="relative z-[1]">
        <Reveal className="mb-[clamp(28px,4vh,44px)]">
          <Kicker light={dark}>{kicker}</Kicker>
        </Reveal>
        <div className="grid grid-cols-2 gap-[clamp(28px,4vw,64px)] sm:grid-cols-4">
          {techStack.map((g) => (
            <div key={g.group} data-reveal className="opacity-0">
              <div className="mb-[18px]">
                <span className="font-mono text-[11px] uppercase tracking-[.2em] opacity-40">{g.group}</span>
              </div>
              <ul className="flex flex-col gap-2.5">
                {g.items.map((it) => (
                  <li key={it} className="group font-serif text-[clamp(18px,1.8vw,26px)] tracking-[-.01em]">
                    <span className="flex items-center">
                      <span
                        aria-hidden
                        className={`h-px w-0 transition-[width,margin] duration-[500ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:w-5 group-hover:mr-3 ${
                          dark ? "bg-bone/55" : "bg-ink/55"
                        }`}
                      />
                      <span className="opacity-85 transition-opacity duration-300 group-hover:opacity-100">{it}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
