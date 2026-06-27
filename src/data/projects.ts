/**
 * Projects — single source of truth for the Work index, the home "selected work"
 * section and the case-study pages (/work/[slug]).
 *
 * `Aurora Systems` is a fully fleshed-out *sample* case study. The other four are
 * index-only samples for now: drop a `caseStudy` block on any of them to light up
 * its detail page. Everything here is editable placeholder content.
 */

export type Stripe = { ang: number; w: number; c1: string; c2: string };

export type CaseMedia = {
  file: string;
  tag?: string;
  video?: boolean;
  stripe: Stripe;
  /** dark surface variant (obsidian wells) */
  dark?: boolean;
};

export type CaseStudy = {
  hero: {
    line: string;
    meta: { k: string; v: string }[];
  };
  heroMedia: CaseMedia;
  overview: {
    facts: { k: string; v: string }[];
    lead: string;
    paras: string[];
  };
  flagship: {
    kicker: string;
    title: string;
    titleEmph: string;
    body: string;
    media: CaseMedia;
  };
  components: {
    no: string;
    dir: "row" | "row-reverse";
    video: boolean;
    title: string;
    tag: string;
    file: string;
    stripe: Stripe;
    body: string;
  }[];
  philosophy: {
    statement: string;
    statementEmph: string;
    palette: { name: string; hex: string; use: string }[];
    principles: string[];
  };
  gallery: { col: string; h: string; video: boolean; file: string; stripe: Stripe }[];
  live: {
    url: string;
    label: string;
    media: CaseMedia;
    outcomes: { v: string; k: string }[];
  };
  credits: { role: string; name: string }[];
  deliverables: string[];
  stack: string[];
};

export type Project = {
  slug: string;
  no: string;
  title: string;
  year: string;
  /** kicker on the home card e.g. "01 / WebGL brand world" */
  meta: string;
  /** oversized headline inside the home card mock */
  head: string;
  desc: string;
  dir: "row" | "row-reverse";
  file: string;
  stripe: Stripe;
  caseStudy?: CaseStudy;
};

