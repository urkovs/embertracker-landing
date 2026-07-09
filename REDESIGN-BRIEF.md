# Redesign brief — round 2 (July 2026)

Work order for the second pass on embertracker.app, based on Sam's feedback
after the July 8 redesign. This file is the handoff: any session (or subagent)
picking up this work reads this plus CLAUDE.md and has the full picture.

## Scope decision (confirmed with Sam, do not revisit)

**No new features/product page.** The detail trimmed off the landing page is
cut, not relocated to a third page. Two main pages only: the brief patient
landing page and the deeper Providers page. Anything clinical-flavored that
still needs a home goes to Providers (see point 6 below); anything else
just gets shorter or disappears. Migraine Buddy's own site works the same
way, no separate features page in their nav either.

## What Sam's feedback establishes

1. **The landing page is too dense.** Too much feature info, too much text,
   and structurally boring (screenshots stacked straight down). It should be
   brief, visual, and instantly understandable, in the spirit of
   migrainebuddy.com without copying it.
2. **The copy register is off.** The writing keeps reaching for folksy
   flourishes. Banned patterns, with Sam's own examples:
   - Cute prepositional tails: "right on the treatment"
   - Personification of UI: "rings carry"
   - Stating the obvious: "works the same way as everything else, by tapping"
   - Manufactured idiom: "earning its keep"
   - Vague softeners where a clinical statement belongs: "if you track your
     cycle, period days sit right on the grid" should be more like
     **"Menstrual tracking helps illuminate any potential relationship
     between your hormones and migraine attacks."** (Sam's phrasing; use it
     nearly verbatim and treat it as the calibration sample for the register.)
   The target voice: plain, confident, neutral-warm sentences that say the
   clinical thing directly and let the screenshots be the charm.
3. **"Using rules a headache specialist wrote" is out.** The credibility
   message Sam wants instead: **no AI, hard-coded auditable rules, no
   inferences.** Primary home is the providers page (the old page already had
   the approved line: "Every classification follows deterministic ICHD-3
   rules. No AI guesses, no black box."). The landing page may carry at most
   one short echo of it.
4. **The demo banner must come off the images.** Shots 4 through 11 and the
   screen recording have "Sample data. Tap to exit demo." baked in. Erase it
   in the asset pipeline (see below). Figures keep their "Sample data" text
   captions for honesty.
5. **Day types goes visual.** Replace the paragraph with a compact visual:
   four color-coded day-type chips (migraine purple, headache blue, symptom
   gray, clear sky) plus at most two short sentences.
6. **Restore the classification-engine animation on the providers page.**
   It was on the old providers page ("Look under the hood.") and Sam loves
   it; it worked on both desktop and phone. Recovered from git into
   the scratchpad as `engine-block.html` (821 lines, fully self-contained:
   inline style 3–421, markup 422–506, inline script 507–815; only external
   class it references is the cosmetic `section-divider--prov`). Recover
   fresh anytime with:
   `git show <pre-redesign-commit>:providers/index.html | sed -n '86,906p'`
7. **No personal name anywhere.** Remove "Sam Urkov, DNP, FNP-C, AQH" from
   the providers hero and meta description. Also remove
   "DR. SAMUEL URKOV · CASCADE HEADACHE" from the PDF renders and the
   downloadable sample PDF. Credibility stays impersonal: "a practicing
   headache specialist." Credible without ego.
8. **Drop the colorblind-version block** on the providers page entirely.
9. **CTAs are too weak.** After the hero scrolls away the only CTA is the
   small nav pill. The rebuilt landing gets the official Apple "Download on
   the App Store" badge in the hero, a mid-page CTA band, and a big closing
   CTA. Fetch the official badge SVG from Apple's badge service
   (tools.applemediaservices.com); do not hand-draw an imitation.
10. **Still no testimonials or quotes** anywhere.

## Landing page target structure

Total copy budget outside captions: roughly 180 words.

1. Nav (unchanged).
2. Hero: keep "Migraine tracking, without the homework." unless Sam says
   otherwise, one subline (specialist-built + free), official App Store
   badge, hero screenshot. Instant comprehension is the bar.
3. "Why track" row: three icon mini-cards, 20 words max each
   (better appointments · spot your patterns · safer medication use).
4. Feature overview: screenshot cards with one caption line each (12 words
   max). Mobile: horizontal snap-scroll carousel; desktop: grid. Cards:
   daily check-in (video), day types (chip visual), calendar, head map,
   treatment response, safety. No paragraphs.
5. CTA band: one line + badge.
6. The report: paper render, two lines, link to providers page.
7. Privacy band: two lines max.
8. Closing CTA: badge + one warm line.
9. Footer (unchanged, compliance line stays).

## Providers page changes

1. Hero: de-named sub ("from a practicing headache specialist"), artifact
   stays the hero.
2. Insert the restored engine demo after the hero, intro'd by "Look under
   the hood." + the no-AI line above. Restyle only its chrome (fonts,
   eyebrow) to match the new design; do not touch its mechanics.
