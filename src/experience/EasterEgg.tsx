"use client";

import { useEffect } from "react";
import { site } from "@/data/site";

// ↑ ↑ ↓ ↓ ← → ← → B A
const SEQ = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

/** Two small delights for the curious: a styled console signature (great for the
 *  technical buyers who open devtools) and a Konami code that sends the clay spinning. */
export default function EasterEgg() {
  useEffect(() => {
    const big = "font-family:'Instrument Serif',serif;font-size:42px;font-style:italic;color:#0a0a0a";
    const small = "font-family:monospace;font-size:12px;line-height:1.6;color:#6b675e";
    console.log("%cAlexander Smith", big);
    console.log(
      `%cBuilt from scratch — no page builder, every shader hand-written.\nLike what you see under the hood? ${site.email}\nPsst — try the Konami code. ↑↑↓↓←→←→ B A`,
      small
    );

    let i = 0;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      i = k === SEQ[i] ? i + 1 : k === SEQ[0] ? 1 : 0;
      if (i === SEQ.length) {
        i = 0;
        window.dispatchEvent(new Event("ob:konami"));
        console.log("%c🌀 you found it — the clay says hi.", small);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return null;
}
