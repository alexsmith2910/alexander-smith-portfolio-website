import type { CSSProperties, ReactNode } from "react";

/** Mono eyebrow with a leading hairline rule. Opens most sections. */
export default function Kicker({
  children,
  style,
  className,
  light = false,
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  /** light rule for dark surfaces */
  light?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-4 font-mono text-xs uppercase tracking-[.34em]${className ? ` ${className}` : ""}`}
      style={style}
    >
      <span className={`inline-block h-px w-9 ${light ? "bg-bone" : "bg-ink"}`} />
      {children}
    </div>
  );
}