3. Report anatomy: keep strips and crops; delete the colorblind block and
   the report-bw image reference.
4. Chart note, patient-flow video, safety, treatment response, data
   practices, handoff, closing: keep, with a copy pass to the new register
   ("no inferences" joins the data-practices band).
5. Meta description: drop the name sentence.

## Asset work order

Work from the source captures in
`~/Code/headache-tracker-final/screenshots/`, not from the already-scaled
site JPEGs. Same output filenames so pages need no src changes.

1. **Banner erase, stills**: shots 4A, 4B, 5and6, 7, 9, 11, Bonus carry the
   violet banner below the status bar. Erase via ffmpeg `drawbox` filled
   with the app background (#0a0a0a) over the banner band, then scale to
   860px and re-export to `assets/screens2/` under the existing names.
   Note shot 9 is 1179×2556 (different geometry from the 1320×2868 set).
   Verify every output visually. Shots 1–3 never had the banner; leave them.
2. **Banner erase, video**: re-encode `daily-entry-flow-v2.mp4` from the
   original .mov with the top region (status bar + banner) cropped off,
   same 17.9s trim, and regenerate the poster. The safety-nudge still
   (extracted from the video at ~12s) gets the same treatment.
3. **PDF de-naming**: on the 2400px master render, erase the provider line
   ("PROVIDER DR. SAMUEL URKOV · CASCADE HEADACHE") with a paper-colored
   box; regenerate `report-full.jpg` and `report-crop-header.jpg`; rebuild
   `sample-calendar.pdf` as a raster PDF from the retouched render
   (`sips -s format pdf`). If Sam later re-exports from the app with a
   generic provider name, swap that vector version in.
4. Delete `report-bw.jpg` once the providers page no longer references it.

## Build plan (subagent split)

- **Agent A, assets**: the full asset work order above, including visual
  verification of every retouched output. Writes only under `assets/`.
- **Agent B, engine port**: adapt `engine-block.html` to the new page
  chrome (tokens, fonts, eyebrow) as a verified drop-in fragment plus
  integration notes. No behavior changes.
- **Main session**: copy rewrite to the new register, landing rebuild,
  providers integration, Apple badge fetch, full preview walkthrough at
  375px and 1280px, docs update, quality-gate pass.

A and B run in parallel; integration happens after both land.

## Acceptance checklist

- No "Tap to exit demo" visible anywhere on the site.
- `grep -ri urkov` over HTML finds nothing, and no rendered asset shows the
  name (visual check of report images + sample PDF).
- Landing copy budget met; CTA present in hero, mid-page, and closing;
  official badge renders crisply at both widths.
- Engine demo: all five scenarios run, on mobile and desktop, and nothing
  breaks with reduced motion.
- No colorblind mention on the providers page.
- Copy passes the register scan (no flourish patterns above) plus the
  standing constraints (sentence case, no em-dashes, no anaphora, no
  tricolons, no antithetical parallelism, no AI-slop vocabulary).
- FormSubmit form, favicon, handoff tool, and legacy pages untouched.
