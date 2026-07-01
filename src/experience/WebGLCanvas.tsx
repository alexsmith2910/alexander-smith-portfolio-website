"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useExperience, type TickState } from "./ExperienceProvider";
import { PLASMA_VERT, PLASMA_FRAG, POST_FRAG } from "@/lib/shaders";
import { mixHex, clamp } from "@/lib/math";

// past the hero the clay recedes to this opacity floor — a living background presence
// that never competes with the copy, instead of cutting out entirely.
const PRESENCE_FLOOR = 0.34;

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
    scene.add(new THREE.AmbientLight(0xffffff, 0.42));
    // soft studio fill: warm sky / cool ground for art-directed shading
    scene.add(new THREE.HemisphereLight(0xfff4e6, 0x8a8fb0, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(5, 8, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xcfd6ff, 0.7);
    rim.position.set(-6, -3, 4);
    scene.add(rim);
    // warm light that tracks the cursor — barely-there in the light zone, a warm
    // glow that swells as you descend into the dark footer zone (so it's lit, not flat black)
    const cursorLight = new THREE.PointLight(0xffd6a2, 0.7, 42, 2);
    cursorLight.position.set(0, 0, 7);
    scene.add(cursorLight);

    // ceramic clay with a faint thin-film iridescence + clearcoat sheen on the highlights.
    // ONE shared instance worn by every object (placeholders AND loaded models) so the
    // dark-zone color shift is a single update and the whole hero reads as one cohesive
    // clay gallery — the material is the brand, the forms are interchangeable.
    const sharedClay = new THREE.MeshPhysicalMaterial({
      color: 0xf3f1ec,
      side: THREE.DoubleSide, // imported meshes have inconsistent winding — cull-free avoids x-ray holes
      roughness: 0.82,
      metalness: 0,
      clearcoat: 0.4,
      clearcoatRoughness: 0.55,
      iridescence: 0.32,
      iridescenceIOR: 1.3,
      sheen: 0.3,
      sheenColor: new THREE.Color(0xbfb9ff),
    });

    // The hero is a column of clay sculptures the camera rails through on scroll. Each slot
    // loads a .glb from /public/models; until it loads (or if the file isn't there yet) a clay
    // primitive stands in, so the composition always holds. On load we override every mesh
    // material with `sharedClay` and center + size-normalize the model into its holder Group.
    const TARGET = 3.2; // normalized max-dimension (world units), before per-model mul + viewport scale
    const MODELS: { url: string; mul: number; yRot: number; placeholder: THREE.BufferGeometry }[] = [
      { url: "/models/chess.glb",    mul: 1.3,  yRot: 1.4,  placeholder: new THREE.TorusKnotGeometry(1.1, 0.42, 180, 28, 2, 3) },
      { url: "/models/ring.glb",     mul: 0.85, yRot: 0.4,  placeholder: new THREE.TorusGeometry(1.2, 0.5, 32, 80) },
      { url: "/models/laptop.glb",   mul: 1.05, yRot: -0.4, placeholder: new THREE.DodecahedronGeometry(1.5, 0) },
      { url: "/models/camera.glb",   mul: 0.95, yRot: 0.5,  placeholder: new THREE.TorusKnotGeometry(1, 0.34, 160, 24, 3, 4) },
      { url: "/models/crane.glb",    mul: 1.15, yRot: -0.3, placeholder: new THREE.OctahedronGeometry(1.6, 1) },
      { url: "/models/golfball.glb", mul: 0.7,  yRot: 0,    placeholder: new THREE.IcosahedronGeometry(1.4, 2) },
    ];

    const clay: THREE.Object3D[] = [];
    const holderSet = new Set<THREE.Object3D>();
    const loader = new GLTFLoader();
    let disposed = false;

    // Fit a model into a centered, size-normalized pivot. Critical: the model is recentered on
    // its own origin FIRST, then scale + yaw live on a wrapping pivot — so the spin pivots around
    // the geometry's center, not the source origin. (Some exports park geometry far from origin
    // via node translations; rotating before centering would fling it off-screen — that bit chess.)
    const normalize = (model: THREE.Object3D, mul: number, yRot: number) => {
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      model.position.sub(center); // center geometry on the model origin (scale 1, no rotation yet)
      const pivot = new THREE.Group();
      pivot.add(model);
      pivot.scale.setScalar((TARGET * mul) / maxDim);
      pivot.rotation.y = yRot;
      return pivot;
    };

    MODELS.forEach((cfg, i) => {
      const holder = new THREE.Group();
      const a = (i / MODELS.length) * Math.PI * 2;
      holder.position.set(Math.cos(a) * 5.2 + (i % 2 ? 1.5 : -1.5), -i * 7 + 1, -2 - (i % 3));
      holder.rotation.set(Math.random() * 3, Math.random() * 3, 0);
      holder.userData.spin = new THREE.Vector3((Math.random() - 0.5) * 0.003, (Math.random() - 0.5) * 0.004 + 0.002, 0);
      holder.userData.baseY = holder.position.y;
      holder.userData.base = holder.position.clone();

      // stand-in clay primitive until (or unless) the model loads
      const placeholder = new THREE.Mesh(cfg.placeholder, sharedClay);
      holder.add(placeholder);

      scene.add(holder);
      clay.push(holder);
      holderSet.add(holder);

      loader.load(
        cfg.url,
        (gltf) => {
          if (disposed) return;
          const model = gltf.scene;
          // Strip baked shadow/ground planes (common in Sketchfab exports) — they render as a
          // stray clay slab AND blow out the bounding box, shrinking the real object. Gate on
          // GEOMETRIC flatness first (a shadow plane is near-zero thickness), THEN a name match —
          // because artists sometimes name real meshes "Plane.001" (e.g. our chess knight), so a
          // name-only rule deletes the actual model. Flat + plane-ish name = a true backing plane.
          const planeRe = /plane|shadow|sombra|ground|floor|backdrop|baked/i;
          const toRemove: THREE.Object3D[] = [];
          model.traverse((o) => {
            const mesh = o as THREE.Mesh;
            if (!mesh.isMesh) return;
            const g = mesh.geometry;
            if (!g.boundingBox) g.computeBoundingBox();
            const bb = g.boundingBox!;
            const d = [bb.max.x - bb.min.x, bb.max.y - bb.min.y, bb.max.z - bb.min.z].sort((a, b) => a - b);
            const flat = d[2] > 0 && d[0] < d[2] * 0.05; // thinnest dim < 5% of largest → a plane
            const mat = mesh.material;
            const matName = Array.isArray(mat) ? mat.map((m) => m?.name).join(" ") : mat?.name || "";
            if (flat && planeRe.test(`${mesh.name} ${matName}`)) {
              toRemove.push(mesh);
              return;
            }
            mesh.material = sharedClay;
          });
          toRemove.forEach((m) => {
            m.removeFromParent();
            (m as THREE.Mesh).geometry?.dispose();
          });
          const fitted = normalize(model, cfg.mul, cfg.yRot);
          holder.remove(placeholder);
          cfg.placeholder.dispose();
          holder.add(fitted);
        },
        undefined,
        () => {
          // file not present yet (e.g. a Sketchfab model awaiting manual download) — keep the
          // clay primitive standing in. Silent: missing models are expected during setup.
        }
      );
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
      // shrink on phones (portrait) so it doesn't clip awkwardly; scale up on large monitors
      const w = window.innerWidth;
      const f = w < 700 ? 0.72 : Math.max(1, Math.min(2.2, w / 1440));
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

    // ---------- cinematic composite (clay → target → post shader) ----------
    // The clay scene renders into clayRT, then this draws it to screen with edge
    // chromatic aberration + a high-threshold halation (palette-safe), preserving alpha.
    const dbs = renderer.getDrawingBufferSize(new THREE.Vector2());
    const clayRT = new THREE.WebGLRenderTarget(Math.max(2, dbs.x), Math.max(2, dbs.y), {
      depthBuffer: true,
      stencilBuffer: false,
    });
    clayRT.texture.minFilter = THREE.LinearFilter;
    clayRT.texture.magFilter = THREE.LinearFilter;
    clayRT.texture.colorSpace = THREE.SRGBColorSpace;
    const postMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uTex: { value: clayRT.texture },
        uTexel: { value: new THREE.Vector2(1 / Math.max(2, dbs.x), 1 / Math.max(2, dbs.y)) },
        uCA: { value: 7.0 },      // chromatic aberration (~px at the corners)
        uGlow: { value: 0.55 },   // halation strength on the lit surfaces
        uThresh: { value: 0.66 }, // luminance gate — catches the lit tops, not the whole form
      },
      vertexShader: PLASMA_VERT,
      fragmentShader: POST_FRAG,
    });
    const postScene = new THREE.Scene();
    postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat));

    setGlReady(true);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      fxRT.setSize(Math.max(2, (window.innerWidth * 0.5) | 0), Math.max(2, (window.innerHeight * 0.5) | 0));
      fxMat.uniforms.uAspect.value = window.innerWidth / window.innerHeight;
      fxMat.uniforms.uMaxField.value = Math.hypot(window.innerWidth / window.innerHeight, 1);
      const d = renderer.getDrawingBufferSize(new THREE.Vector2());
      clayRT.setSize(Math.max(2, d.x), Math.max(2, d.y));
      postMat.uniforms.uTexel.value.set(1 / Math.max(2, d.x), 1 / Math.max(2, d.y));
      applyClayScale();
    };
    window.addEventListener("resize", onResize);

    // ---------- draggable / throwable clay (raycast + spring-home) ----------
    const canDrag = window.matchMedia("(hover: hover)").matches; // desktop only — never fight touch scroll
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const dragPlane = new THREE.Plane();
    const dragPoint = new THREE.Vector3();
    const dragOffset = new THREE.Vector3();
    const camDir = new THREE.Vector3();
    let dragMesh: THREE.Object3D | null = null;
    let dragVX = 0;
    let dragVY = 0;
    const toNDC = (cx: number, cy: number) => {
      ndc.x = (cx / window.innerWidth) * 2 - 1;
      ndc.y = -(cy / window.innerHeight) * 2 + 1;
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!isHomeRef.current || menuOpenRef.current) return;
      toNDC(e.clientX, e.clientY);
      raycaster.setFromCamera(ndc, camera);
      // recursive: models are nested under their holder Group — walk the hit back up to it
      const hit = raycaster.intersectObjects(clay, true)[0];
      if (!hit) return;
      let o: THREE.Object3D | null = hit.object;
      while (o && !holderSet.has(o)) o = o.parent;
      if (!o) return;
      dragMesh = o;
      camera.getWorldDirection(camDir);
      dragPlane.setFromNormalAndCoplanarPoint(camDir.negate(), dragMesh.position);
      if (raycaster.ray.intersectPlane(dragPlane, dragPoint)) dragOffset.copy(dragMesh.position).sub(dragPoint);
      dragMesh.userData.released = false;
      dragMesh.userData.throwSpin = undefined;
      dragVX = 0;
      dragVY = 0;
      window.dispatchEvent(new Event("ob:grab"));
      e.preventDefault();
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragMesh) return;
      toNDC(e.clientX, e.clientY);
      raycaster.setFromCamera(ndc, camera);
      if (raycaster.ray.intersectPlane(dragPlane, dragPoint)) {
        const tx = dragPoint.x + dragOffset.x;
        const ty = dragPoint.y + dragOffset.y;
        dragVX = tx - dragMesh.position.x;
        dragVY = ty - dragMesh.position.y;
        dragMesh.position.x = tx;
        dragMesh.position.y = ty;
      }
    };
    const onPointerUp = () => {
      if (!dragMesh) return;
      // release: convert drag velocity into a throw-spin, then spring home
      dragMesh.userData.throwSpin = { x: clamp(-dragVY * 0.6, -0.4, 0.4), y: clamp(dragVX * 0.6, -0.4, 0.4) };
      dragMesh.userData.released = true;
      dragMesh = null;
    };
    if (canDrag) {
      window.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerup", onPointerUp);
    }

    let kGL = -1;
    // FPS-adaptive quality: drop the post-fx composite under sustained low frame rates.
    let lastT = 0;
    let frameEMA = 16.7;
    let lowFrames = 0;
    let highFrames = 0;
    let lowPerf = false;
    // konami easter egg — a decaying spin boost on the clay
    let spinBoost = 0;
    const onKonami = () => { spinBoost = 1; };
    window.addEventListener("ob:konami", onKonami);
    const tick = (s: TickState) => {
      // home: a continuous, scroll-reactive clay presence. The objects are stacked down
      // the page and the camera rails through them as you scroll — full opacity in the
      // hero, easing to a low background floor past it so it never competes with the copy.
      const onHome = isHomeRef.current && !menuOpenRef.current;
      const footerActive = s.dark > 0.004;
      const vh = window.innerHeight;

      // presence opacity: 1 through the hero, ramps to PRESENCE_FLOOR over the next ~0.65vh.
      const fade = onHome ? clamp((s.scroll - vh * 0.55) / (vh * 0.65), 0, 1) : 0;
      const homeOpacity = onHome ? 1 - fade * (1 - PRESENCE_FLOOR) : 0;
      // the footer plasma needs the canvas at full opacity; take whichever wants more.
      const wantNum = Math.max(homeOpacity, footerActive ? 1 : 0);
      const active = onHome || footerActive;
      const wantOpacity = active ? wantNum.toFixed(3) : "0";
      if (canvas.style.opacity !== wantOpacity) canvas.style.opacity = wantOpacity;
      if (!active) return;
      if (document.hidden) return; // don't render a hidden tab (rAF already throttles; belt-and-braces)

      // measure frame cadence (EMA) and adapt quality with hysteresis so it never flaps
      if (lastT) {
        const dt = s.t - lastT;
        if (dt > 0 && dt < 200) frameEMA += (dt - frameEMA) * 0.1;
      }
      lastT = s.t;
      if (frameEMA > 26) {
        highFrames = 0;
        if (!lowPerf && ++lowFrames > 60) lowPerf = true; // ~1s sustained < ~38fps → degrade
      } else if (frameEMA < 19) {
        lowFrames = 0;
        if (lowPerf && ++highFrames > 120) lowPerf = false; // ~2s sustained > ~52fps → restore
      } else {
        lowFrames = 0;
        highFrames = 0;
      }

      renderer.clear();
      renderer.autoClear = false;

      if (onHome) {
        const railY = s.scroll && document.documentElement.scrollHeight > window.innerHeight
          ? (s.scroll / (document.documentElement.scrollHeight - window.innerHeight)) * 38
          : 0;
        camera.position.y = -railY;
        camera.position.x += (s.mouseEx * 1.6 - camera.position.x) * 0.05;
        camera.lookAt(0, -railY, 0);
        // cursor-reactive warm light (mouseE* are ±0.5, +y downward)
        cursorLight.position.x = s.mouseEx * 16;
        cursorLight.position.y = -railY + 1 - s.mouseEy * 10;
        cursorLight.intensity = 0.7 + s.dark * 2.6;
        cursorLight.color.set(mixHex("#ffd6a2", "#ffb877", s.dark)); // warmer as it darkens
        // scroll velocity adds a subtle lean/whoosh to the spin — the world reacts to motion
        const vk = clamp(s.velocity * 0.0006, -0.05, 0.05);
        if (spinBoost > 0.001) spinBoost *= 0.97; else spinBoost = 0; // konami decay
        const boost = 1 + spinBoost * 9;
        clay.forEach((m) => {
          const spin = m.userData.spin as THREE.Vector3;
          const base = m.userData.base as THREE.Vector3;
          if (m === dragMesh) {
            // grabbed — follows the pointer (position set in onPointerMove); keep a light spin
            m.rotation.x += spin.x;
            m.rotation.y += spin.y;
            return;
          }
          // throw-spin from a release, decaying
          const ts = m.userData.throwSpin as { x: number; y: number } | undefined;
          if (ts) {
            m.rotation.x += ts.x;
            m.rotation.y += ts.y;
            ts.x *= 0.94;
            ts.y *= 0.94;
            if (Math.abs(ts.x) + Math.abs(ts.y) < 0.0008) m.userData.throwSpin = undefined;
          }
          m.rotation.x += spin.x * boost;
          m.rotation.y += (spin.y + vk) * boost;
          const bob = Math.sin(s.t * 0.0006 + base.x) * 0.5;
          if (m.userData.released) {
            // spring back home after a throw
            m.position.x += (base.x - m.position.x) * 0.05;
            m.position.z += (base.z - m.position.z) * 0.05;
            m.position.y += (base.y + bob - m.position.y) * 0.05;
            if (Math.abs(m.position.x - base.x) < 0.04 && Math.abs(m.position.z - base.z) < 0.04) m.userData.released = false;
          } else {
            m.position.y = base.y + bob;
          }
        });
        debris.rotation.y = s.t * 0.00004;
        if (Math.abs(s.dark - kGL) > 0.0015) {
          kGL = s.dark;
          (scene.fog as THREE.Fog).color.set(mixHex("#e8e6e1", "#060606", s.dark));
          sharedClay.color.set(mixHex("#f3f1ec", "#1a1a1e", s.dark));
          (debris.material as THREE.PointsMaterial).color.set(mixHex("#9a978f", "#6a6f9a", s.dark));
        }
        if (lowPerf) {
          // degraded: skip the post composite (the heaviest pass) and draw clay directly
          renderer.render(scene, camera);
        } else {
          // render the clay into its target, then composite to screen through the
          // cinematic post shader (CA + halation), preserving transparency.
          renderer.setRenderTarget(clayRT);
          renderer.setClearColor(0x000000, 0);
          renderer.clear(true, true, true);
          renderer.render(scene, camera);
          renderer.setRenderTarget(null);
          renderer.render(postScene, fxCam);
        }
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
      window.removeEventListener("ob:konami", onKonami);
      if (canDrag) {
        window.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
      }
      disposed = true;
      clay.forEach((h) =>
        h.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (mesh.isMesh && mesh.geometry) mesh.geometry.dispose();
        })
      );
      sharedClay.dispose();
      pg.dispose();
      fxRT.dispose();
      fxMat.dispose();
      clayRT.dispose();
      postMat.dispose();
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
