import type { CSSProperties, ReactNode } from "react";

/** Scroll-linked reveal target. The master loop in ExperienceProvider drives
 *  opacity + translateY for every [data-reveal] element on the page. */
export default function Reveal({
  children,
  className,
  style,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: "div" | "section" | "article" | "li" | "header" | "footer";
}) {
  return (
    <Tag data-reveal="" className={`opacity-0${className ? ` ${className}` : ""}`} style={style}>
      {children}
    </Tag>
  );
}
