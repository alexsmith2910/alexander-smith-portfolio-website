"use client";

import { useEffect, useRef } from "react";
import { useExperience } from "@/experience/ExperienceProvider";

const PAPER = "#efece6";
const TAU = Math.PI * 2;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

type FlowState = { p: { x: number; y: number; life: number }[] };
type ConstellationState = { pts: { x: number; y: number; vx: number; vy: number }[] };
type PhyllotaxisState = { n: number; max: number };
type LissajousState = { a: number; b: number; ph: number };
type SinetypeState = { word: string };
type OrbitState = { n: number };
type SketchState =
  | FlowState
  | ConstellationState
  | PhyllotaxisState
  | LissajousState
  | SinetypeState
  | OrbitState
  | Record<string, never>;

/**
 * A single live 2D canvas experiment, ported from the Lab design's `makeSketch`
 * engine. Fills its positioned parent. Animates only while on-screen (via an
 * IntersectionObserver) and pauses when the document is hidden. On reduced
 * motion it renders a single still frame instead of looping.
 */
export default function SketchCanvas({ kind, word }: { kind: string; word?: string }) {
  const { reduced } = useExperience();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 1;
    let H = 1;
    let raf = 0;
    let t = 0;
    let running = false;
    const m = { x: -1, y: -1, on: false };
    let st: SketchState = {};

    const clearAll = () => {
      ctx.fillStyle = PAPER;
      ctx.fillRect(0, 0, W, H);
    };
    const fade = (a: number) => {
      ctx.fillStyle = `rgba(239,236,230,${a})`;
      ctx.fillRect(0, 0, W, H);
    };

    const init = () => {
      if (kind === "flow") {
        const n = Math.round(clamp((W * H) / 1700, 160, 560));
        st = {
          p: Array.from({ length: n }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            life: Math.random() * 140,
          })),
        };
        clearAll();
      } else if (kind === "constellation") {
        const n = Math.round(clamp(W / 9, 18, 48));
        st = {
          pts: Array.from({ length: n }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - 0.5) * 0.42,
            vy: (Math.random() - 0.5) * 0.42,
          })),
        };
        clearAll();
      } else if (kind === "phyllotaxis") {
        st = { n: 0, max: Math.round(clamp((W * H) / 130, 260, 1000)) };
        clearAll();
      } else if (kind === "lissajous") {
        st = { a: 3, b: 2, ph: Math.random() * TAU };
        clearAll();
      } else if (kind === "sinetype") {
        st = { word: (word || "oblique") + "   " };
        clearAll();
      } else if (kind === "orbit") {
        st = { n: 14 };
        clearAll();
      } else {
        st = {};
      }
    };

    const draw = () => {
      t++;
      if (kind === "flow") {
        const s = st as FlowState;
        fade(0.06);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(10,10,10,.34)";
        for (const p of s.p) {
          const a =
            (Math.sin(p.x * 0.012 + t * 0.004) + Math.cos(p.y * 0.013 - t * 0.0032)) * Math.PI;
          let nx = p.x + Math.cos(a) * 1.35;
          let ny = p.y + Math.sin(a) * 1.35;
          if (m.on) {
            const dx = p.x - m.x;
            const dy = p.y - m.y;
            const d = Math.hypot(dx, dy);
            if (d < 95) {
              nx += (dx / (d || 1)) * 1.5;
              ny += (dy / (d || 1)) * 1.5;
            }
          }
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(nx, ny);
          ctx.stroke();
          p.x = nx;
          p.y = ny;
          p.life--;
          if (p.life < 0 || nx < -2 || nx > W + 2 || ny < -2 || ny > H + 2) {
            p.x = Math.random() * W;
            p.y = Math.random() * H;
            p.life = 80 + Math.random() * 140;
          }
        }
      } else if (kind === "constellation") {
        const s = st as ConstellationState;
        clearAll();
        const pts = s.pts;
        const th = clamp(W / 5, 80, 150);
        for (const p of pts) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > W) p.vx *= -1;
          if (p.y < 0 || p.y > H) p.vy *= -1;
        }
        ctx.lineWidth = 1;
        for (let i = 0; i < pts.length; i++) {
          for (let j = i + 1; j < pts.length; j++) {
            const a = pts[i];
            const b = pts[j];
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            if (d < th) {
              ctx.strokeStyle = `rgba(10,10,10,${0.16 * (1 - d / th)})`;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
        if (m.on) {
          const tr = th * 1.5;
          for (const p of pts) {
            const d = Math.hypot(p.x - m.x, p.y - m.y);
            if (d < tr) {
              ctx.strokeStyle = `rgba(10,10,10,${0.5 * (1 - d / tr)})`;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(m.x, m.y);
              ctx.stroke();
            }
          }
          ctx.fillStyle = "#0a0a0a";
          ctx.beginPath();
          ctx.arc(m.x, m.y, 2.6, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = "#0a0a0a";
        for (const p of pts) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.7, 0, TAU);
          ctx.fill();
        }
      } else if (kind === "phyllotaxis") {
        const s = st as PhyllotaxisState;
        if (s.n >= s.max) {
          fade(0.05);
          if (s.n >= s.max + 80) {
            clearAll();
            s.n = 0;
          } else {
            s.n++;
          }
          return;
        }
        const c = clamp(Math.min(W, H) / 26, 5, 12);
        const cx = W / 2;
        const cy = H / 2;
        const ga = (137.507 * Math.PI) / 180;
        const lim = Math.min(W, H) / 1.7;
        for (let k = 0; k < 3 && s.n < s.max; k++) {
          const i = s.n++;
          const a = i * ga;
          const r = c * Math.sqrt(i);
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r;
          ctx.fillStyle = `rgba(10,10,10,${clamp(1 - r / lim, 0.12, 0.72)})`;
          ctx.beginPath();
          ctx.arc(x, y, clamp((r / W) * 4, 0.6, 2.8), 0, TAU);
          ctx.fill();
        }
      } else if (kind === "lissajous") {
        const s = st as LissajousState;
        fade(0.05);
        const cx = W / 2;
        const cy = H / 2;
        const R = Math.min(W, H) * 0.38;
        s.ph += 0.0035;
        ctx.strokeStyle = "rgba(10,10,10,.5)";
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        const N = 400;
        for (let k = 0; k <= N; k++) {
          const u = (k / N) * TAU;
          const x = cx + R * Math.sin(s.a * u + s.ph);
          const y = cy + R * Math.sin(s.b * u);
          if (k) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        }
        ctx.stroke();
      } else if (kind === "sinetype") {
        const s = st as SinetypeState;
        clearAll();
        const size = clamp(Math.min(W, H) * 0.2, 26, 80);
        ctx.fillStyle = "#0a0a0a";
        ctx.textBaseline = "middle";
        ctx.font = `italic ${size}px 'Instrument Serif', serif`;
        const amp = H * 0.15;
        const k = 4 / W;
        let x = -((t * 0.7) % (size * 4)) - size * 2;
        while (x < W + size) {
          for (const ch of s.word) {
            const ph = x * k * Math.PI + t * 0.03;
            const y = H / 2 + Math.sin(ph) * amp;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(Math.cos(ph) * 0.16);
            ctx.fillText(ch, 0, 0);
            ctx.restore();
            x += ctx.measureText(ch).width;
          }
        }
      } else if (kind === "orbit") {
        const s = st as OrbitState;
        clearAll();
        const cx = W / 2;
        const cy = H / 2;
        const R = Math.min(W, H) * 0.36;
        const rot = t * 0.004;
        const N = s.n;
        ctx.strokeStyle = "rgba(10,10,10,.16)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, TAU);
        ctx.stroke();
        const pos: [number, number][] = [];
        for (let i = 0; i < N; i++) {
          const a = rot + (i / N) * TAU;
          pos.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]);
        }
        ctx.strokeStyle = "rgba(10,10,10,.2)";
        ctx.lineWidth = 0.9;
        for (let i = 0; i < N; i++) {
          const j = (i + 3 + (i % 4)) % N;
          ctx.beginPath();
          ctx.moveTo(pos[i][0], pos[i][1]);
          ctx.lineTo(pos[j][0], pos[j][1]);
          ctx.stroke();
        }
        ctx.fillStyle = "#0a0a0a";
        pos.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p[0], p[1], 1.8, 0, TAU);
          ctx.fill();
        });
        const pk = Math.floor((t * 0.05) % N);
        const pp = pos[pk];
        ctx.beginPath();
        ctx.arc(pp[0], pp[1], 3.6, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = "rgba(10,10,10,.32)";
        ctx.beginPath();
        ctx.arc(pp[0], pp[1], 6 + ((t % 34) / 34) * 7, 0, TAU);
        ctx.stroke();
      }
    };

    const frame = () => {
      raf = requestAnimationFrame(frame);
      draw();
    };
    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const still = () => {
      for (let i = 0; i < 160; i++) draw();
    };
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      W = Math.round(r.width);
      H = Math.round(r.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      init();
    };

    resize();

    // ----- reduced motion: a single still frame, no rAF -----
    if (reduced) {
      try {
        still();
      } catch {
        /* noop */
      }
      let rzt: ReturnType<typeof setTimeout>;
      const onResize = () => {
        clearTimeout(rzt);
        rzt = setTimeout(() => {
          resize();
          try {
            still();
          } catch {
            /* noop */
          }
        }, 180);
      };
      window.addEventListener("resize", onResize);
      return () => {
        window.removeEventListener("resize", onResize);
        clearTimeout(rzt);
      };
    }

    // ----- animated: only run while visible -----
    let want = false;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          want = en.isIntersecting;
          if (en.isIntersecting) {
            if (!document.hidden) start();
          } else {
            stop();
          }
        });
      },
      { threshold: 0.04 }
    );
    io.observe(canvas);

    const onVis = () => {
      if (document.hidden) stop();
      else if (want) start();
    };
    document.addEventListener("visibilitychange", onVis);

    // ----- mouse (interactive kinds: flow attraction, constellation links) -----
    const target: HTMLElement = canvas.parentElement ?? canvas;
    const onMove = (ev: MouseEvent) => {
      const b = canvas.getBoundingClientRect();
      m.x = ev.clientX - b.left;
      m.y = ev.clientY - b.top;
      m.on = true;
    };
    const onLeave = () => {
      m.x = -1;
      m.y = -1;
      m.on = false;
    };
    target.addEventListener("mousemove", onMove);
    target.addEventListener("mouseleave", onLeave);

    // ----- debounced resize -----
    let rzt: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(rzt);
      rzt = setTimeout(() => {
        resize();
        if (want && !document.hidden && !running) start();
      }, 180);
    };
    window.addEventListener("resize", onResize);

    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      target.removeEventListener("mousemove", onMove);
      target.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", onResize);
      clearTimeout(rzt);
    };
  }, [kind, word, reduced]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
    />
  );
}
