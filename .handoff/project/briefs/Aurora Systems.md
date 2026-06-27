# Aurora Systems — Case Study Brief

> Reference doc for the Oblique work page `Work - Aurora Systems.dc.html`.
> This is an *example* client. Everything below is invented but internally consistent —
> use it as the single source of truth so the page reads like a real engagement, not filler.

---

## The client

**Aurora Systems, Inc.** — an infrastructure-intelligence company. Their platform ingests
live telemetry from a customer's global network (data centres, edge nodes, energy draw,
traffic) and turns it into a single, legible picture operators can actually act on. They sell
to infrastructure and platform teams, but they are unusually **design-led and customer-facing**
for a deep-tech company: the product *is* the demo, and the brand has to carry the same
precision as the engineering.

- **Sector:** Infrastructure intelligence / real-time observability
- **Stage:** Series B, scaling from technical buyers to executive buyers
- **Year:** 2026
- **Engagement:** Brand world + marketing site (Oblique, 14 weeks)

## The problem we were hired to solve

Aurora had a category-leading product wrapped in a generic SaaS website. The site looked like
every other dashboard company, buried the flagship visualisation three clicks deep, and treated
the homepage as a feature list rather than a demonstration. Demo-request conversion was flat and
the sales team was doing all the convincing *after* the site, not with it.

**The brief:** make the website feel as intelligent as the product, put the flagship
visualisation at the centre of the story, and rebuild the funnel so the site does the selling.

## The core idea — "Signals, made visible"

Aurora's whole value is taking invisible, overwhelming network activity and making it
*readable*. We turned that into the organising idea for the entire brand world: every surface
behaves like a live signal. The identity isn't a static logo — it's a **living particle field**
that's literally driven by real telemetry, so the brand is never the same twice. Calm when the
network is calm; alive when it's moving.

## Design choices

### Colour — an aurora in an obsidian sky
We built Aurora's palette from the phenomenon in their name. A near-black **Obsidian** base
(so data and signal colour do the talking), three "signal" hues borrowed from the aurora
borealis, and a cool **Mist** for text. Signal colour is rationed hard — it only ever appears
as *live data*, never as decoration, which is what makes a lit-up metric feel like it means
something.

| Token | Hex | Role |
|---|---|---|
| Obsidian | `#0B0E13` | Primary surface — the night sky everything sits on |
| Signal Green | `#46E3A0` | Healthy / nominal telemetry |
| Aurora Teal | `#2EC5D3` | Throughput & flow |
| Ion Violet | `#7C6CF0` | Anomalies & alerts |
| Mist | `#C9D2DA` | Body text & UI on obsidian |

### Type
Display set in a tight grotesk for engineering confidence; a monospaced face for every number,
coordinate and status read-out so data always *looks* like data. (On the Oblique case-study page
itself we present these as specimens — the page stays in Oblique's own type system.)

### Motion
Nothing blinks or pulses for attention. Movement is reserved for *change in the data* —
a particle brightens because a node did, not because a designer wanted motion. This made the
product feel trustworthy: the interface only moves when reality moves.

## Flagship feature — The Signal Globe

The centrepiece. We took Aurora's real-time network view and rebuilt it as the **hero of the
homepage**: a live, rotatable WebGL globe of the customer's infrastructure, with arcs of traffic
and nodes lighting up in signal colour as telemetry streams in. Visitors don't read about the
product — they watch it breathe. It loads with a demo dataset, then (for logged-in prospects)
swaps to their own connected sources. This single move pulled the product's best moment from
deep in the app onto the first screen of the site.

## How we elevated the sales funnel

The old funnel was: homepage → features → pricing → "request a demo" (cold). We rebuilt it into
a guided descent that lets the product earn the meeting:

1. **Watch** — the Signal Globe does the first 10 seconds of selling, no copy required.
2. **Build** — a **Topology Configurator** lets a prospect assemble their own network shape and
   see Aurora visualise it live. Self-qualification, disguised as play.
3. **Trust** — a live **Status & Trust band**: real uptime, throughput and SOC-2 posture,
   rendered in the same signal language, so credibility is shown, not claimed.
4. **Convert** — a demo request that arrives *warm*, pre-filled with the topology they built.

Result framing for the page (illustrative): demo-request conversion roughly doubled, and the
sales team reported meetings starting "20 minutes ahead" because prospects arrived having
already seen their own network.

## Key components (breakdown for the page)

1. **Particle identity engine** — generative brand mark driven by live telemetry. *(video)*
2. **Topology configurator** — interactive build-your-network module. *(video)*
3. **Status & trust band** — live uptime / throughput / compliance, in signal colour. *(image)*
4. **Funnel architecture** — the Watch → Build → Trust → Convert journey. *(image)*
5. **Motion & signal system** — rules for when the interface is allowed to move. *(video)*

## Gallery assets (placeholders to drop real media into)
- Homepage hero — Signal Globe in motion *(video)*
- Configurator detail
- Trust band close-up
- Brand particle states (calm / active)
- Mobile funnel
- Full homepage scroll

## Deliverables
Brand world & art direction · Real-time WebGL homepage · Signal Globe build · Topology
configurator · Design system · Motion system · Marketing site (12 templates) · Handoff.

## Tech stack
WebGL / Three.js · custom GLSL · real-time telemetry bridge (WebSocket) · React · GSAP ·
Lenis smooth-scroll · Draco / KTX2 asset pipeline.

## Credits
- Creative direction — Oblique
- Design & art direction — Oblique
- WebGL & graphics engineering — Oblique
- Telemetry integration — Aurora Systems platform team
- Year — 2026

## Live site
Placeholder — `aurora.systems` (no real URL yet; link target is `#`).

## Next project
Index order is **Aurora → Meridian** → Koto Labs → Saker → Volume One.
Bottom button on this page points to **Meridian** (`Work - Meridian.dc.html`).
