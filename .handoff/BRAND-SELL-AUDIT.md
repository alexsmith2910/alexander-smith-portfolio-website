# Audit — does this site actually *sell* Alexander Smith?

The site is gorgeous and the motion is now genuinely high-end. But a portfolio's job
isn't to be admired — it's to **convert a stranger into an enquiry**. Judged purely as a
*sales instrument for your services*, the site is currently a beautiful gallery with a
contact form bolted to the end. This audit ignores the case studies and looks at
everything else: messaging, conversion architecture, the content a buyer needs, usability,
and the interaction-design moves that would make it unmistakably *yours*.

> TL;DR — you've nailed "this person has taste and craft." You have **not** yet answered
> the three questions every prospect asks in the first 10 seconds: **What do you do for
> me? Why you? What do I do next?** Fixing that is mostly content + a couple of CTAs, not a
> redesign.

---

## 1. The conversion problem (read this first)

A visitor lands on the hero. It says *"Immersive worlds for brands at the edge of the
web."* — evocative, but it's a **mood, not an offer**, and there is **no button**. The only
way to act is to open the hamburger menu (which hides the entire site behind one click) or
scroll all the way to the footer. There is no persistent call-to-action anywhere on screen.

**The funnel today:** land → (no CTA) → scroll → admire → maybe open menu → maybe reach
Contact → fill a 4-field form that posts nowhere (TODO in code). That's a lot of "maybe"
for someone you want to hire you.

**What great freelance sites do:** a persistent, always-visible primary CTA (e.g. a magnetic
"Start a project" pill in the nav and a real one in the hero), a one-line value proposition
that states the offer, and a frictionless way to reach you (email + booking link, not just a
form). Everything below serves that.

---

## 2. Positioning & messaging

| Question a buyer has | Does the site answer it? | Fix |
|---|---|---|
| **What do you do?** | Vaguely ("immersive worlds"). Capabilities are abstract nouns. | Add a plain-English offer line + an outcome-framed services list. |
| **Who is it for?** | Not stated. | Name the audience: brands, studios, founders launching something. |
| **Why you (vs an agency)?** | Implied by craft only. | State the edge: one senior person, design *and* build, no hand-offs. |
| **What will it cost / how does it work?** | Silent (only "2–3 projects at a time"). | Add an engagement model: project / sprint / retainer, indicative ranges or "from £X". |
| **Can I trust you?** | Placeholder awards (a risk — see below). | Real testimonials, client names/logos, or honest metrics. |
| **What next?** | Buried. | Primary CTA everywhere + a low-friction reply path. |

**Voice nit:** the copy leans poetic ("rendered to be felt before they are read"). Beautiful,
but pair every poetic line with one concrete, scannable line. Buyers skim first, swoon second.

---

## 3. Missing content (the checklist)

Grouped by how much it moves the needle on *selling*.

### Must-have (conversion essentials)
- **Primary CTA, persistent** — a magnetic "Start a project" / "Let's talk" in the nav bar
  (always visible) *and* a real button in the hero. Secondary: "View work".
- **A real value proposition** — one sentence under the hero headline that says the offer in
  plain words, e.g. *"I design and build immersive, high-craft websites end-to-end — strategy,
  3D/WebGL, and full-stack delivery — for brands that want to stand out."*
- **Services, outcome-framed** — turn the capability nouns into "what you get / why it
  matters." e.g. *Brand sites that convert · Real-time 3D & WebGL · Launch experiences ·
  Design systems · Full-stack build*. 3–6 cards or a list, each with a one-line benefit.
- **Working contact** — wire the form to a real handler (Formspree/Resend/Route Handler) and
  add a **direct email** (you have it) + ideally a **"Book a 20-min call"** link (Cal.com/
  Calendly). A form that posts nowhere is a silent leak.
- **Availability signal** — you have "Booking Q3 2026" on Contact; surface a live status
  chip in the nav/footer ("● Available for Q3" / "Booking now") — scarcity + responsiveness.

### High-value (trust & personality — this is a *personal* brand)
- **A real About bio** — who you are, your story, how you got here, what you care about.
  Right now "About" is process + capabilities; there's no *person*. Buyers hire people.
- **A portrait / photo** — a single strong image of you (or a signature self-portrait/avatar).
  Faces build trust fast; the site is currently faceless.
