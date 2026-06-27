/**
 * The Lab — field notes & canvas experiments.
 * `type: "exp"` entries render a live canvas sketch (see SketchCanvas `kind`s).
 * `type: "note"` entries are short written notes.
 */
export type LabKind =
  | "flow"
  | "constellation"
  | "lissajous"
  | "phyllotaxis"
  | "sinetype"
  | "orbit";

export type LabEntry = {
  no: string;
  type: "exp" | "note";
  kind: string; // short label e.g. "Flow", "Note", "Math"
  date: string;
  title: string;
  tags: string;
  /** canvas sketch id, only for type === "exp" */
  sketch?: LabKind;
  /** word used by the sinetype sketch */
  word?: string;
  body: string;
};

export const labEntries: LabEntry[] = [
  { no: "01", type: "exp", kind: "Flow", date: "2026.05", title: "Ink Flow", tags: "Canvas · Noise", sketch: "flow", body: "A thousand pens released into one invisible current. The field never repeats, and neither do the lines it pulls." },
  { no: "02", type: "note", kind: "Note", date: "2026.04", title: "Sixty frames is a budget", tags: "4 min read", body: "Treating the frame as hard currency changes what you let yourself draw. A short note on spending motion like money." },
  { no: "03", type: "exp", kind: "Input", date: "2026.03", title: "Proximity", tags: "Canvas · Input", sketch: "constellation", body: "A scatter of points that only admit they are related when your cursor gets close enough to ask the question." },
  { no: "04", type: "exp", kind: "Math", date: "2026.02", title: "Lissajous Loom", tags: "Canvas · Math", sketch: "lissajous", body: "Two frequencies, slightly out of step, weaving a cloth that drifts a fraction further every second it runs." },
  { no: "05", type: "note", kind: "Note", date: "2026.01", title: "Drawing with noise", tags: "5 min read", body: "Flow fields are the cheapest pencil in the toolbox. How a single noise function quietly becomes a drawing machine." },
  { no: "06", type: "exp", kind: "Type", date: "2025.11", title: "Sine Type", tags: "Canvas · Type", sketch: "sinetype", word: "alexander", body: "Setting one word on a wave that refuses to hold still. Letterforms as passengers riding the curve, not anchors." },
  { no: "07", type: "exp", kind: "Geometry", date: "2025.10", title: "Phyllotaxis", tags: "Canvas · Geometry", sketch: "phyllotaxis", body: "One hundred and thirty-seven point five degrees, and nothing else — the angle the sunflower solved long before we did." },
  { no: "08", type: "note", kind: "Note", date: "2025.09", title: "On rationing colour", tags: "4 min read", body: "Why my own surfaces stay bone and ink, and colour is kept for the one place on a page where it actually means something." },
  { no: "09", type: "exp", kind: "Motion", date: "2025.08", title: "Signal Ring", tags: "Canvas · Motion", sketch: "orbit", body: "A telemetry ring drawn the long way round — nodes, chords, and a single pulse that takes its time getting around." },
  { no: "10", type: "note", kind: "Note", date: "2025.07", title: "Bugs, kept in public", tags: "3 min read", body: "The case for publishing the unfinished thing the day it breaks, instead of the polished thing that somehow never ships." },
];
