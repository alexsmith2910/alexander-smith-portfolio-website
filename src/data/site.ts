/**
 * Global site data — edit this file to change identity, contact and nav.
 * Socials are placeholders; swap the `href`/`handle` for real ones.
 */
export const site = {
  name: "Alexander Smith",
  /** wordmark shown in the nav + menu */
  wordmark: "Alexander Smith",
  role: "Creative Web Designer & Developer",
  roleLong: "Creative web designer & developer — full-stack",
  email: "ajs@alexandersmith.dev",
  tagline: "Independent designer & developer — est. 2021",
  /** one-line, plain-English offer shown under the hero headline */
  valueProp:
    "I design and build immersive, high-craft websites end-to-end — strategy, real-time 3D/WebGL and full-stack delivery — for brands that want to stand out.",
  location: {
    city: "Dubai",
    country: "UAE",
    coords: "25.2048°N · 55.2708°E",
  },
  /** primary call-to-action, reused by the nav pill, hero and section CTAs */
  cta: { label: "Start a project", href: "/contact" },
  /** live availability signal — flip `open` / edit the labels as your calendar changes */
  availability: {
    open: true,
    label: "Available for new work",
    short: "Booking Q3 2026",
    note: "2—3 projects at a time.",
  },
  /** optional 20-min intro call — drop in a Cal.com / Calendly URL (or set href:"" to hide) */
  booking: { label: "Book a 20-min call", href: "" },
  /** CV / résumé — drop the PDF in /public and point href at it (or set href:"" to hide) */
  cv: { label: "Download CV", href: "" },
  /** ambient audio — for a truly cinematic bed, drop a PRODUCED loop in /public and set the
   *  path (e.g. "/ambient.mp3"); a compressor tames any loud swells so it stays even. Leave
   *  "" to use the built-in evolving-chord fallback. `volume` is the master level (keep it low). */
  audio: { ambient: "/Empires_of_Dunum.mp3", volume: 0.08 },
  socials: [
    // swap href "#" for the real profile URLs
    { name: "Instagram", handle: "@alexandersmith", href: "#" },
    { name: "Are.na", handle: "alexander-smith", href: "#" },
    { name: "LinkedIn", handle: "/in/alexandersmith", href: "#" },
  ],
  /** primary navigation (the fullscreen menu) */
  nav: [
    { label: "Work", href: "/work" },
    { label: "Lab", href: "/lab" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  copyright: "© 2026 Alexander Smith",
  builtWith: "Built in WebGL",
} as const;

export type Site = typeof site;