- **Fun facts / interests** — the human texture you asked about: what you're into, what you
  listen to while building, a hobby, where you've travelled, a "currently" list. This is what
  makes a *personal* brand sticky and memorable vs. a faceless studio.
- **Tech stack, surfaced** — it's currently buried in the Aurora case study. Put a tidy stack
  strip on About/Home (React, Next.js, Three.js/WebGL, GLSL, GSAP, TypeScript, Node, etc.).
  It signals depth to technical buyers and CTOs.
- **CV / résumé button** — you explicitly want this. A "Download CV (PDF)" in About/Contact
  (and maybe nav). Some clients/recruiters need the formal doc.
- **Social proof** — testimonials (even 2–3 short quotes), client names or logos, or honest
  outcome metrics. ⚠️ **The current "Recognition" list is fabricated awards** (Awwwards ×4,
  FWA ×7, Webby…). Shipping invented awards is a real credibility/legal risk — replace with
  true recognition or remove until real.

### Nice-to-have (depth & polish)
- **"Now" / status section** — what you're working on, currently reading/learning, open to.
  Cheap to add, reads as alive and human.
- **FAQ** — timelines, how we work, what a project needs from the client, rough budget bands.
  Removes friction and pre-qualifies leads.
- **Process → tied to outcomes** — the 5 acts are good; add what the *client* gets at each
  stage (a deliverable per act) so it reads as a service, not a manifesto.
- **A downloadable/linked one-pager or capabilities deck** for warm leads.
- **Footer utility** — email, socials (real handles), CV, location, "back to top", and a
  repeat CTA. Currently footers are CTA + meta only.

---

## 4. Per-page content notes

- **Home** — add: hero CTA + value-prop line; a short "Services / what I do" band; a slim
  social-proof strip (logos/quote); an "available for work" chip. The selected-work section is
  strong — keep, but precede it with the offer so people know *why* they're looking.
- **About** — the weakest page *for selling* despite being well-designed. Add: real bio +
  portrait, interests/fun-facts, tech stack, CV button, real testimonials/recognition, and a
  closing CTA. Right now it's atmosphere about a person we never meet.
- **Work (index)** — framing is good ("Selected work"). Add a one-liner of *what kind* of work
  you take and a CTA at the end ("Have something like this? Start a project").
- **The Lab** — your secret weapon for selling. Reframe it explicitly as **proof of craft**:
  "I build interactive experiments for fun — imagine what I'll build for you." Add a CTA at the
  end. It demonstrates skill better than any claim.
- **Contact** — closest to "selling-ready." Add: direct email shown prominently (done),
  a booking link, expected response time (you have "two working days"), what to include in a
  message, and wire it to actually send. Consider trimming required fields to email + message
  to reduce friction (chips/name optional).

---

## 5. Usability & conversion friction

- **Menu-only navigation.** All nav lives behind the hamburger. Elegant, but it hides the
  path to Contact/Work and adds a click before any decision. At minimum keep a **persistent
  CTA** outside the menu; consider a visible "Work / About / Contact" on desktop or a sticky
  contact affordance.
- **No CTA above the fold** on any page — the single biggest conversion miss.
- **`cursor: none` everywhere** — gorgeous, but verify keyboard focus is fully visible and
  the custom cursor never makes interactive targets feel unclickable; ensure touch users get
  a normal experience (you handle `hover:none`, good).
- **Form posts nowhere** — fix before launch; add success/error states (you have a basic
  status line).
- **Cont鬼act friction** — 4 fields + single-select chips is fine, but email-first with optional
  extras converts better.
- **No meta/OG per page** — for a site meant to be shared with clients, add per-page titles +
  OG images so links preview well (sales happen in DMs and email).
- **Trust/contact redundancy** — email should be copy-clickable and appear in the footer on
  every page, not only Contact.

---

## 6. Interaction design — where this site can become *truly special*

You already have the hard part: custom cursor (now morphing + trailing), plasma transitions,
scroll-velocity motion, a live WebGL hero, a canvas Lab. The opportunity is to point that
craft at **selling** — make the interactions themselves the argument for hiring you.

Ideas, roughly by impact:

