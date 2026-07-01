/**
 * The authored ease vocabulary. Keep this set tiny and consistent — every
 * transition on the site should pull from here so motion reads as one hand.
 *
 * - entrance  → expo-out: weighty arrivals (reveals, hero, menu links)
 * - transition→ expo-inout: covers / clips / page changes
 * - micro     → power2-out: small UI nudges (arrows, underlines, tilt)
 */

// gsap named eases (built in — no plugin needed)
export const EASE = {
  entrance: "expo.out",
  transition: "expo.inOut",
  micro: "power2.out",
} as const;

// CSS cubic-beziers (mirror of the above, for transition strings / inline CSS)
export const CSS_EASE = {
  entrance: "cubic-bezier(0.16, 1, 0.3, 1)",
  transition: "cubic-bezier(0.87, 0, 0.13, 1)",
  micro: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;
