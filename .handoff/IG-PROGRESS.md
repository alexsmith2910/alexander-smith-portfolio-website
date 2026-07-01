# IG-elevation progress

Working through `.handoff/IMMERSIVE-GARDEN-AUDIT.md` (P0 → P1 → P2). One focused item per
loop iteration; verify with build + Playwright screenshots; never leave the build broken.

Screenshots saved under the session scratchpad as `ig_<item>_<viewport>.png`.

## P0 — feels-like-IG core
- [x] 1. Ease vocabulary + reveals → clip-wipe + scale + finer (batched) stagger
      → added `--ease-entrance/--ease-transition` (globals) + `src/lib/ease.ts`; rebuilt the
        ScrollTrigger reveal in ExperienceProvider as a batched expo.out clip-wipe + y + scale
        with stagger. (ig_reveal_1440.png, ig_reveal_mobile.png)
- [x] 2. Scroll-velocity skew on headings/media + multi-layer parallax
      → added smoothed `velocity` to the master-loop TickState; MediaPlaceholder now
        parallaxes its inner image (±6% of height, no edge gap) + skews with scroll velocity
        (±4°); home hero lines skew with velocity too. Verified transform matrix
        (skewY≈4° + translateY) + no gaps. (ig_skew_steady.png, ig_skew_motion.png)
      → note: heading velocity-skew applied to the home hero; other page headings can adopt
        the same pattern in later passes (esp. with item 4).
- [x] 3. Fix art-direction collisions (3D-over-text on home work; meta-tag vs nav on case study)
      → clay now gated to the hero region (fades out past the first viewport via the canvas
        opacity transition) so 3D never sits behind the work copy; media `tag` moved from
        top-right to bottom-right so it never collides with the fixed top-right nav.
        (ig_collide_home.png, ig_collide_case.png)
- [x] 4. Hero type → word/char masked stagger; tighten display type tokens
      → home hero headline split into words; each masked + staggered (0.06s, expo.out) within
        the descender-safe line mask; line inner stays the scroll-out/skew target; display
        tracking tightened -.025→-.03em. Mid-reveal cascade + mobile fit verified.
        (ig_hero_mid.png, ig_hero_settled.png, ig_hero_mobile.png)

**P0 COMPLETE ✅** — motion vocabulary, velocity skew/parallax, collisions, hero word reveal.

## P1 — depth & continuity
- [x] 5. Continuous page transition (outgoing scale/blur + incoming hero pre-reveal)
      → satisfied by the unified plasma menu/transition rebuild (revealRef 0→1 organic
        dissolve from the top-right corner; route swaps behind the cover, then the reveal
        retreats). Verified mid-transition. (ig_transition_mid.png)
      → obs: dissolve peaks fairly bright/saturated mid-cover — left for the owner to tune.
- [x] 6. WebGL post-processing (vignette) + art-directed hero object
      → clay upgraded to MeshPhysicalMaterial with thin-film iridescence (.32) + clearcoat
        (.4) + sheen, plus a warm/cool HemisphereLight for studio shading; global cinematic
        vignette (radial multiply) added in SiteChrome. (ig_hero_clay.png)
      → deferred to P2: full EffectComposer bloom + shader-unified grain (low payoff on the
        bone palette, higher risk — not worth a render-loop rewrite right now).

**P1 COMPLETE ✅** — continuous transition (existing), morphing cursor, mobile rhythm,
art-directed hero + vignette.
- [x] 7. Morphing cursor states + richer row/nav micro-interactions
      → cursor now morphs by context: over media/rows (view/open/jump) it becomes a large
        filled disc (92px) with the label centred inside (rides the lerped ring); links/
        buttons keep the small ring + side label; idle = ring + dot. (ig_cursor_disc.png)
      → deferred: inertia trail + magnetic snapping (P2 polish).
- [x] 8. Mobile vertical rhythm + 3D repositioning for portrait
      → heroes top-anchor on mobile (no mid-screen void): home `justify-start pt-16vh` →
        `md:justify-center`, `min-h-[100svh]` (mobile-correct height); about drops forced
        full-height on mobile (content-driven pt-16vh/pb-10vh) → `md:min-h-screen`. Clay
        shrinks to 0.72 under 700px so it doesn't clip in portrait. (ig_m_home.png, ig_m_about.png)

## P2 — richness & polish
- [ ] 9. One pinned/scrubbed moment + a horizontal gallery break
- [ ] 10. Tasteful UI sound design behind the toggle
- [ ] 11. Performance pass (offscreen pause, FPS lock) + a11y/SEO pass
- [ ] 12. Cursor-reactive light; warm vignette in dark zones

## Notes / deferred
- Playwright removed at loop end (was a devDep for visual verification only).

## LOOP COMPLETE — Definition of Done met (P0 + P1 ✅)
Final verification: `tsc` clean · `next build` clean (13 routes) · 0 console/page errors across
all 6 routes · reduced-motion shows all content (13/13 hero words, 9/9 about reveals).

### P2 left for later (richness & polish)
- [ ] 9. One pinned/scrubbed moment + a horizontal gallery break
- [ ] 10. Tasteful UI sound design behind the toggle
- [ ] 11. Performance pass (offscreen pause, FPS lock) + a11y/SEO pass
- [~] 12. Cursor inertia trail ✓ (lagging ring, lerp .09, hidden over media + on touch);
         magnetic snapping already on CTAs (TextButton). Still: cursor-reactive light + warm
         dark-zone glow. (ig_cursor_trail.png)
- [ ] (from #6) EffectComposer bloom + shader-unified grain
- [ ] extend velocity-skew to non-home page headings (currently media + home hero)