1. **Make the CTA an experience.** A magnetic "Start a project" that the cursor disc locks
   onto, with a satisfying chip-fill on click (you already favour this pattern) — the button
   itself should feel like a demo of your work.
2. **The Lab as interactive sales proof.** A line like *"everything here is built from
   scratch — this is what I do for fun"* + a CTA. Let a prospect *play* with a sketch; play =
   trust. Consider one signature toy on the home/about (e.g. a draggable/throwable 3D object,
   or the hero knot reacting to cursor) labelled "drag me."
3. **A living availability indicator** — a pulsing status ("● Available · booking Q3") that
   feels real-time. Scarcity + aliveness.
4. **Hover-to-reveal services** — each service expands with a micro-animation that shows the
   benefit; interaction carries the content.
5. **Sound as signature** (behind the toggle you already have) — tasteful UI ticks + an
   ambient bed. Optional, but few personal sites do it well; it's memorable.
6. **A personal easter egg** — a keyboard shortcut, a hidden message in the console for devs
   (great for CTO buyers), a konami-style reveal of fun-facts. Signals personality + skill.
7. **Micro-delight that signals reliability** — every hover, focus, and transition should feel
   intentional. Craft in the small stuff is read (subconsciously) as "this person will sweat
   the details on my project."
8. **A "designed in the browser" flex** — a subtle live FPS/telemetry readout, or "built with
   no page builder" badge, that quietly underlines you build the real thing.

The throughline: **interactions should reduce doubt and create desire**, not just decorate.

---

## 7. What would make it unmistakably *Alexander Smith*

- A **signature interaction** repeated as a motif (e.g. the chip-fill CTA, or the clay object
  as a recurring "character" that reacts to you).
- A **distinct personal voice** in the About + fun-facts — opinions, taste, a point of view on
  the web. Personality is the moat a faceless agency can't copy.
- **One genuinely playful moment** that has nothing to do with work — proof you enjoy this.
- A **consistent, confident offer**: "one senior designer-developer, end-to-end, a few
  projects a year." Specificity sells.

---

## 8. Prioritised roadmap

**P0 — make it sell (do before sharing with any client):**
1. Persistent primary CTA (nav + hero) + a plain value-prop line.
2. Wire the contact form to a real handler; show email + a booking link everywhere.
3. Outcome-framed Services section (home + /about).
4. Replace fabricated awards with real proof (or remove); add 2–3 testimonials.
5. Tech-stack strip surfaced on About/Home.

**P1 — make them trust & remember:**
6. Real About bio + portrait + interests/fun-facts + "now" status.
7. CV/résumé download button.
8. Availability status chip; FAQ; process tied to client deliverables.
9. Per-page metadata + OG images; footer utility (email/socials/CV/back-to-top).

**P2 — make it special:**
10. Interactive Lab-as-proof CTA; a draggable signature 3D toy; hover-reveal services.
11. Sound signature; a personal easter egg; live "built in the browser" flex.

---

## 9. Optional — implement with the loop

> Paste this after `/loop` to have me work the roadmap autonomously (it self-verifies in a
> browser and keeps the build green), the same way the IG-elevation loop ran:

```
/loop Make this site sell Alexander Smith's services by working through
.handoff/BRAND-SELL-AUDIT.md (P0 → P1 → P2). One highest-impact item per iteration.
Track progress in .handoff/SELL-PROGRESS.md (create it from the roadmap on first pass).
Content is data-driven (src/data) — add new fields there and surface them in the pages.
Use REAL placeholder-but-honest copy I can edit; never invent awards, testimonials, or
metrics — use clearly-marked placeholders like "[ testimonial — replace ]". Keep the
established design language (bone/ink, the type roles, the motion vocabulary in
src/lib/ease.ts). After each item: npx tsc --noEmit + npm run build must pass; verify the
change in Playwright at 1440 and 390; update the progress file. Don't wire real secrets —
stub the form handler and leave a TODO with instructions. Stop when P0+P1 are done and
summarise; flag anything that needs a real decision from me (rates, booking link, photo, CV).
```

> Heads-up: a few items genuinely need *you* — your real bio, a photo, real testimonials/
> clients, rate/engagement model, a booking-link URL, and a CV PDF. I can scaffold every slot
> and wire the interactions; you drop in the truth.
