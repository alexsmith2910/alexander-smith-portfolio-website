/**
 * About content — bio, process, capabilities, tech stack and the human texture.
 * First-person, solo voice. Everything here is editable placeholder copy — swap
 * the bio, interests and "now" list for your own truth before launch.
 */

export const aboutIntro = {
  kicker: "About — Alexander Smith",
  titleLines: ["Independent designer", "& developer crafting", "the web's next layer."],
  sub: "A designer-developer who treats the browser as a medium for atmosphere — not just interface.",
  meta: "Est. 2026 — Dubai",
  lead: 'Every project begins as a question: <em>what should this brand feel like to move through?</em> I answer it with real-time 3D, sound and motion — worlds rendered live in the browser, built to be felt before they are read.',
};

export const processActs = [
  { no: "01", title: "Discovery", body: "I start by interrogating the brief — audience, ambition, constraints. References and rough motion tests turn a vague feeling into a concrete creative territory before a single pixel is committed." },
  { no: "02", title: "Direction", body: "Art direction defines the world: palette, type, material, light and pacing. I prototype the signature moment early, so you can feel the experience long before it is finished." },
  { no: "03", title: "Design", body: "Interface, motion and 3D are designed together, frame by frame. Layouts are choreographed against scroll and sound so the whole thing reads as one continuous gesture." },
  { no: "04", title: "Development", body: "Custom WebGL, GLSL shaders and a tuned render loop. I budget every frame, ship Draco/KTX2 assets and build graceful fallbacks so the work runs beautifully everywhere." },
  { no: "05", title: "Launch", body: "I instrument, optimise and harden — then launch loud. Post-launch I keep iterating with the data, because an immersive site is a living thing, not a deliverable." },
];

export const capabilities = [
  "Creative & art direction",
  "Real-time 3D / WebGL",
  "Interface & motion design",
  "Shader & graphics engineering",
  "Full-stack development",
  "Installations & events",
];

/**
 * The bio — who you are, told in your own voice. PLACEHOLDER: rewrite this so it
 * sounds like you. Buyers hire people, so let some personality through.
 * `portrait` points at an image in /public (set "" to fall back to a typographic mark).
 */
export const bio = {
  kicker: "The person",
  portrait: "", // e.g. "/portrait.jpg" — drop a photo in /public
  paragraphs: [
    "I'm Alexander — an independent designer and developer based in Dubai. For the last few years I've helped brands, studios and founders ship websites that feel like an experience, not a brochure.",
    "I work solo and end-to-end: the art direction, the 3D and motion, and the full-stack build are all mine. That means no hand-offs, no diluted vision, and one person accountable for the whole thing.",
    "I care about the web as a craft — the kind of detail you feel before you can name it. If you want something that makes people stop, I'd love to hear about it.",
  ],
  signature: "— Alexander Smith",
};

/** Tech stack, surfaced (it signals depth to technical buyers). Grouped + editable. */
export const techStack = [
  { group: "Front-end", items: ["React", "Next.js", "TypeScript", "Tailwind"] },
  { group: "Graphics", items: ["Three.js", "WebGL", "GLSL", "GSAP"] },
  { group: "Back-end", items: ["Node", "APIs", "Headless CMS", "Postgres"] },
  { group: "Craft", items: ["Figma", "Blender", "Motion", "Sound"] },
];

/** Fun facts / interests — the human texture. PLACEHOLDER: make these actually yours. */
export const interests = [
  "Shaders are my idea of a relaxing evening",
  "Always building one too many side projects",
  "Coffee-fuelled; I prototype before I plan",
  "Collector of obscure typefaces",
  "Will happily talk WebGL for hours",
  "Runner — best ideas arrive mid-run",
];

/** A "now" snapshot — cheap to keep current, reads as alive. PLACEHOLDER copy. */
export const now = {
  kicker: "Currently",
  items: [
    { label: "Building", value: "A real-time configurator for a launch" },
    { label: "Learning", value: "Compute shaders & WebGPU" },
    { label: "Reading", value: "[ a book — swap me ]" },
    { label: "Open to", value: "New projects for Q3" },
  ],
};
