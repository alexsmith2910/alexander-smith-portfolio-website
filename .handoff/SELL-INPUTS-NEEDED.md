# Inputs needed to finish the brand-sell build

Fill in whatever you can under each **→** line. Partial is fine. For anything you
don't have yet, write `skip` (I'll leave a clean placeholder or hide the slot).
Hand this back when done and I'll wire it all in.

---

## 1. You — the bio  · `src/data/about.ts`

**1.1 Bio** — 2–3 short paragraphs in your voice: who you are, where you're based,
what you do, and a line of personality.
→


**1.2 Portrait photo** — do you have one? (yes → I'll tell you where to drop it /
no → keep the typographic "AS" mark for now)
→

**1.3 Years active** — tagline says "est. 2021", About said "est. 2026". Which is right?
→

**1.4 Interests / fun facts** — 4–6 real ones (hobbies, what you listen to while
building, a quirk, etc.)
→
-
-
-
-

**1.5 "Currently" snapshot** — what you're building / learning / reading / open to right now.
→ Building:
→ Learning:
→ Reading:
→ Open to:

---

## 2. Proof  · `src/data/testimonials.ts`

**2.1 Testimonials** — you don't have real ones yet. Keep tasteful placeholders, or
hide the whole section until you do? (recommend: hide)
→

**2.2 Clients** — any real client names/logos to list? Or hide that strip for now?
→

---

## 3. The offer  · `src/data/services.ts` & `src/data/site.ts`

**3.1 Services** — do these 4 match what you sell? Add / remove / rename any.
  1. Immersive brand sites
  2. Product & launch experiences
  3. Real-time 3D & WebGL
  4. Full-stack build
→

**3.2 Value proposition** — one plain sentence: what you do, for whom.
(current draft: "I design and build immersive, high-craft websites end-to-end —
strategy, real-time 3D/WebGL and full-stack delivery — for brands that want to stand out.")
→

**3.3 Rates / engagement** — show any pricing ("from £X", day rate,
project/sprint/retainer)? Or hide pricing entirely?
→

**3.4 Availability** — open for work right now? What should the chip say?
(e.g. "Booking Q3 2026" / "Available now" / "Booked until …")
→

---

## 4. Contact & links  · `src/data/site.ts`

**4.1 Email** — confirm the real address. (current: ajs@alexandersmith.dev)
→

**4.2 Booking link** — Cal.com / Calendly URL for a 20-min call? (empty = hidden)
→

**4.3 CV / résumé** — got a PDF to download? (yes → I'll tell you where to drop it / empty = hidden)
→

**4.4 Socials** — real URLs/handles. Tell me which to keep / drop / add.
→ Instagram:
→ Are.na:
→ LinkedIn:
→ Other:

**4.5 Location** — confirm. (current: Dubai, UAE)
→

**4.6 Domain** — real domain? (current: alexandersmith.dev — used for SEO/OG)
→

---

## 5. Email delivery (so the contact form actually sends)  · `src/app/api/contact/route.ts`

**5.1** Do you have / prefer a service — Resend, Formspree, SendGrid, other?
(You give me the service; the API key lives in an env var, never committed.)
→

---

## 6. The work / case studies (lower priority)

**6.1** The 5 projects (Aurora Systems, Meridian, Koto Labs, +2) are sample
placeholders. Leave as-is for now, or do you have real projects to swap in later?
→
