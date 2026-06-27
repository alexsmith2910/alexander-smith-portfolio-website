"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

/** ambient drone toggle — four detuned oscillators with slow LFOs */
export default function AudioToggle() {
  const [on, setOn] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const barsRef = useRef<HTMLSpanElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);

  const start = () => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      [110, 164.81, 220, 277.18].forEach((f, i) => {
        const o = ctx.createOscillator();
        o.type = i % 2 ? "sine" : "triangle";
        o.frequency.value = f;
        const g = ctx.createGain();
        g.gain.value = 0.16 / (i + 1);
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.05 + i * 0.03;
        const lg = ctx.createGain();
        lg.gain.value = 0.04;
        lfo.connect(lg);
        lg.connect(g.gain);
        o.connect(g);
        g.connect(master);
        o.start();
        lfo.start();
      });
      ctxRef.current = ctx;
      masterRef.current = master;
    }
    ctxRef.current.resume();
  };

  const toggle = () => {
    const next = !on;
    setOn(next);
    if (next) {
      start();
      if (masterRef.current) gsap.to(masterRef.current.gain, { value: 0.5, duration: 1.4 });
    } else if (masterRef.current) {
      gsap.to(masterRef.current.gain, { value: 0, duration: 0.8 });
    }
  };

  useEffect(() => {
    if (!on) return;
    const bars = barsRef.current?.querySelectorAll("i");
    if (!bars) return;
    let raf = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      bars.forEach((b, i) => {
        (b as HTMLElement).style.height = 4 + Math.abs(Math.sin(t * 0.004 + i * 1.7)) * 9 + "px";
      });
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [on]);

  return (
    <button
      ref={btnRef}
      data-cursor="sound"
      onClick={toggle}
      className={`fixed bottom-[22px] right-[clamp(20px,4vw,56px)] z-[45] bg-transparent border-none cursor-none [mix-blend-mode:difference] text-bone ${on ? "opacity-[.7]" : "opacity-[.5]"} flex items-center gap-[9px] font-grotesk text-[11px] tracking-[.02em] [transition:opacity_.45s]`}
    >
      <span ref={barsRef} className="flex items-end gap-0.5 h-2.5">
        <i className="w-[1.5px] bg-current block [transition:height_.12s]" style={{ height: 4 }} />
        <i className="w-[1.5px] bg-current block [transition:height_.12s]" style={{ height: 9 }} />
        <i className="w-[1.5px] bg-current block [transition:height_.12s]" style={{ height: 6 }} />
      </span>
      <span>{on ? "Sound on" : "Enable sound"}</span>
    </button>
  );
}
