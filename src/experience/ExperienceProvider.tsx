"use client";

import "lenis/dist/lenis.css";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type MutableRefObject,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { clamp, mixHex } from "@/lib/math";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// ---- menu / page-transition reveal (the menu IS the transition) ----
// `revealRef.v` 0→1 drives an organic, shader-driven dissolve (MENU_PLASMA_FRAG)
// that creeps from the top-right corner. Open grows it; a plain close and a
// navigation both retreat it back into the same corner — no hard clip-path edge.
const REVEAL_EASE = "power2.inOut";

export type TickState = {
  t: number;
  dark: number;
  menuReveal: number;
  mouseEx: number;
  mouseEy: number;
  scroll: number;
};
type Tick = (s: TickState) => void;

interface ExperienceCtx {
  menuOpen: boolean;
  /** true only when the menu is open AS A MENU (nav links shown), not during a
   *  page-transition cover where the same overlay is used without content */
  menuContent: boolean;
  setMenuOpen: (o: boolean) => void;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
  navigate: (href: string) => void;
  /** 0→1 organic-reveal driver for the menu/transition plasma (MenuPlasma reads it) */
  revealRef: MutableRefObject<{ v: number }>;
  registerTick: (cb: Tick) => () => void;
  darkRef: MutableRefObject<number>;
  menuRevealRef: MutableRefObject<number>;
  pointerRef: MutableRefObject<{ x: number; y: number }>;
  glReady: boolean;
  setGlReady: (b: boolean) => void;
  reduced: boolean;
  lenisRef: MutableRefObject<Lenis | null>;
  /** true once the first-load intro loader has finished (or was never shown) */
  introDoneRef: MutableRefObject<boolean>;
}

const Ctx = createContext<ExperienceCtx | null>(null);

export function useExperience() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useExperience must be used within ExperienceProvider");
  return c;
}

