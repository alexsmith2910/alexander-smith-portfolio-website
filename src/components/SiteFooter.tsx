import type { ReactNode } from "react";
import Reveal from "./ui/Reveal";
import TextButton from "./ui/TextButton";
import { site } from "@/data/site";

/** Dark-zone CTA footer. Marked [data-darkzone] so the master loop dissolves
 *  the page into void + lights the plasma as it scrolls into view. */
export default function SiteFooter({
  title,
  id = "contact",
  showEmail = true,
  showSocials = true,
  secondary,
  topBorder = true,
}: {
  title: ReactNode;
  id?: string;
  showEmail?: boolean;
  showSocials?: boolean;
  secondary?: { label: string; href: string; arrow?: "→" | "↗" | null };
  topBorder?: boolean;
}) {
  return (
    <footer
      id={id}
      data-darkzone=""
      className="relative z-[1] px-gutter pt-[clamp(60px,10vh,120px)] pb-10 text-ink"
    >
      <Reveal className={topBorder ? "border-t border-bone/18 pt-[clamp(40px,7vh,80px)]" : ""}>
        <h2 className="font-serif text-[clamp(48px,11vw,200px)] font-normal italic leading-[0.92] tracking-[-.03em]">
          {title}
        </h2>
        <div className="mt-[clamp(40px,7vh,70px)] flex flex-wrap items-end justify-between gap-[30px]">
          {showEmail && (
            <TextButton
              href={`mailto:${site.email}`}
              cursor="email"
              magnetic
              dark
              arrow={null}
              className="text-[clamp(18px,2.4vw,30px)]"
            >
              {site.email}
            </TextButton>
          )}
          {secondary && (
            <TextButton href={secondary.href} cursor="enter" magnetic dark mono arrow={secondary.arrow ?? null}>
              {secondary.label}
            </TextButton>
          )}
          {showSocials && !secondary && (
            <div className="flex gap-7 text-xs uppercase tracking-[.16em]">
              {site.socials.map((s) => (
                <a key={s.name} href={s.href} data-cursor="link" className="text-inherit no-underline opacity-60">
                  {s.name}
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="mt-[60px] flex flex-wrap justify-between gap-4 font-mono text-[11px] uppercase tracking-[.14em] opacity-40">
          <span>{site.copyright}</span>
          <span>{site.location.coords}</span>
          <span>{site.builtWith}</span>
        </div>
      </Reveal>
    </footer>
  );
}
