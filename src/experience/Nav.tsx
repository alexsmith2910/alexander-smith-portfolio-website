"use client";

import { useEffect, useRef } from "react";
import { useExperience, type TickState } from "./ExperienceProvider";
import { clamp, mixHex } from "@/lib/math";
import { site } from "@/data/site";

export default function Nav() {
  const { toggleMenu, menuContent, navigate, registerTick, glReady } = useExperience();
  const logoRef = useRef<HTMLAnchorElement | null>(null);
  const logoUlRef = useRef<HTMLSpanElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const topRef = useRef<HTMLElement | null>(null);
  const botRef = useRef<HTMLElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  // track the menu's *content* state — during a page-transition cover the same
  // overlay is up but the hamburger must NOT become an X
  const menuContentRef = useRef(menuContent);

  useEffect(() => {
    menuContentRef.current = menuContent;
    const top = topRef.current!;
    const bot = botRef.current!;
    top.style.transform = menuContent ? "translateY(3px) rotate(45deg)" : "none";
    bot.style.transform = menuContent ? "translateY(-3px) rotate(-45deg)" : "none";
    bot.style.width = menuContent ? "26px" : "18px";
  }, [menuContent]);

  // nav colour management driven by the master loop (only when GL plasma is in play)
  useEffect(() => {
    if (!glReady) {
      if (navRef.current) navRef.current.style.mixBlendMode = "difference";
      return;
    }
    if (navRef.current) navRef.current.style.mixBlendMode = "normal";
    if (logoRef.current) logoRef.current.style.color = "#0a0a0a";
    if (btnRef.current) btnRef.current.style.color = "#0a0a0a";
    let bcP = -1;
    let lcP = -1;
    const tick = (s: TickState) => {
      const mr = s.menuReveal;
      const bc = Math.max(s.dark, clamp(mr * 6, 0, 1));
      const lc = Math.max(s.dark, clamp((mr - 0.62) / 0.22, 0, 1));
      if (Math.abs(bc - bcP) > 0.004) {
        bcP = bc;
        if (btnRef.current) btnRef.current.style.color = mixHex("#0a0a0a", "#e8e6e1", bc);
      }
      if (Math.abs(lc - lcP) > 0.004) {
        lcP = lc;
        if (logoRef.current) logoRef.current.style.color = mixHex("#0a0a0a", "#e8e6e1", lc);
      }
    };
    return registerTick(tick);
  }, [glReady, registerTick]);

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-gutter py-6 text-bone"
      style={{
        mixBlendMode: "difference",
      }}
    >
      <a
        ref={logoRef}
        href="/"
        data-cursor="home"
        onClick={(e) => {
          e.preventDefault();
          navigate("/");
        }}
        onMouseEnter={() => {
          if (logoUlRef.current) {
            logoUlRef.current.style.transformOrigin = "left";
            logoUlRef.current.style.transform = "scaleX(1)";
          }
        }}
        onMouseLeave={() => {
          if (logoUlRef.current) {
            logoUlRef.current.style.transformOrigin = "right";
            logoUlRef.current.style.transform = "scaleX(0)";
          }
        }}
        className="relative font-serif text-[26px] tracking-[.02em] no-underline italic pb-1"
      >
        {site.wordmark}
        <span
          ref={logoUlRef}
          className="absolute inset-x-0 bottom-0 h-px bg-current [transition:transform_.55s_cubic-bezier(.22,1,.36,1)]"
          style={{
            transform: "scaleX(0)",
            transformOrigin: "right",
          }}
        />
      </a>

      <button
        ref={btnRef}
        data-cursor="menu"
        onClick={toggleMenu}
        onMouseEnter={() => {
          if (!menuContentRef.current) {
            topRef.current!.style.width = "26px";
            botRef.current!.style.width = "26px";
          }
        }}
        onMouseLeave={() => {
          if (!menuContentRef.current) botRef.current!.style.width = "18px";
        }}
        className="bg-transparent border-none cursor-none flex items-center justify-end gap-[14px] p-4 -m-4 font-mono text-xs uppercase tracking-[.22em] font-bold"
        aria-label="Menu"
      >
        <span className="relative w-[26px] h-3 inline-block">
          <i
            ref={topRef}
            className="absolute right-0 top-0.5 h-0.5 bg-current [transition:transform_.5s_cubic-bezier(.7,0,.2,1),width_.5s_cubic-bezier(.7,0,.2,1)]"
            style={{ width: 26 }}
          />
          <i
            ref={botRef}
            className="absolute right-0 bottom-0.5 h-0.5 bg-current [transition:transform_.5s_cubic-bezier(.7,0,.2,1),width_.5s_cubic-bezier(.7,0,.2,1)]"
            style={{ width: 18 }}
          />
        </span>
      </button>
    </nav>
  );
}
