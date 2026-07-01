"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { site } from "@/data/site";
import { useExperience, useTick } from "@/experience/ExperienceProvider";
import { EASE } from "@/lib/ease";

/**
 * Ambient audio toggle. The button IS the equaliser — five bars that genuinely
 * dance with the track via a pre-master AnalyserNode (so liveliness is independent
 * of the low listening volume), per-bar peak-normalized so all five move despite the
 * heavily low-passed bed. Plays a PRODUCED loop if `site.audio.ambient` points at a
 * file in /public (a real loop sounds far better than synthesis); otherwise falls back
 * to a soft, low-passed synth pad. Also drives subtle UI ticks (only when sound is on).
 * Master volume comes from `site.audio.volume`. Honours prefers-reduced-motion.
 */

const BARS = 5;
const BINS = [1, 2, 3, 5, 7]; // skip DC bin 0; fftSize 64 -> 32 bins; low/low-mid (bed lowpassed @640Hz)
const REDUCED_SHAPE = [0.34, 0.58, 0.82, 0.54, 0.3]; // calm static arc, clearly "on"
const OFF_SHAPE = [3, 5, 7, 5, 4]; // static equaliser silhouette at rest (off) — discoverable, calm (px)
const MIN = 2; // muted/baseline bar height (px)
const MAX = 14; // full bar height (px) == container height
const RANGE = MAX - MIN; // 12
const ATTACK = 0.45; // fast snap up
const DECAY = 0.12; // slower gravity fall
const REDUCED_LERP = 0.12;
const PEAK_DECAY = 0.995; // upper envelope: slow decay
const PEAK_FLOOR = 0.06;
const FLOOR_RISE = 0.02; // lower envelope: slow rise toward the troughs (instant drop to new minima)
const ENERGY_GATE = 8; // sum(data[BINS]) below this => use idle fallback

