/**
 * What I do, framed as outcomes (not just capability nouns).
 * Edit freely — each card is { no, title, outcome, blurb, tags }.
 * `title` = the offer, `outcome` = the one-line benefit a buyer cares about.
 */
export const servicesIntro = {
  kicker: "What I do",
  title: "One senior designer-developer, end-to-end.",
  sub: "Design and build under one roof — no agency hand-offs, no telephone game. A few projects a year, each given full attention.",
};

export const services = [
  {
    no: "01",
    title: "Immersive brand sites",
    outcome: "A site people remember and talk about.",
    blurb:
      "Flagship websites with real-time 3D, motion and sound — built to make a brand feel premium the moment it loads.",
    tags: ["Art direction", "WebGL", "Motion"],
  },
  {
    no: "02",
    title: "Product & launch experiences",
    outcome: "Turn a launch moment into attention.",
    blurb:
      "Campaign microsites, product reveals and configurators engineered for the spike — fast, shareable and on-brand.",
    tags: ["Launch", "Interaction", "Performance"],
  },
  {
    no: "03",
    title: "Real-time 3D & WebGL",
    outcome: "The visual edge agencies outsource.",
    blurb:
      "Custom shaders, GPU particles and tuned render loops — the hard graphics work, budgeted to run smoothly everywhere.",
    tags: ["GLSL", "Three.js", "Shaders"],
  },
  {
    no: "04",
    title: "Full-stack build",
    outcome: "Designed and shipped by the same hands.",
    blurb:
      "From Figma to production: accessible front-ends, a clean CMS, APIs and deploys — no separate dev team to brief.",
    tags: ["Next.js", "TypeScript", "Node"],
  },
];

/** How an engagement works — set indicative ranges once you're ready. */
export const engagement = {
  kicker: "How we work",
  models: [
    {
      title: "Project",
      blurb: "A defined scope, fixed timeline, one clear outcome.",
      meta: "from [ £X,XXX ]",
    },
    {
      title: "Sprint",
      blurb: "1—2 weeks to prototype a signature moment or idea.",
      meta: "[ £X,XXX / week ]",
    },
    {
      title: "Retainer",
      blurb: "Ongoing design + build for a brand that ships often.",
      meta: "[ monthly ]",
    },
  ],
};
