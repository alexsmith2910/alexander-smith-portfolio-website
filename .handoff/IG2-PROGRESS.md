# IG Audit II — progress   ·   ALL PHASES COMPLETE ✅ (P0 + P1 + P2)

Working `.handoff/IMMERSIVE-GARDEN-AUDIT-2.md` (P0 → P1 → P2), one highest-impact item per
iteration. Verify each with Playwright at 1440 + 390 (read the screenshot) + keep the build
green. New 3D routes through WebGLCanvas + the single master rAF loop (useTick) — no competing
loops. Post-fx whisper-subtle + luminance-gated. Reduced-motion path preserved.

Screenshots: session scratchpad as `ig2_<item>_<viewport>.png`.

## P0 — make it feel like a world
- [x] 1. Persistent, scroll-reactive WebGL presence beyond the hero
      → removed the hard `heroActive` cutoff in WebGLCanvas; clay now renders across the
        whole home scroll (6 objects already stacked down the page; camera rails through
        them). Canvas opacity is full in the hero, eases to a background floor (0.34) over
        ~0.65vh past it, so 3D never competes with copy. Added a scroll-velocity lean
        (vk = clamp(velocity*0.0006,±.05)) to the spin so the world reacts to motion.
        Footer plasma composites unchanged (canvas opacity = max(presence, footer)).
        Verified 1440: hero full, drifting presence behind services/work (in whitespace,
        copy legible), footer intact. tsc clean · build green · 0 console errors.
        Reduced-motion path unchanged (whole effect off). (ig2_p1_*_1440.png)
- [x] 2. One signature pinned + scrubbed moment
      → new `components/sections/ScrubStatement.tsx` placed on home between Work and
        Testimonials. A tall (210vh) track section + a `sticky` inner panel gives the
        pinned feel WITHOUT ScrollTrigger's pin (Lenis-safe — pin can fight Lenis). The
        manifesto sits as faint ghost type (opacity .12 + blur 6px) and a scrubbed GSAP
        timeline (start "top top" → end "bottom bottom", scrub .6) inks it in word by
        word as you scroll. Reduced-motion: static, fully visible, no track height.
        Verified on a clean prod build (port 3100): start = "Worlds" inked / rest ghost,
        mid = sentence inking in, clay presence drifting behind. tsc + build green, 0 errs.
        (ig2_p2_start/mid/end.png)
      → NOTE: running `next build` against the shared .next while `npm run dev` is live
        wedges the dev server (stale chunks). For this loop, verify via tsc + a throwaway
        `next start -p 3100`; avoid `next build` until the dev server can be restarted.
- [x] 3. Cinematic post-processing pass (CA + luminance-gated halation)
      → did NOT use three.js EffectComposer/UnrealBloomPass: it fights this render loop's
        hand-rolled transparent multi-pass compositing and blows out the near-white palette.
        Instead, post-processed the clay the same way the plasma works — render clay → clayRT
        → composite to screen through a new `POST_FRAG` shader (src/lib/shaders.ts):
        edge-weighted chromatic aberration (uCA 7) + a high-gate halation (uThresh .66,
        uGlow .55) so only the lit tops bloom, never the whole form. Alpha preserved →
        transparent bg intact; footer plasma path untouched. Verified on dev (HMR): clay
        gains a soft luminous sheen on lit surfaces, crevices keep shadow, no washout, CA
        subtle (clay is mid-frame). tsc + build green, 0 console/page errors. (ig2_p3c_knot.png)
      → scoped out (deliberate, palette/risk): full UnrealBloom (blows out bone), depth-of-
        field (expensive, needs depth pass), GL grain (global CSS Grain already covers the
        canvas — avoided doubling). Uniforms uCA/uGlow/uThresh are easy tuning knobs.
