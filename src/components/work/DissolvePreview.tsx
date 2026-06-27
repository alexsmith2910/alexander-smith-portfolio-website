"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { useExperience, useTick } from "@/experience/ExperienceProvider";
import { projects, stripeCss } from "@/data/projects";
import { hexToRgb01 } from "@/lib/math";
import { DISSOLVE_VERT, DISSOLVE_FRAG } from "@/lib/shaders";

export type DissolvePreviewHandle = {
  show: (index: number) => void;
  hide: () => void;
};

type Pat = {
  ang: number;
  w: number;
  c1: [number, number, number];
  c2: [number, number, number];
};

const PAT: Pat[] = projects.map((p) => ({
  ang: (p.stripe.ang * Math.PI) / 180,
  w: p.stripe.w,
  c1: hexToRgb01(p.stripe.c1),
  c2: hexToRgb01(p.stripe.c2),
}));

const UNIFORMS = [
  "uRes",
  "uProg",
  "uAngA",
  "uWA",
  "uC1A",
  "uC2A",
  "uAngB",
  "uWB",
  "uC1B",
  "uC2B",
] as const;

/**
 * Floating cursor-following preview for the Work index. On row hover the page
 * calls show(index); the canvas morph-dissolves between stripe patterns via a
 * fullscreen-triangle WebGL shader (DISSOLVE_FRAG). Falls back to a CSS stripe
 * gradient when WebGL is unavailable or motion is reduced.
 */