/** register a per-frame callback driven by the single master loop */
export function useTick(cb: Tick, deps: unknown[] = []) {
  const { registerTick } = useExperience();
  useEffect(() => registerTick(cb), [registerTick, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
}

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [menuOpen, setMenuOpenState] = useState(false);
  const [menuContent, setMenuContentState] = useState(false);
  const [glReady, setGlReady] = useState(false);

  const reducedRef = useRef(false);
  const [reduced, setReduced] = useState(false);

  const darkRef = useRef(0);
  const menuRevealRef = useRef(0);
  const menuOpenRef = useRef(false);
  const menuContentRef = useRef(false);
  const pointerRef = useRef({ x: 0, y: 0 });
  const mouseRef = useRef({ x: 0, y: 0, ex: 0, ey: 0 });

  const ticksRef = useRef<Set<Tick>>(new Set());
  const lenisRef = useRef<Lenis | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const revealRef = useRef({ v: 0 });

  const darkzoneEls = useRef<HTMLElement[]>([]);
  const revealCtx = useRef<gsap.Context | null>(null);
  const coveredRef = useRef(false); // overlay fully covers → route can swap / reveal pending
  const navigatingRef = useRef(false); // a page-transition (vs a plain menu close) is in flight
  const openIntentRef = useRef(false); // the user's DESIRED menu state — drives toggle so a
  // click mid-animation reverses, instead of keying off menuOpen which lags through the close
  const firstLoad = useRef(true);
  const introDoneRef = useRef(false);

  const registerTick = useCallback((cb: Tick) => {
    ticksRef.current.add(cb);
    return () => {
      ticksRef.current.delete(cb);
    };
  }, []);

  const setMenuOpen = useCallback((o: boolean) => {
    menuOpenRef.current = o;
    setMenuOpenState(o);
  }, []);
  const setMenuContent = useCallback((v: boolean) => {
    menuContentRef.current = v;
    setMenuContentState(v);
  }, []);

  // ---------- menu as menu (hamburger) ----------
  const openMenu = useCallback(() => {
    openIntentRef.current = true;
    setMenuContent(true);
    setMenuOpen(true);
    gsap.killTweensOf(revealRef.current);
    if (reducedRef.current) {
      revealRef.current.v = 1;
      return;
    }
    gsap.to(revealRef.current, { v: 1, duration: 1.5, ease: "power2.out" });
  }, [setMenuOpen, setMenuContent]);

  const closeMenu = useCallback(() => {
    openIntentRef.current = false;
    setMenuContent(false); // content fades first…
    gsap.killTweensOf(revealRef.current);
    if (reducedRef.current) {
      revealRef.current.v = 0;
      setMenuOpen(false);
      return;
    }
    // …then the dissolve retreats into the top-right corner (no navigation)
    gsap.to(revealRef.current, { v: 0, duration: 1.2, ease: REVEAL_EASE, delay: 0.15, onComplete: () => setMenuOpen(false) });
  }, [setMenuOpen, setMenuContent]);

  const toggleMenu = useCallback(() => {
    if (openIntentRef.current) closeMenu();
    else openMenu();
  }, [openMenu, closeMenu]);

  // ---------- menu as page transition ----------
  const navigate = useCallback(
    (href: string) => {
      const samePath = href.split("#")[0] === pathname;
      const hash = href.includes("#") ? href.split("#")[1] : "";
      if (samePath) {
        // in-page scroll — no transition
        if (hash) {
          const el = document.getElementById(hash);
          if (el) lenisRef.current ? lenisRef.current.scrollTo(el) : el.scrollIntoView({ behavior: "smooth" });
        } else {
          lenisRef.current ? lenisRef.current.scrollTo(0, { duration: 1 }) : window.scrollTo({ top: 0, behavior: "smooth" });
        }
        if (menuOpenRef.current) closeMenu();
        return;
      }

      // a navigation always ends with the menu closed → reset the intent so the
      // next hamburger click reliably opens it
      openIntentRef.current = false;

      if (reducedRef.current) {
        if (menuOpenRef.current) {
          setMenuContent(false);
          setMenuOpen(false);
          gsap.killTweensOf(revealRef.current);
          revealRef.current.v = 0;
        }
        router.push(href);
        return;
      }

      navigatingRef.current = true;
      gsap.killTweensOf(revealRef.current);
      if (menuOpenRef.current) {
        // Case A — already open: fade the nav content, swap the route behind the
        // cover; the reveal (retreat to the corner) runs in the pathname effect.
        setMenuContent(false);
        coveredRef.current = true;
        revealRef.current.v = 1;
        gsap.delayedCall(0.3, () => router.push(href));
      } else {
        // Case B — closed: dissolve in from the top-right with NO content, then swap.
        setMenuContent(false);
        setMenuOpen(true);
        gsap.to(revealRef.current, {
          v: 1,
          duration: 0.9,
          ease: REVEAL_EASE,
          onComplete: () => {
            coveredRef.current = true;
            router.push(href);
          },
        });
      }
    },
    [router, pathname, closeMenu, setMenuOpen, setMenuContent]
  );

  // ---------- reduced motion ----------
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      reducedRef.current = mq.matches;
      setReduced(mq.matches);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // ---------- pointer ----------
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerRef.current.x = e.clientX;
      pointerRef.current.y = e.clientY;
      mouseRef.current.x = e.clientX / window.innerWidth - 0.5;
      mouseRef.current.y = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // ---------- lenis ----------
  useEffect(() => {
    if (reducedRef.current) return;
    const lenis = new Lenis({ lerp: 0.08, wheelMultiplier: 0.9, smoothWheel: true });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const onVis = () => (document.hidden ? lenis.stop() : lenis.start());
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // ---------- intercept every internal link → ink page transition ----------
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || a.getAttribute("target") === "_blank") return;
      if (href.startsWith("http") || href.startsWith("mailto") || href.startsWith("tel") || href.startsWith("#")) return;
      if (!href.startsWith("/")) return;
      e.preventDefault();
      navigate(href);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [navigate]);

  // stop scroll while menu is open
  useEffect(() => {
    const l = lenisRef.current;
    if (!l) return;
    if (menuOpen) l.stop();
    else l.start();
  }, [menuOpen]);

  // ---------- build reveal triggers + rescan darkzones on route change ----------
  useEffect(() => {
    // run after paint so the new route's DOM exists
    const id = requestAnimationFrame(() => {
      darkzoneEls.current = Array.from(document.querySelectorAll<HTMLElement>("[data-darkzone]"));

      // reset scroll on real navigation
      if (!firstLoad.current) {
        window.scrollTo(0, 0);
        lenisRef.current?.scrollTo(0, { immediate: true });
      }

      // GSAP ScrollTrigger reveals — animate IN on enter, OUT on leave (both directions)
      revealCtx.current?.revert();
      const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
      if (reducedRef.current) {
        els.forEach((el) => {
          el.style.opacity = "1";
          el.style.transform = "none";
        });
      } else if (els.length) {
        revealCtx.current = gsap.context(() => {
          els.forEach((el) => {
            el.style.willChange = "opacity, transform";
            gsap.set(el, { opacity: 0, y: 56 });
            const inn = () => gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: "power3.out", overwrite: true });
            const out = (dir: number) => gsap.to(el, { opacity: 0, y: 56 * dir, duration: 0.5, ease: "power2.in", overwrite: true });
            ScrollTrigger.create({
              trigger: el,
              start: "top 88%",
              end: "bottom 6%",
              onEnter: inn, // scroll down into view
              onEnterBack: inn, // scroll up back into view
              onLeave: () => out(-1), // exits past the top
              onLeaveBack: () => out(1), // exits past the bottom
            });
          });
        });
        ScrollTrigger.refresh();
      }

      // reveal the new page — the dissolve retreats into the top-right corner
      // (same corner it opened from), a touch slow so the reveal breathes
      if (coveredRef.current && navigatingRef.current && !reducedRef.current) {
        gsap.killTweensOf(revealRef.current);
        gsap.to(revealRef.current, {
          v: 0,
          duration: 1.45,
          ease: REVEAL_EASE,
          delay: 0.1,
          onComplete: () => {
            setMenuOpen(false);
            setMenuContent(false);
            navigatingRef.current = false;
            coveredRef.current = false;
          },
        });
      }
      firstLoad.current = false;
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  // refresh triggers once fonts settle (layout shifts change trigger positions)
  useEffect(() => {
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 600);
    return () => clearTimeout(t);
  }, [pathname]);

  // ---------- master loop ----------
  useEffect(() => {
    let raf = 0;
    let kPaint = -1;
    const mouse = mouseRef.current;

    const darkFactor = () => {
      const z = darkzoneEls.current.find((el) => el.offsetParent !== null);
      if (!z) return 0;
      const b = z.getBoundingClientRect();
      const start = window.innerHeight * 0.92;
      const end = window.innerHeight * 0.32;
      return clamp((start - b.top) / (start - end), 0, 1);
    };

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      lenisRef.current?.raf(t);

      mouse.ex += (mouse.x - mouse.ex) * 0.06;
      mouse.ey += (mouse.y - mouse.ey) * 0.06;

      const df = darkFactor();
      darkRef.current += (df - darkRef.current) * 0.08;
      const k = darkRef.current;

      // nav light/dark tracks the ACTUAL organic-reveal coverage (the GSAP-driven
      // value that masks the plasma), so the logo/menu icons follow the dissolve in
      // real time instead of staying light over the already-revealed page on close
      menuRevealRef.current = revealRef.current.v;

      if (Math.abs(k - kPaint) > 0.0015) {
        kPaint = k;
        const bg = mixHex("#e8e6e1", "#060606", k);
        if (rootRef.current) rootRef.current.style.backgroundColor = bg;
        document.body.style.backgroundColor = bg;
        const txt = mixHex("#0a0a0a", "#e8e6e1", k);
        for (const z of darkzoneEls.current) {
          if (z.offsetParent) z.style.color = txt;
        }
      }

      const scroll = window.scrollY || document.documentElement.scrollTop;
      const state: TickState = {
        t,
        dark: k,
        menuReveal: menuRevealRef.current,
        mouseEx: mouse.ex,
        mouseEy: mouse.ey,
        scroll,
      };
      ticksRef.current.forEach((cb) => cb(state));
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <Ctx.Provider
      value={{
        menuOpen,
        menuContent,
        setMenuOpen,
        openMenu,
        closeMenu,
        toggleMenu,
        navigate,
        revealRef,
        registerTick,
        darkRef,
        menuRevealRef,
        pointerRef,
        glReady,
        setGlReady,
        reduced,
        lenisRef,
        introDoneRef,
      }}
    >
      <div
        ref={rootRef}
        data-root=""
        style={{ position: "relative", width: "100%", background: "#e8e6e1", color: "#0a0a0a", overflowX: "clip" }}
      >
        {children}
      </div>
    </Ctx.Provider>
  );
}