export default function AudioToggle() {
  const [on, setOn] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const barsRef = useRef<HTMLSpanElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const synthTimerRef = useRef<number | null>(null);

  const { reduced } = useExperience();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const busRef = useRef<GainNode | null>(null);
  const freqRef = useRef<Uint8Array<ArrayBuffer> | null>(null); // shared, allocated once
  const ampRef = useRef([{ v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }]); // per-bar enable envelope 0..1 (gsap targets)
  const smoothRef = useRef<number[]>([0, 0, 0, 0, 0]); // smoothed live value 0..1 per bar
  const peakRef = useRef<number[]>([PEAK_FLOOR, PEAK_FLOOR, PEAK_FLOOR, PEAK_FLOOR, PEAK_FLOOR]); // per-bar upper envelope
  const floorRef = useRef<number[]>([0, 0, 0, 0, 0]); // per-bar lower envelope (min-max normalize by dynamic range)
  const hoverGainRef = useRef(1); // lerped lean-in 1..1.15
  const hoverRef = useRef(false); // imperative hover read for tick
  const [hovered, setHovered] = useState(false);
  const [flash, setFlash] = useState(false); // enable confirm-flash of label
  const flashTimer = useRef<number | null>(null);
  const labelOpen = hovered || flash; // keyboard focus reveals the label via CSS (group-focus-visible)

  // Evolving warm-chord fallback when no produced loop is provided — slow string-like pad
  // that drifts through a small progression with long crossfades, so it feels cinematic and
  // alive rather than a static drone, and never jumps in volume.
  const buildSynth = (ctx: AudioContext, master: AudioNode) => {
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 640; // warm, no harsh highs
    filter.Q.value = 0.3;
    filter.connect(master);

    // slow filter drift gives the pad gentle movement
    const fLfo = ctx.createOscillator();
    fLfo.frequency.value = 0.018;
    const fLg = ctx.createGain();
    fLg.gain.value = 150;
    fLfo.connect(fLg);
    fLg.connect(filter.frequency);
    fLfo.start();

    // low, warm chords (Dm – Bb – F – C feel) — one sustained voice each, crossfaded in turn
    const chords = [
      [73.42, 110.0, 146.83], // Dm
      [58.27, 110.0, 174.61], // Bb
      [87.31, 130.81, 174.61], // F
      [98.0, 130.81, 196.0], // C
    ];
    const voices = chords.map((notes) => {
      const g = ctx.createGain();
      g.gain.value = 0;
      g.connect(filter);
      notes.forEach((f) => {
        [-5, 5].forEach((det) => {
          const o = ctx.createOscillator();
          o.type = "sawtooth"; // strings-ish through the lowpass
          o.frequency.value = f;
          o.detune.value = det; // slight detune = chorused warmth
          const og = ctx.createGain();
          og.gain.value = 0.07;
          o.connect(og);
          og.connect(g);
          o.start();
        });
      });
      return g;
    });

    // crossfade to the next chord every ~11s with a long 6s ramp — no transients
    let idx = 0;
    const step = () => {
      const now = ctx.currentTime;
      voices.forEach((g, i) => {
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(g.gain.value, now);
        g.gain.linearRampToValueAtTime(i === idx ? 1 : 0, now + 6);
      });
      idx = (idx + 1) % voices.length;
    };
    step();
    synthTimerRef.current = window.setInterval(step, 11000);
  };

  const start = async () => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      const master = ctx.createGain();
      master.gain.value = 0;
      // compressor on the bed glues levels and tames any loud swells (incl. produced files)
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -28;
      comp.knee.value = 26;
      comp.ratio.value = 6;
      comp.attack.value = 0.05;
      comp.release.value = 0.5;
      master.connect(comp);
      comp.connect(ctx.destination);
      ctxRef.current = ctx; // set synchronously so toggle() can ramp immediately
      masterRef.current = master;

      // observe-only analyser bus, tapped PRE-master so bars stay lively at low volume.
      // graph: sources -> bus(gain 1) -> master(gsap-ramped) -> comp -> destination,
      //        bus -> analyser (dead-end; NOT connected to destination).
      const bus = ctx.createGain();
      bus.gain.value = 1;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64; // 32 frequency bins
      analyser.smoothingTimeConstant = 0.6; // JS owns attack/decay; keep analyser light
      bus.connect(analyser); // OBSERVE-ONLY dead-end (do NOT connect analyser -> destination)
      bus.connect(master); // bus -> master(gain) -> comp -> destination (unchanged downstream)
      busRef.current = bus;
      analyserRef.current = analyser;
      freqRef.current = new Uint8Array(analyser.frequencyBinCount); // 32, allocate ONCE

      const src = site.audio?.ambient;
      if (src) {
        try {
          const res = await fetch(src);
          const buf = await ctx.decodeAudioData(await res.arrayBuffer());
          const node = ctx.createBufferSource();
          node.buffer = buf;
          node.loop = true;
          node.connect(bus);
          node.start();
        } catch {
          buildSynth(ctx, bus); // file missing/unsupported → fall back to the pad
        }
      } else {
        buildSynth(ctx, bus);
      }
    }
    ctxRef.current.resume();
  };

  const toggle = () => {
    const next = !on;
    setOn(next);
    const vol = site.audio?.volume ?? 0.12;
    if (next) {
      start();
      if (masterRef.current) gsap.to(masterRef.current.gain, { value: vol, duration: 1.6 }); // UNCHANGED
    } else if (masterRef.current) {
      gsap.to(masterRef.current.gain, { value: 0, duration: 0.8 }); // UNCHANGED
    }
    // bar envelope choreography (single on/off gate)
    gsap.killTweensOf(ampRef.current);
    if (next) {
      gsap.to(ampRef.current, { v: 1, duration: 1.0, ease: EASE.entrance, stagger: reduced ? 0 : 0.06 }); // left-to-right rise
      // confirm-flash the label even if not hovered
      setFlash(true);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = window.setTimeout(() => setFlash(false), 900);
    } else {
      gsap.to(ampRef.current, { v: 0, duration: 0.8, ease: EASE.micro, stagger: reduced ? 0 : { each: 0.05, from: "end" } }); // right-to-left settle, synced to 0.8s fade
    }
  };

  // tidy timers if the toggle ever unmounts
  useEffect(() => () => { if (synthTimerRef.current) clearInterval(synthTimerRef.current); if (flashTimer.current) clearTimeout(flashTimer.current); }, []);

  // ---------- UI ticks — one soft tick per interactive element ENTERED (not per move) ----------
  useEffect(() => {
    if (!on) return;
    const tick = (freq: number, vol: number, dur: number) => {
      const ctx = ctxRef.current;
      if (!ctx || ctx.state !== "running") return;
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = freq;
      const g = ctx.createGain();
      const t = ctx.currentTime;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    };
    const sel = "[data-cursor], a, button, [role='button']";
    let lastEl: Element | null = null;
    const onOver = (e: Event) => {
      const el = (e.target as HTMLElement)?.closest?.(sel) ?? null;
      if (el === lastEl) return; // still inside the same element — no repeat
      lastEl = el;
      if (el) tick(1180, 0.018, 0.05); // airy tick, once on enter
    };
    const onDown = (e: Event) => {
      if (!(e.target as HTMLElement)?.closest?.(sel)) return;
      tick(520, 0.04, 0.09); // softer, lower tick on press
    };
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerdown", onDown, { passive: true });
    return () => {
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [on]);

  // ---------- the single bar driver — analyser-sampled, runs on the master useTick loop ----------
  useTick((s) => {
    const bars = barsRef.current?.querySelectorAll("i");
    if (!bars || bars.length < BARS) return;

    // hover lean-in (desktop, non-reduced only)
    const hgTarget = hoverRef.current && !reduced ? 1.15 : 1;
    hoverGainRef.current += (hgTarget - hoverGainRef.current) * 0.12;

    const an = analyserRef.current;
    const data = freqRef.current;
    let energy = 0;
    let amplive = false;
    for (let i = 0; i < BARS; i++) if (ampRef.current[i].v > 0.001) { amplive = true; break; }
    if (an && data && amplive && !reduced) {
      an.getByteFrequencyData(data);
      for (const b of BINS) energy += data[b];
    }

    for (let i = 0; i < BARS; i++) {
      let target: number; // 0..1 desired bar fill
      if (reduced) {
        target = REDUCED_SHAPE[i];
      } else if (an && data && amplive && energy >= ENERGY_GATE) {
        const raw = data[BINS[i]] / 255;
        // Track each bar's own dynamic RANGE (upper + lower envelope) and normalize within it.
        // A steadily-loud bin (its energy near the ceiling) thus still maps its fluctuations
        // across the full height instead of pinning at 1.0 — so all 5 bars genuinely dance.
        const pk = Math.max(raw, peakRef.current[i] * PEAK_DECAY, PEAK_FLOOR);
        peakRef.current[i] = pk;
        const fl = raw < floorRef.current[i] ? raw : floorRef.current[i] + (raw - floorRef.current[i]) * FLOOR_RISE;
        floorRef.current[i] = fl;
        const span = pk - fl;
        target = span > 0.04 ? Math.min(1, Math.max(0, (raw - fl) / span)) : 0;
      } else {
        // idle FALLBACK only (pre-data window / near-silence): gentle traveling sine
        target = 0.16 + 0.18 * Math.abs(Math.sin(s.t * 0.0022 + i * 0.9));
      }
      // asymmetric smoothing (snap up / fall slow); calm lerp under reduced
      const cur = smoothRef.current[i];
      const k = reduced ? REDUCED_LERP : target > cur ? ATTACK : DECAY;
      const sm = cur + (target - cur) * k;
      smoothRef.current[i] = sm;
      // amp envelope is the on/off gate; hoverGain only when not reduced
      const hg = reduced ? 1 : hoverGainRef.current;
      // morph from the static OFF silhouette into the live/dancing height via the on/off envelope
      const dynamicH = MIN + RANGE * sm * hg;
      const amp = ampRef.current[i].v;
      let h = OFF_SHAPE[i] + (dynamicH - OFF_SHAPE[i]) * amp;
      if (h < MIN) h = MIN; else if (h > MAX) h = MAX;
      (bars[i] as HTMLElement).style.height = h.toFixed(2) + "px";
    }
  }, [reduced]);
  // NOTE: `on` intentionally NOT in deps — ampRef envelope gates visibility; analyser sampling is gated on amplive.
  // When fully off, all ampRef[i].v === 0 => every bar height === MIN (flat baseline). Solves "frozen mid-dance".

  // ---------- pointer choreography (magnetic + press); transform channels kept separate ----------
  const onEnter = () => { setHovered(true); hoverRef.current = true; };
  const onLeave = () => {
    setHovered(false);
    hoverRef.current = false;
    if (!reduced && btnRef.current) gsap.to(btnRef.current, { x: 0, y: 0, duration: 0.5, ease: "power3.out" }); // release magnetic
    // also release press on leave-during-press
    if (btnRef.current) gsap.to(btnRef.current, { scale: 1, duration: reduced ? 0.18 : 0.4, ease: reduced ? EASE.micro : "back.out(2.2)" });
    if (barsRef.current) gsap.to(barsRef.current, { scaleY: 1, duration: reduced ? 0.18 : 0.4, ease: reduced ? EASE.micro : "back.out(2)" });
  };
  const onMove = (e: React.MouseEvent) => {
    // magnetic pull (skip under reduced)
    if (reduced || !btnRef.current) return;
    const b = btnRef.current.getBoundingClientRect();
    const x = (e.clientX - b.left - b.width / 2) * 0.18;
    const y = (e.clientY - b.top - b.height / 2) * 0.2;
    gsap.to(btnRef.current, { x, y, duration: 0.3, ease: "power3.out" });
  };
  const onDown = () => {
    // press depress
    if (btnRef.current) gsap.to(btnRef.current, { scale: 0.9, duration: 0.12, ease: EASE.micro });
    if (barsRef.current) gsap.to(barsRef.current, { scaleY: 0.7, transformOrigin: "bottom", duration: 0.12, ease: EASE.micro });
  };
  const onUp = () => {
    // spring back with weight (overshoot unless reduced)
    if (btnRef.current) gsap.to(btnRef.current, { scale: 1, duration: reduced ? 0.18 : 0.4, ease: reduced ? EASE.micro : "back.out(2.2)" });
    if (barsRef.current) gsap.to(barsRef.current, { scaleY: 1, duration: reduced ? 0.18 : 0.4, ease: reduced ? EASE.micro : "back.out(2)" });
  };

  return (
    <button
      ref={btnRef}
      data-cursor="sound"
      aria-pressed={on}
      aria-label={on ? "Mute ambient sound" : "Enable ambient sound"}
      onClick={toggle}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onMouseMove={onMove}
      onPointerDown={onDown}
      onPointerUp={onUp}
      className={`group fixed bottom-[22px] right-[clamp(20px,4vw,56px)] z-[45] bg-transparent border-none cursor-none [mix-blend-mode:difference] text-bone ${on ? "opacity-[.7]" : "opacity-[.5]"} flex items-end font-grotesk [transition:opacity_.45s] [will-change:transform] focus-visible:outline-none focus-visible:opacity-100`}
    >
      {/* hover/focus/flash side-label — clipped, opens LEFT/inward (corner element), zero layout shift */}
      <span aria-hidden className="pointer-events-none absolute right-full bottom-0 mr-[10px] overflow-hidden">
        <span
          className={`block whitespace-nowrap font-mono text-[10px] uppercase tracking-[.16em] [transition:transform_.5s_var(--ease-entrance),opacity_.45s_var(--ease-entrance)] group-focus-visible:translate-x-0 group-focus-visible:opacity-100 ${labelOpen ? "translate-x-0 opacity-100" : "translate-x-[8px] opacity-0"}`}
        >
          {on ? "Sound on" : "Enable sound"}
        </span>
      </span>
      {/* the 5 bars — the only in-flow child, keeps the corner anchor rock-steady */}
      <span ref={barsRef} className="relative flex items-end gap-[2px] h-[14px] [will-change:transform]">
        {Array.from({ length: BARS }).map((_, i) => (
          <i key={i} className="w-[1.5px] bg-current block" style={{ height: MIN }} />
        ))}
      </span>
    </button>
  );
}
