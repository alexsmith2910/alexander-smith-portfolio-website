"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import * as THREE from "three";
import { useExperience, type TickState } from "./ExperienceProvider";
import { PLASMA_VERT, PLASMA_FRAG } from "@/lib/shaders";
import { mixHex } from "@/lib/math";

export default function WebGLCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pathname = usePathname();
  const isHomeRef = useRef(pathname === "/");
  const { registerTick, setGlReady, menuOpen, reduced } = useExperience();
  const menuOpenRef = useRef(menuOpen);

  useEffect(() => {
    isHomeRef.current = pathname === "/";
  }, [pathname]);
  useEffect(() => {
    menuOpenRef.current = menuOpen;
  }, [menuOpen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const glSupported = (() => {
      try {
        const c = document.createElement("canvas");
        return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
      } catch {
        return false;
      }
    })();
    if (!glSupported || reduced) {
      canvas.style.display = "none";
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      canvas.style.display = "none";
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // transparent clears — never paint opaque black
    canvas.style.transition = "opacity .3s ease";

    // ---------- clay scene (home hero) ----------
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(new THREE.Color("#e8e6e1"), 8, 26);
    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 14);
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(5, 8, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xcfd6ff, 0.7);
    rim.position.set(-6, -3, 4);
    scene.add(rim);

    const clayMat = () => new THREE.MeshStandardMaterial({ color: 0xf3f1ec, roughness: 0.95, metalness: 0 });
    const geos = [
      new THREE.TorusKnotGeometry(1.1, 0.42, 180, 28, 2, 3),
      new THREE.IcosahedronGeometry(1.5, 1),
      new THREE.TorusGeometry(1.2, 0.5, 32, 80),
      new THREE.DodecahedronGeometry(1.5, 0),
      new THREE.TorusKnotGeometry(1, 0.34, 160, 24, 3, 4),
      new THREE.OctahedronGeometry(1.6, 1),
    ];
    const clay: THREE.Mesh[] = [];
    geos.forEach((g, i) => {
      const m = new THREE.Mesh(g, clayMat());
      const a = (i / geos.length) * Math.PI * 2;
      m.position.set(Math.cos(a) * 5.2 + (i % 2 ? 1.5 : -1.5), -i * 7 + 1, -2 - (i % 3));
      m.rotation.set(Math.random() * 3, Math.random() * 3, 0);
      m.userData.spin = new THREE.Vector3((Math.random() - 0.5) * 0.003, (Math.random() - 0.5) * 0.004 + 0.002, 0);
      m.userData.baseY = m.position.y;
      scene.add(m);
      clay.push(m);
    });

    const N = 900;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 4;
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const pm = new THREE.PointsMaterial({
      color: 0x9a978f,
      size: 0.045,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const debris = new THREE.Points(pg, pm);
    scene.add(debris);

    // scale the clay with viewport width so it doesn't shrink away on large monitors
    const applyClayScale = () => {
      const f = Math.max(1, Math.min(2.2, window.innerWidth / 1440));
      clay.forEach((m) => m.scale.setScalar(f));
    };
    applyClayScale();

    // ---------- plasma (footer dissolve) ----------
    const fxMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uTime: { value: 0 },
        uReveal: { value: 0 },
        uMode: { value: 0 },
        uOrigin: { value: new THREE.Vector2(1, 1) },
        uAspect: { value: window.innerWidth / window.innerHeight },
        uMaxField: { value: Math.hypot(window.innerWidth / window.innerHeight, 1) },
      },
      vertexShader: PLASMA_VERT,
      fragmentShader: PLASMA_FRAG,
    });
    const fxScene = new THREE.Scene();
    fxScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fxMat));
    const fxCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const rtW = Math.max(2, (window.innerWidth * 0.5) | 0);
    const rtH = Math.max(2, (window.innerHeight * 0.5) | 0);
    const fxRT = new THREE.WebGLRenderTarget(rtW, rtH, { depthBuffer: false, stencilBuffer: false });
    fxRT.texture.minFilter = THREE.LinearFilter;
    fxRT.texture.magFilter = THREE.LinearFilter;
    fxRT.texture.colorSpace = THREE.SRGBColorSpace;
    const compMat = new THREE.MeshBasicMaterial({ map: fxRT.texture, transparent: true, depthWrite: false, depthTest: false });
    const compScene = new THREE.Scene();
    compScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), compMat));

    setGlReady(true);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      fxRT.setSize(Math.max(2, (window.innerWidth * 0.5) | 0), Math.max(2, (window.innerHeight * 0.5) | 0));
      fxMat.uniforms.uAspect.value = window.innerWidth / window.innerHeight;
      fxMat.uniforms.uMaxField.value = Math.hypot(window.innerWidth / window.innerHeight, 1);
      applyClayScale();
    };
    window.addEventListener("resize", onResize);

    let kGL = -1;
    const tick = (s: TickState) => {
      const homeActive = isHomeRef.current && !menuOpenRef.current;
      const footerActive = s.dark > 0.004;
      const active = homeActive || footerActive;

      // hide the canvas entirely when there's nothing to draw (content pages at rest,
      // or while the menu covers the screen). The menu is handled in CSS, not here.
      const wantOpacity = active ? "1" : "0";
      if (canvas.style.opacity !== wantOpacity) canvas.style.opacity = wantOpacity;
      if (!active) return;

      renderer.clear();
      renderer.autoClear = false;

      if (homeActive) {
        const railY = s.scroll && document.documentElement.scrollHeight > window.innerHeight
          ? (s.scroll / (document.documentElement.scrollHeight - window.innerHeight)) * 38
          : 0;
        camera.position.y = -railY;
        camera.position.x += (s.mouseEx * 1.6 - camera.position.x) * 0.05;
        camera.lookAt(0, -railY, 0);
        clay.forEach((m) => {
          const spin = m.userData.spin as THREE.Vector3;
          m.rotation.x += spin.x;
          m.rotation.y += spin.y;
          m.position.y = (m.userData.baseY as number) + Math.sin(s.t * 0.0006 + m.position.x) * 0.5;
        });
        debris.rotation.y = s.t * 0.00004;
        if (Math.abs(s.dark - kGL) > 0.0015) {
          kGL = s.dark;
          (scene.fog as THREE.Fog).color.set(mixHex("#e8e6e1", "#060606", s.dark));
          clay.forEach((m) => (m.material as THREE.MeshStandardMaterial).color.set(mixHex("#f3f1ec", "#1a1a1e", s.dark)));
          (debris.material as THREE.PointsMaterial).color.set(mixHex("#9a978f", "#6a6f9a", s.dark));
        }
        renderer.render(scene, camera);
      }

      if (footerActive) {
        fxMat.uniforms.uTime.value = s.t * 0.001;
        fxMat.uniforms.uMode.value = 0; // vertical footer dissolve
        fxMat.uniforms.uReveal.value = s.dark;
        renderer.setRenderTarget(fxRT);
        renderer.setClearColor(0x000000, 0);
        renderer.clear(true, false, false);
        renderer.render(fxScene, fxCam);
        renderer.setRenderTarget(null);
        renderer.render(compScene, fxCam);
      }
      renderer.autoClear = true;
    };
    const unregister = registerTick(tick);

    return () => {
      unregister();
      window.removeEventListener("resize", onResize);
      geos.forEach((g) => g.dispose());
      pg.dispose();
      fxRT.dispose();
      fxMat.dispose();
      renderer.dispose();
    };
  }, [registerTick, setGlReady, reduced]);

  return (
    <canvas
      ref={canvasRef}
      data-canvas=""
      aria-hidden
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", zIndex: 0, pointerEvents: "none", display: "block", opacity: 0 }}
    />
  );
}