export const projects: Project[] = [
  {
    slug: "aurora-systems",
    no: "01",
    title: "Aurora Systems",
    year: "2026",
    meta: "01 / WebGL brand world",
    head: "Signals, made visible.",
    desc: "A living particle identity driven by real-time network telemetry — rendered at 60fps in the browser.",
    dir: "row",
    file: "[ aurora_systems.mp4 — replace ]",
    stripe: { ang: 118, w: 9, c1: "#c4c0b6", c2: "#cbc8bf" },
    caseStudy: {
      hero: {
        line: "Signals, made visible — a living brand world for an infrastructure-intelligence platform.",
        meta: [
          { k: "Client", v: "Aurora Systems, Inc." },
          { k: "Role", v: "Brand world + site" },
          { k: "Year", v: "2026" },
          { k: "Timeline", v: "14 weeks" },
        ],
      },
      heroMedia: {
        file: "[ aurora_hero_globe.mp4 — replace ]",
        tag: "Homepage · Signal Globe",
        video: true,
        stripe: { ang: 118, w: 10, c1: "#c4c0b6", c2: "#cbc8bf" },
      },
      overview: {
        facts: [
          { k: "Client", v: "Aurora Systems, Inc." },
          { k: "Sector", v: "Infrastructure intelligence" },
          { k: "Year", v: "2026" },
          { k: "Scope", v: "Brand world + marketing site" },
          { k: "Team", v: "Solo + platform team" },
        ],
        lead: "Aurora had a category-leading product wrapped in a generic SaaS site — the flagship visualisation buried three clicks deep, the homepage a feature list.",
        paras: [
          "I rebuilt the brand around a single idea: every surface behaves like a live signal. The identity isn't a static mark — it's a particle field driven by real telemetry, calm when the network is calm and alive when it moves. The website stopped describing the product and started <em>being</em> it.",
          "The mandate: make the site feel as intelligent as the product, put the flagship at the centre of the story, and rebuild the funnel so the site does the selling.",
        ],
      },
      flagship: {
        kicker: "Flagship — the Signal Globe",
        title: "The product, ",
        titleEmph: "on the first screen.",
        body: "I pulled Aurora's real-time network view out of the app and made it the hero — a live, rotatable globe of the customer's infrastructure, arcs of traffic and nodes lighting in signal colour as telemetry streams. Visitors don't read about the product. They watch it breathe.",
        media: {
          file: "[ signal_globe_live.mp4 — replace ]",
          tag: "Feature demo · loops",
          video: true,
          dark: true,
          stripe: { ang: 62, w: 9, c1: "#11161f", c2: "#161c27" },
        },
      },
      components: [
        {
          no: "01", dir: "row", video: true, title: "Particle identity engine", tag: "Identity",
          file: "[ particle_identity.mp4 ]", stripe: { ang: 118, w: 9, c1: "#c4c0b6", c2: "#cbc8bf" },
          body: "A generative brand mark wired to live telemetry. The logo is a particle field that brightens and drifts with real network activity — never the same frame twice, calm when the network is calm.",
        },
        {
          no: "02", dir: "row-reverse", video: true, title: "Topology configurator", tag: "Interaction",
          file: "[ topology_configurator.mp4 ]", stripe: { ang: 62, w: 7, c1: "#c7c3b9", c2: "#cecabf" },
          body: "A build-your-network module where a prospect assembles their own infrastructure shape and watches Aurora visualise it live. Self-qualification disguised as play — and the warm input that pre-fills their demo request.",
        },
        {
          no: "03", dir: "row", video: false, title: "Status & trust band", tag: "Component",
          file: "[ trust_band.png ]", stripe: { ang: 150, w: 11, c1: "#c2bdb2", c2: "#cac6bc" },
          body: "Real uptime, throughput and SOC-2 posture rendered in the same signal language as the product. Credibility shown, not claimed — every number monospaced so data always looks like data.",
        },
        {
          no: "04", dir: "row-reverse", video: false, title: "Funnel architecture", tag: "Strategy",
          file: "[ funnel_architecture.png ]", stripe: { ang: 95, w: 8, c1: "#c5c1b7", c2: "#cdc9c0" },
          body: "The old cold path became a guided descent — Watch, Build, Trust, Convert. The product earns the meeting before a form is ever shown, so demo requests arrive warm.",
        },
        {
          no: "05", dir: "row", video: true, title: "Motion & signal system", tag: "System",
          file: "[ motion_system.mp4 ]", stripe: { ang: 130, w: 13, c1: "#c3bfb5", c2: "#cbc7bd" },
          body: "A rulebook for when the interface is allowed to move: never for attention, only for a change in the data. A particle brightens because a node did — which is what makes the whole thing feel trustworthy.",
        },
      ],
      philosophy: {
        statement: "Signal colour is rationed hard. It only ever appears as ",
        statementEmph: "live data — never decoration.",
        palette: [
          { name: "Obsidian", hex: "#0A0C11", use: "Primary surface — the night sky" },
          { name: "Signal Green", hex: "#57DBA6", use: "Healthy / nominal telemetry" },
          { name: "Aurora Teal", hex: "#43C2D2", use: "Throughput & flow" },
          { name: "Ion Violet", hex: "#8779EC", use: "Anomalies & alerts" },
          { name: "Mist", hex: "#C7D0D9", use: "Body text & UI on obsidian" },
        ],
        principles: [
          "The brand is never the same twice.",
          "Numbers always look like data.",
          "Motion is reserved for change.",
          "Obsidian first — let signal speak.",
          "Show credibility, never claim it.",
        ],
      },
      gallery: [
        { col: "span 2", h: "clamp(240px,42vh,440px)", video: true, file: "[ homepage_hero.mp4 ]", stripe: { ang: 118, w: 10, c1: "#c4c0b6", c2: "#cbc8bf" } },
        { col: "span 1", h: "clamp(240px,42vh,440px)", video: false, file: "[ configurator.png ]", stripe: { ang: 62, w: 7, c1: "#c7c3b9", c2: "#cecabf" } },
        { col: "span 1", h: "clamp(200px,32vh,340px)", video: false, file: "[ trust_band.png ]", stripe: { ang: 150, w: 11, c1: "#c2bdb2", c2: "#cac6bc" } },
        { col: "span 1", h: "clamp(200px,32vh,340px)", video: false, file: "[ particle_states.png ]", stripe: { ang: 95, w: 8, c1: "#c5c1b7", c2: "#cdc9c0" } },
        { col: "span 1", h: "clamp(200px,32vh,340px)", video: false, file: "[ mobile_funnel.png ]", stripe: { ang: 40, w: 9, c1: "#c6c2b8", c2: "#cdc9bf" } },
        { col: "span 3", h: "clamp(260px,46vh,520px)", video: true, file: "[ full_homepage_scroll.mp4 ]", stripe: { ang: 130, w: 13, c1: "#c3bfb5", c2: "#cbc7bd" } },
      ],
      live: {
        url: "#",
        label: "aurora.systems · placeholder link",
        media: {
          file: "[ homepage_live.mp4 — replace ]",
          video: true,
          stripe: { ang: 118, w: 10, c1: "#c4c0b6", c2: "#cbc8bf" },
        },
        outcomes: [
          { v: "+41%", k: "Qualified demo requests" },
          { v: "3.1×", k: "Median time on page" },
          { v: "0.9s", k: "Largest contentful paint" },
        ],
      },
      credits: [
        { role: "Creative direction", name: "Alexander Smith" },
        { role: "Design & art direction", name: "Alexander Smith" },
        { role: "WebGL & graphics", name: "Alexander Smith" },
        { role: "Telemetry integration", name: "Aurora platform team" },
        { role: "Year", name: "2026" },
      ],
      deliverables: [
        "Brand world & art direction",
        "Real-time WebGL homepage",
        "Signal Globe build",
        "Topology configurator",
        "Design & motion system",
        "Marketing site — 12 templates",
      ],
      stack: ["WebGL", "Three.js", "GLSL", "WebSocket", "React", "GSAP", "Lenis", "Draco / KTX2"],
    },
  },
  {
    slug: "meridian",
    no: "02",
    title: "Meridian",
    year: "2025",
    meta: "02 / Immersive product launch",
    head: "Nine acts. One scroll.",
    desc: "A scroll-driven cinematic reveal that unfolds a flagship product across nine choreographed acts.",
    dir: "row-reverse",
    file: "[ meridian_launch.mp4 — replace ]",
    stripe: { ang: 62, w: 7, c1: "#c7c3b9", c2: "#cecabf" },
  },
  {
    slug: "koto-labs",
    no: "03",
    title: "Koto Labs",
    year: "2025",
    meta: "03 / Interactive installation",
    head: "The room responds.",
    desc: "A floor-to-ceiling generative projection responding to motion across a gallery floor.",
    dir: "row",
    file: "[ koto_installation.mp4 — replace ]",
    stripe: { ang: 150, w: 11, c1: "#c2bdb2", c2: "#cac6bc" },
  },
  {
    slug: "saker",
    no: "04",
    title: "Saker",
    year: "2024",
    meta: "04 / Brand identity",
    head: "A system for flight.",
    desc: "A kinetic visual system — type, motion and 3D — for a frontier aerospace company.",
    dir: "row-reverse",
    file: "[ saker_identity.mp4 — replace ]",
    stripe: { ang: 95, w: 8, c1: "#c5c1b7", c2: "#cdc9c0" },
  },
  {
    slug: "volume-one",
    no: "05",
    title: "Volume One",
    year: "2024",
    meta: "05 / Real-time configurator",
    head: "Compose your object.",
    desc: "A photoreal product configurator letting customers compose their own object in real time.",
    dir: "row",
    file: "[ volume_one.mp4 — replace ]",
    stripe: { ang: 130, w: 13, c1: "#c3bfb5", c2: "#cbc7bd" },
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

/** the project that follows `slug` in index order (wraps to the first) */
export function getNextProject(slug: string): Project {
  const i = projects.findIndex((p) => p.slug === slug);
  return projects[(i + 1) % projects.length];
}

/** CSS for a striped placeholder well */
export function stripeCss(s: Stripe): string {
  return `repeating-linear-gradient(${s.ang}deg,${s.c1},${s.c1} ${s.w}px,${s.c2} ${s.w}px,${s.c2} ${s.w * 2}px)`;
}
