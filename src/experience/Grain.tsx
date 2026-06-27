const GRAIN_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export default function Grain() {
  return (
    <div
      data-grain=""
      aria-hidden
      className="fixed inset-[-50%] w-[200%] h-[200%] z-[2] pointer-events-none opacity-[.45] [mix-blend-mode:overlay] animate-[ob-grain_8s_steps(6)_infinite]"
      style={{ backgroundImage: GRAIN_URL }}
    />
  );
}
