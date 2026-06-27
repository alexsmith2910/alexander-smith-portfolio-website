"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { useExperience } from "@/experience/ExperienceProvider";

type Arrow = "→" | "↗" | null;

/** The house text button: ever-present underline that redraws left→right on
 *  hover, an arrow that nudges, and optional magnetic pull toward the cursor. */
export default function TextButton({
  children,
  href,
  onClick,
  arrow = "→",
  magnetic = false,
  dark = false,
  cursor = "view",
  mono = false,
  ink = true,
  style,
  className,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  arrow?: Arrow;
  magnetic?: boolean;
  /** underline tuned for dark surfaces */
  dark?: boolean;
  cursor?: string;
  mono?: boolean;
  /** whether the underline is visible at rest */
  ink?: boolean;
  style?: CSSProperties;
  className?: string;
}) {
  const { navigate } = useExperience();
  const elRef = useRef<HTMLAnchorElement | null>(null);
  const ulRef = useRef<HTMLSpanElement | null>(null);
  const arRef = useRef<HTMLSpanElement | null>(null);

  const onEnter = () => {
    const ul = ulRef.current;
    if (ul) {
      ul.style.transformOrigin = "right";
      ul.style.transform = "scaleX(0)";
      window.setTimeout(() => {
        ul.style.transformOrigin = "left";
        ul.style.transform = "scaleX(1)";
      }, 260);
    }
    if (arRef.current) arRef.current.style.transform = arrow === "↗" ? "translate(5px,-5px)" : "translateX(6px)";
  };
  const onLeave = () => {
    if (arRef.current) arRef.current.style.transform = "translate(0,0)";
    if (magnetic && elRef.current) {
      elRef.current.style.transform = "translate(0,0)";
      elRef.current.style.transition = "transform .5s cubic-bezier(.22,1,.36,1)";
    }
  };
  const onMove = (e: React.MouseEvent) => {
    if (!magnetic || !elRef.current) return;
    const b = elRef.current.getBoundingClientRect();
    const x = e.clientX - b.left - b.width / 2;
    const y = e.clientY - b.top - b.height / 2;
    elRef.current.style.transform = `translate(${x * 0.3}px,${y * 0.4}px)`;
    elRef.current.style.transition = "transform .1s";
  };

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
      return;
    }
    if (href) {
      e.preventDefault();
      if (href.startsWith("http") || href.startsWith("mailto")) {
        window.open(href, href.startsWith("http") ? "_blank" : "_self");
      } else {
        navigate(href);
      }
    }
  };

  return (
    <a
      ref={elRef}
      href={href ?? "#"}
      data-cursor={cursor}
      onClick={handleClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onMouseMove={onMove}
      className={`relative inline-flex items-center gap-2.5 pb-2 text-inherit no-underline${
        mono ? " font-mono text-xs uppercase tracking-[.18em]" : ""
      }${className ? ` ${className}` : ""}`}
      style={style}
    >
      {children}
      {arrow && (
        <span
          ref={arRef}
          className="inline-block transition-transform duration-[400ms] ease-[cubic-bezier(.22,1,.36,1)]"
        >
          {arrow}
        </span>
      )}
      <span
        ref={ulRef}
        className={`absolute inset-x-0 bottom-0 h-px transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${
          dark ? "bg-bone/50" : "bg-ink"
        }`}
        style={{ transform: ink ? "scaleX(1)" : "scaleX(0)", transformOrigin: "left" }}
      />
    </a>
  );
}
