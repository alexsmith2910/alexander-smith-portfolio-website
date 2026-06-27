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
  location: {
    city: "Dubai",
    country: "UAE",
    coords: "25.2048°N · 55.2708°E",
  },
  socials: [
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
