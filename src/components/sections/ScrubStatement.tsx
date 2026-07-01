"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useExperience } from "@/experience/ExperienceProvider";

gsap.registerPlugin(ScrollTrigger);

// The signature scrubbed moment: the sentence sits as faint "ghost" type and scroll
// inks it in, word by word. Edit the line freely. (Lenis-safe: a tall track section +
// a sticky inner panel gives the pinned feel without ScrollTrigger's pin.)
const STATEMENT = "Worlds rendered live in the browser — built to be felt before they are read.";
const WORDS = STATEMENT.split(" ");

export default function ScrubStatement() {
  const { reduced } = useExperience();
  const sectionRef = useRef<HTMLElement | null>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const words = wordRefs.current.filter(Boolean) as HTMLSpanElement[];
    if (reduced) {
      words.forEach((w) => {
        w.style.opacity = "1";
        w.style.filter = "none";
        w.style.transform = "none";
      });
      return;
    }
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
        },
      });
      tl.fromTo(
        words,
        { opacity: 0.12, filter: "blur(6px)", y: 10 },
        { opacity: 1, filter: "blur(0px)", y: 0, stagger: 0.5, ease: "none", duration: 1 }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={sectionRef}
      className="relative z-[1]"
      style={{ height: reduced ? "auto" : "210vh" }}
    >
      <div
        className="flex min-h-screen items-center px-gutter py-[clamp(60px,12vh,140px)]"
        style={{ position: reduced ? "static" : "sticky", top: 0 }}
      >
        <p className="max-w-[1180px] font-serif text-[clamp(34px,6vw,108px)] font-normal leading-[1.04] tracking-[-.02em]">
          {WORDS.map((w, i) => (
            <span
              key={i}
              ref={(el) => {
                wordRefs.current[i] = el;
              }}
              className="inline-block will-change-[opacity,transform,filter]"
              style={reduced ? undefined : { opacity: 0.12, filter: "blur(6px)", transform: "translateY(10px)" }}
            >
              {w}
              {i < WORDS.length - 1 ? " " : ""}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