const DissolvePreview = forwardRef<DissolvePreviewHandle>(function DissolvePreview(_props, ref) {
  const { reduced, pointerRef } = useExperience();

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileRef = useRef<HTMLSpanElement | null>(null);

  // ---- WebGL state ----
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const glReadyRef = useRef(false);
  const uRef = useRef<Record<string, WebGLUniformLocation | null>>({});
  const dprRef = useRef(1);

  // ---- dissolve state ----
  const aRef = useRef<Pat>({ ang: 0, w: 10, c1: [0, 0, 0], c2: [0, 0, 0] });
  const bRef = useRef<Pat>({ ang: 0, w: 10, c1: [0, 0, 0], c2: [0, 0, 0] });
  const progRef = useRef(1);
  const dissolvingRef = useRef(false);

  // ---- floating + visibility state ----
  const onRef = useRef(false);
  const curIdxRef = useRef(-1);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const posRef = useRef({
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
    y: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
    tx: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
    ty: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
  });

  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  // ---------- init WebGL ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    dprRef.current = Math.min(2, window.devicePixelRatio || 1);

    let gl: WebGLRenderingContext | null = null;
    try {
      const opts: WebGLContextAttributes = {
        preserveDrawingBuffer: true,
        antialias: true,
        premultipliedAlpha: false,
      };
      gl =
        (canvas.getContext("webgl", opts) as WebGLRenderingContext | null) ||
        (canvas.getContext("experimental-webgl", opts) as WebGLRenderingContext | null);
    } catch {
      gl = null;
    }

    if (gl) {
      const sh = (type: number, src: string) => {
        const s = gl!.createShader(type)!;
        gl!.shaderSource(s, src);
        gl!.compileShader(s);
        return s;
      };
      const pr = gl.createProgram()!;
      gl.attachShader(pr, sh(gl.VERTEX_SHADER, DISSOLVE_VERT));
      gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, DISSOLVE_FRAG));
      gl.linkProgram(pr);
      if (gl.getProgramParameter(pr, gl.LINK_STATUS)) {
        gl.useProgram(pr);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(pr, "p");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        const u: Record<string, WebGLUniformLocation | null> = {};
        for (const n of UNIFORMS) u[n] = gl.getUniformLocation(pr, n);
        uRef.current = u;
        glRef.current = gl;
        glReadyRef.current = true;
      }
    }

    if (!glReadyRef.current && canvas) {
      canvas.style.background = stripeCss(projects[0].stripe);
    }
  }, []);

  const renderGL = () => {
    const gl = glRef.current;
    const canvas = canvasRef.current;
    if (!gl || !canvas || !glReadyRef.current) return;
    const dpr = dprRef.current;
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    const u = uRef.current;
    const A = aRef.current;
    const B = bRef.current;
    gl.uniform2f(u.uRes, w, h);
    gl.uniform1f(u.uProg, progRef.current);
    gl.uniform1f(u.uAngA, A.ang);
    gl.uniform1f(u.uWA, A.w * dpr);
    gl.uniform3fv(u.uC1A, A.c1);
    gl.uniform3fv(u.uC2A, A.c2);
    gl.uniform1f(u.uAngB, B.ang);
    gl.uniform1f(u.uWB, B.w * dpr);
    gl.uniform3fv(u.uC1B, B.c1);
    gl.uniform3fv(u.uC2B, B.c2);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const copyPat = (src: Pat, dst: Pat) => {
    dst.ang = src.ang;
    dst.w = src.w;
    dst.c1 = [...src.c1];
    dst.c2 = [...src.c2];
  };
  const setPat = (dst: Pat, i: number) => copyPat(PAT[i], dst);

  // ---------- imperative API ----------
  useImperativeHandle(ref, () => ({
    show(i: number) {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      onRef.current = true;
      if (wrapRef.current) wrapRef.current.style.opacity = "1";
      if (i === curIdxRef.current) return;
      const first = curIdxRef.current === -1;
      curIdxRef.current = i;

      // swap the file label with a brief fade
      const fileEl = fileRef.current;
      if (fileEl) {
        fileEl.style.opacity = "0";
        if (fileTimerRef.current) clearTimeout(fileTimerRef.current);
        fileTimerRef.current = setTimeout(() => {
          fileEl.textContent = projects[i].file;
          fileEl.style.opacity = "1";
        }, 120);
      }

      if (!glReadyRef.current) {
        if (canvasRef.current) canvasRef.current.style.background = stripeCss(projects[i].stripe);
        return;
      }
      if (first || reducedRef.current) {
        setPat(aRef.current, i);
        setPat(bRef.current, i);
        progRef.current = 1;
        dissolvingRef.current = false;
        renderGL();
        return;
      }
      copyPat(bRef.current, aRef.current);
      setPat(bRef.current, i);
      progRef.current = 0;
      dissolvingRef.current = true;
    },
    hide() {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        onRef.current = false;
        if (wrapRef.current) wrapRef.current.style.opacity = "0";
        curIdxRef.current = -1;
      }, 90);
    },
  }));

  // ---------- per-frame: follow cursor + advance dissolve ----------
  useTick(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const pos = posRef.current;
    if (onRef.current) {
      pos.tx = pointerRef.current.x + 60;
      pos.ty = pointerRef.current.y;
    }
    pos.x += (pos.tx - pos.x) * 0.12;
    pos.y += (pos.ty - pos.y) * 0.12;
    wrap.style.left = pos.x + "px";
    wrap.style.top = pos.y + "px";
    wrap.style.transform = `translate(-50%,-50%) scale(${onRef.current ? 1 : 0.92})`;

    if (dissolvingRef.current) {
      progRef.current += 0.05;
      if (progRef.current >= 1) {
        progRef.current = 1;
        dissolvingRef.current = false;
      }
    }
    if (glReadyRef.current && (onRef.current || dissolvingRef.current)) renderGL();
  });

  return (
    <div
      ref={wrapRef}
      data-preview=""
      aria-hidden
      className="fixed top-0 left-0 z-40 pointer-events-none w-[clamp(320px,26vw,620px)] h-[clamp(216px,17.6vw,420px)] overflow-hidden rounded-[6px] bg-paper shadow-[0_24px_70px_rgba(10,10,10,.22)]"
      style={{
        opacity: 0,
        transform: "translate(-50%,-50%) scale(.92)",
      }}
    >
      <canvas
        ref={canvasRef}
        data-preview-canvas=""
        className="absolute inset-0 w-full h-full block"
      />
      <span
        ref={fileRef}
        data-preview-file=""
        className="absolute left-[18px] bottom-[14px] font-mono text-[11px] tracking-[.14em] text-muted [transition:opacity_.16s_ease]"
      />
    </div>
  );
});

export default DissolvePreview;
