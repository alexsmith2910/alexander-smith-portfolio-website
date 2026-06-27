"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useExperience } from "./ExperienceProvider";
import { PLASMA_VERT, MENU_PLASMA_FRAG } from "@/lib/shaders";

/**
 * The menu / page-transition surface, rendered as a gated WebGL plasma whose
 * shader computes an ORGANIC dissolve mask (fbm-warped, creeping from the
 * top-right corner) driven by `revealRef.v` — so the overlay has no hard
 * clip-path edge. The loop runs only while the overlay is up and stops once the
 * reveal returns to 0 (no GPU at rest). Cursor-reactive. If WebGL is
 * unavailable it falls back to a plain void fade.
 */
export default function MenuPlasma() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { menuOpen, reduced, pointerRef, revealRef } = useExperience();
  const menuOpenRef = useRef(menuOpen);

  const startRef = useRef<() => void>(() => {});
  const renderStaticRef = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: "low-power" });
    } catch {
      renderer = null;
    }

    let uniforms: {
      uTime: { value: number };
      uReveal: { value: number };
      uAspect: { value: number };
      uPointer: { value: THREE.Vector2 };
    } | null = null;
    let scene: THREE.Scene | null = null;
    let cam: THREE.OrthographicCamera | null = null;
    let geo: THREE.PlaneGeometry | null = null;
    let mat: THREE.ShaderMaterial | null = null;

    if (renderer) {
      // the plasma is soft → render at low internal resolution for a locked 60fps
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1) * 0.6);
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      renderer.setClearColor(0x000000, 0);
      uniforms = {
        uTime: { value: 0 },
        uReveal: { value: 0 },
        uAspect: { value: window.innerWidth / window.innerHeight },
        uPointer: { value: new THREE.Vector2(0.5, 0.62) },
      };
      mat = new THREE.ShaderMaterial({
        vertexShader: PLASMA_VERT,
        fragmentShader: MENU_PLASMA_FRAG,
        uniforms,
        transparent: true,
        depthWrite: false,
        depthTest: false,
      });
      geo = new THREE.PlaneGeometry(2, 2);
      scene = new THREE.Scene();
      scene.add(new THREE.Mesh(geo, mat));
      cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    } else {
      // no WebGL → plain void fade fallback (opacity tracks the reveal)
      canvas.style.background = "#060606";
      canvas.style.opacity = "0";
    }

    const onResize = () => {
      if (!renderer || !uniforms) return;
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      uniforms.uAspect.value = window.innerWidth / window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    let raf = 0;
    let running = false;
    const t0 = performance.now();
    const px = { x: 0.5, y: 0.62 };

    const draw = (now: number) => {
      const rv = revealRef.current.v;
      if (renderer && uniforms && scene && cam) {
        const p = pointerRef.current;
        px.x += (p.x / window.innerWidth - px.x) * 0.08;
        px.y += (1 - p.y / window.innerHeight - px.y) * 0.08;
        uniforms.uPointer.value.set(px.x, px.y);
        uniforms.uReveal.value = rv;
        uniforms.uTime.value = (now - t0) * 0.001;
        renderer.render(scene, cam);
      } else {
        canvas.style.opacity = String(rv);
      }
    };

    const frame = (now: number) => {
      draw(now);
      if (!menuOpenRef.current && revealRef.current.v < 0.004) {
        running = false;
        return; // overlay fully retreated → stop the loop, 0 GPU at rest
      }
      raf = requestAnimationFrame(frame);
    };

    startRef.current = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    renderStaticRef.current = () => draw(performance.now());

    if (reduced) renderStaticRef.current();
    else if (menuOpenRef.current) startRef.current();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      geo?.dispose();
      mat?.dispose();
      renderer?.dispose();
    };
  }, [pointerRef, revealRef, reduced]);

  // start the loop on open / render a single static frame in reduced-motion
  useEffect(() => {
    menuOpenRef.current = menuOpen;
    if (reduced) renderStaticRef.current();
    else if (menuOpen) startRef.current();
  }, [menuOpen, reduced]);

  return <canvas ref={canvasRef} data-menu-plasma="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