- [x] 4. Living work media (animated gradient surface + hover-scrub)
      → added an opt-in `living` prop to MediaPlaceholder; enabled on the home work cards.
        Replaces the flat diagonal stripe with a layered, ON-PALETTE animated surface:
        calm base gradient + two slow drifting soft blobs (new `media-drift` keyframe, 22s
        + 31s reverse) with a whisper of the cold-violet accent, + a cursor-reactive radial
        light (the hover-scrub — moving the cursor moves the light via --mx/--my). The
        existing 3D tilt + liquid-ripple + parallax still apply. NOTE: kept it monochrome on
        purpose — the audit's "per-project signal hues" would break the site's near-mono art
        direction ("the only colour lives in the WebGL plasma"). A faint 8% stripe keeps a
        "media" hint; file label retained so the owner knows where assets go. Verified rest +
        hover (cursor light tracks). tsc + build green, 0 errors. (ig2_p4_rest/hover.png)
      → case-study wells left on the flat stripe this pass (lower risk); flip `living` on
        there too later if wanted.

**P0 COMPLETE ✅** — continuous WebGL world, signature scrubbed moment, cinematic post-fx,
living work media. The home page now reads as a reactive 3D world, not an editorial layout.

## P1 — depth, continuity, polish
- [ ] 5. Content sections move with scroll (scrubbed reveals; Services rest-state teaser; mid-page anchor)
- [x] 6. Tech-stack as a dark-zone feature (user's call)
      → gave TechStack a `dark` variant: self-contained void bg + plasma-violet radial glow +
        bone text (light Kicker, bone hover markers). Used `<TechStack dark />` before the
        footer on home; reordered ABOUT so it's last (after Testimonials) too — both pages now
        descend light content → dark Tech-stack → footer plasma, continuous. IMPORTANT: did NOT
        mark it `data-darkzone` — darkFactor uses the FIRST darkzone in the DOM, so a 2nd one
        would hijack k and kill the footer dissolve. The self-contained dark section gives the
        "lit dark feature" look without touching the darkFactor/plasma timing. Verified: dark
        Tech-stack legible (bone on void), flows into footer dissolve, build green. (ts_dark.png)
- [x] 7. Loading shimmer during page transitions (user changed the ask)
      → instead of dimming the dissolve, added a loading indicator so a transition cover never
        reads as blank: centred "LOADING" mono + a shimmering sweep bar (reuses the ob-shimmer
        keyframe), in MenuOverlay, gated via the master tick (`menuReveal > 0.6 && !menuContent`)
        so it shows only during a page-transition cover, not the menu. Verified mid-transition
        (opacity ~0.83, shimmer visible over the plasma), 0 errors. (tr_700.png)
- [x] 8. Loader as a branded, progress-driven moment
      → rebuilt Loader.tsx from a centred count-up into an editorial branded moment: a masked
        wordmark reveal ("Alexander" / italic "Smith", the house kinetic-type idiom) as the
        centrepiece, role + coords meta top, full-width progress bar + serif counter bottom.
        Choreographed exit (meta fades → panel lifts, carrying the wordmark). Preserved the
        exact count-up + `ob:introdone` handoff so the hero entrance still syncs. Gotcha hit &
        fixed: gsap `yPercent` fought the inline `translateY(115%)` and left the wordmark stuck
        in its mask → switched to animating `y` (the proven hero/about idiom). Verified wordmark
        reveals, lifts, hero handoff intact, 0 errors. (ld2_mid.png)
- [x] 9. Per-page metadata DONE · performance pass DONE (OG images still need assets)
      → PERF PASS (kept entirely in WebGLCanvas — master loop untouched, no blast radius):
        hidden-tab render guard (`if (document.hidden) return`); FPS-adaptive quality via an
        EMA of frame dt with hysteresis — sustained >26ms (~1s) drops the post-fx composite
        (heaviest pass) → direct clay render; sustained <19ms (~2s) restores it. Verified the
        normal path still runs post-fx (clay sheen intact), tsc clean, 0 errors.
      → OG images: still need actual image assets (opengraph-image.tsx or static files) — flag.
      → (metadata sub-item done earlier — see above.)
      → metadata (autonomous tick): added server `layout.tsx` to /about, /contact, /lab, /work
        each exporting title + description + openGraph (fills the root "%s — Alexander Smith"
        template). /work/[slug] already had generateMetadata. Verified rendered <title> on all
        four via the dev server. tsc clean (note: adding layouts needed `next typegen` to
        refresh .next route types — the first tsc error was stale generated types, not the code).
        Shared with BRAND-SELL-AUDIT P1. (no build run — typegen + tsc + live titles, to avoid
        wedging the dev server.)
      → STILL TODO: performance pass — pause rAF/render when tab hidden + when no 3D on-screen;
        drop pixel-ratio / disable post-fx under an FPS floor; OG images.

**P1 COMPLETE ✅** — content motion + interaction, branded loader, metadata, perf pass,
dark Tech-stack feature, transition loading shimmer. (P0 + P1 both done.)

## Interaction-design pass (user-directed) — overlaps P1 #5
Animated/added interaction to everything static, consistent with the motion vocabulary:
- About: capabilities + interests → per-item STAGGERED reveal (data-reveal) + hover-marker
  idiom (rule grows, text brightens/shifts); process acts → hover (number/title/rule);
  "Currently" cards → hover (rule grows, label brightens, value shifts).
- Contact: form fields → stagger in; labels → focus-reactive (brighten + nudge via focusField;
  project label brightens once a chip is chosen); chips → hover lift + selected scale; socials
  → hover slide past a growing marker + handle/divider response.
- TechStack: columns stagger + per-item hover marker. Testimonials: quotes stagger + hover
  (quote mark / rule / caption); clients hover-brighten. Footer socials: hover lift.
- KEY PATTERN: rest-dimmed elements keep their dim on an INNER span so the reveal (opacity
  0→1) doesn't force them to full brightness; hover transforms live on child elements so they
  don't fight the gsap-controlled transform on data-reveal targets.
- Verified: tsc clean; real wheel-scroll confirms staggered items reveal (not stuck hidden);
  0 console errors. Production build NOT run (would stale the live dev server mid-review).

## P2 — signature & delight  ✅ COMPLETE
- [x] 10. UI sound design + ambient bed behind the toggle
      → ambient bed already existed (AudioToggle: 4 detuned oscillators + LFOs). Added the UI
        sound layer in AudioToggle (shares its AudioContext, only when sound is on): a throttled
        airy hover tick (1180Hz, ~.025) on [data-cursor]/a/button + a softer press tick (520Hz,
        ~.05), short enveloped sines. Opt-in (off by default). Subjective — easy to tune the
        freqs/vols. Verified: toggle works, hover/click throw no errors, tsc + build green.
- [x] 11. Cursor-reactive scene light + warm dark-zone glow
      → warm PointLight on the clay that tracks the cursor (mouseE* ±0.5, +y downward →
        world); intensity 0.7→~3.3 and warmth ramp with s.dark so the dark footer zone reads
        as warmly lit, not flat black. All in WebGLCanvas. Verified, 0 errors.
- [x] 12. Draggable 3D toy + personal easter egg
      → EasterEgg.tsx (in SiteChrome): styled console signature for devs/CTOs (brand + "built
        from scratch" + email + konami hint) and a Konami code (↑↑↓↓←→←→ BA) → dispatches
        `ob:konami` → WebGLCanvas spins the clay with a decaying boost.
      → DRAGGABLE TOY: window-level pointerdown raycast against the clay (canvas stays
        pointer-events:none so the page isn't blocked); grabbed mesh follows the cursor on a
        camera-facing plane; release converts drag velocity into a throw-spin and springs the
        mesh home (lerp to stored base). Desktop-only (hover:hover gate) so it never fights
        touch scroll. "drag me" hint in the hero fades in after intro, out on first `ob:grab`.
        Verified: grab fires, knot follows + springs home, scroll still works, tsc + build
        green, 0 errors. (dg_drag.png, dg_release.png)

## Log
(iteration notes appended here as items complete)
