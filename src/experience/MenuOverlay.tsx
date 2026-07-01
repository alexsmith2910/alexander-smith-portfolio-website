"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { useExperience, useTick } from "./ExperienceProvider";
import MenuPlasma from "./MenuPlasma";
import { site } from "@/data/site";

/**
 * The fullscreen menu AND the page-transition surface are one overlay. There is
 * no clip-path — the masking is organic, done inside the plasma shader
 * (MenuPlasma) via `revealRef`, which ExperienceProvider drives. This component
 * owns only the content: the plasma, and the nav (faded on `menuContent`, so a
 * transition cover with no content is a pure organic plasma wipe).
 */
export default function MenuOverlay() {
  const { menuOpen, menuContent, closeMenu, navigate, reduced } = useExperience();

  // loading shimmer — shown while the plasma cover is up for a PAGE TRANSITION
  // (cover substantially closed + not the menu), so a navigation never reads as a
  // blank screen. Driven by menuReveal from the master tick.
  const loadRef = useRef<HTMLDivElement | null>(null);
  const menuContentRef = useRef(menuContent);
  useEffect(() => { menuContentRef.current = menuContent; }, [menuContent]);
  useTick((s) => {
    const el = loadRef.current;
    if (!el) return;
    const want = !menuContentRef.current && s.menuReveal > 0.6 ? "1" : "0";
    if (el.style.opacity !== want) el.style.opacity = want;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menuContent) closeMenu();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuContent, closeMenu]);

  const rootStyle: CSSProperties = { pointerEvents: menuOpen ? "auto" : "none" };
  // delay the fade-in on open so the nav appears only once the dissolve has
  // covered the centre; fade out immediately on close
  const contentStyle: CSSProperties = {
    opacity: menuContent ? 1 : 0,
    pointerEvents: menuContent ? "auto" : "none",
    transition: reduced ? "none" : "opacity .3s ease",
    transitionDelay: menuContent ? "0.45s" : "0s",
  };

  return (
    <div data-menu="" className="fixed inset-0 z-[48] overflow-hidden text-bone" style={rootStyle}>
      {/* organic, shader-masked plasma — the cover itself */}
      <MenuPlasma />

      {/* loading shimmer during a page-transition cover (gated via menuReveal in the tick) */}
      <div
        ref={loadRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-5"
        style={{ opacity: 0, transition: reduced ? "none" : "opacity .35s ease" }}
      >
        <span className="font-mono text-[11px] uppercase tracking-[.4em] text-bone/75">Loading</span>
        <span className="relative block h-px w-[160px] overflow-hidden bg-bone/15">
          <span
            className="absolute inset-0"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(232,230,225,0.95), transparent)",
              backgroundSize: "220% 100%",
              animation: reduced ? "none" : "ob-shimmer 1.2s linear infinite",
            }}
          />
        </span>
      </div>

      <div className="relative h-full flex flex-col justify-center items-center px-gutter py-20" style={contentStyle}>
        <div className="flex flex-col items-center gap-[clamp(4px,1.2vh,16px)]">
          {site.nav.map((item, i) => (
            <a
              key={item.href}
              href={item.href}
              data-menu-item=""
              data-cursor="enter"
              onClick={(e) => {
                e.preventDefault();
                navigate(item.href);
              }}
              onMouseEnter={(e) => {
                const a = e.currentTarget;
                a.style.transform = "skewX(-9deg) translateX(10px)";
                a.querySelector<HTMLElement>("[data-mi-ul]")?.style.setProperty("transform", "scaleX(1)");
                a.parentElement?.querySelectorAll<HTMLElement>("[data-menu-item]").forEach((o) => {
                  if (o !== a) o.style.opacity = "0.3";
                });
              }}
              onMouseLeave={(e) => {
                const a = e.currentTarget;
                a.style.transform = "skewX(0deg) translateX(0)";
                a.querySelector<HTMLElement>("[data-mi-ul]")?.style.setProperty("transform", "scaleX(0)");
                a.parentElement?.querySelectorAll<HTMLElement>("[data-menu-item]").forEach((o) => {
                  o.style.opacity = "1";
                });
              }}
              className="relative block no-underline text-inherit [transition:transform_.55s_cubic-bezier(.22,1,.36,1),opacity_.45s_ease]"
            >
              <span className="block overflow-hidden pb-[.2em] mb-[-.14em]">
                <span
                  className="block font-serif text-[clamp(44px,8.4vw,112px)] leading-[1.18] tracking-[-.02em]"
                  style={{
                    transform: menuContent ? "translateY(0)" : "translateY(115%)",
                    transition: reduced ? "none" : "transform .95s cubic-bezier(.22,1,.36,1)",
                    transitionDelay: menuContent ? `${0.32 + i * 0.09}s` : `${i * 0.03}s`,
                  }}
                >
                  {item.label}
                </span>
              </span>
              <span
                data-mi-ul=""
                className="block h-px w-full bg-current opacity-[.65] [transition:transform_.55s_cubic-bezier(.22,1,.36,1)]"
                style={{
                  transform: "scaleX(0)",
                  transformOrigin: "center",
                }}
              />
            </a>
          ))}
        </div>

        <div className="absolute bottom-[30px] left-[clamp(20px,4vw,56px)] right-[clamp(20px,4vw,56px)] flex justify-between items-center flex-wrap gap-[16px_30px] font-mono text-[11px] tracking-[.14em] uppercase">
          {[
            <a
              key="email"
              href="/contact"
              data-cursor="email"
              onClick={(e) => {
                e.preventDefault();
                navigate("/contact");
              }}
              className="text-inherit no-underline border-b border-bone/45 pb-[3px]"
            >
              {site.email}
            </a>,
            <div key="socials" className="flex gap-[22px]">
              {site.socials.map((s) => (
                <a key={s.name} href={s.href} data-cursor="link" className="text-inherit no-underline opacity-[.55]">
                  {s.name}
                </a>
              ))}
            </div>,
            <div key="coords">{site.location.coords}</div>,
          ].map((node, i) => (
            <div
              key={i}
              style={{
                opacity: menuContent ? 1 : 0,
                transition: reduced ? "none" : "opacity .55s ease",
                transitionDelay: menuContent ? "0.72s" : "0s",
              }}
            >
              {node}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
