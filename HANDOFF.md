# Ember site — session handoff (2026-07-09)

Paste this into a new Claude Code session to continue. Also read `CLAUDE.md`
(project rules) and `REDESIGN-BRIEF.md` (round-2 spec) — this file is the
current-state layer on top of those.

## What this is

Static marketing site for **Ember** (iOS migraine tracker) on GitHub Pages.
Repo `urkovs/embertracker-landing`, domain `embertracker.app` (CNAME).
**No build step, no framework.** Plain HTML + one shared stylesheet
(`assets/site.css`) + minimal vanilla JS (`assets/site.js`). App repo (source
of truth for product claims) is `~/Code/headache-tracker-final`.

Two real pages: `index.html` (patient landing) and `providers/index.html`
(clinician). Plus `contact/`, `privacy/`, `terms/`, `references/`,
`provider-handoff/` (functional in-browser tool, its own CSS/JS),
`clinic/cascade-headache/` (unlinked QR fallback plus platform association
files), and legacy `beta/` + `provider-update/` (leave alone).

## Deploy / preview

- Deploy = push to `main`; GitHub Pages serves the tree as-is. **Nothing is
  committed yet** — the entire redesign is uncommitted in the working tree.
  Don't commit/push unless asked.
- Preview: `python3 -m http.server 4173` from repo root, or the Claude preview
  tools (a server is usually already running on :8765).

## ⚠️ Cache-busting (important)

CSS/JS are linked with a version query: `assets/site.css?v=8`,
`assets/site.js?v=8` (and `provider-handoff.css?v=8` etc.). **The dev server
sends no cache headers, so browsers hard-cache `site.css`/`site.js`.** After
ANY edit to site.css or site.js you MUST bump the version across all HTML or
neither you nor the user will see the change on reload. Current version is
**v=8**. Bump with:
```
for f in index.html providers/index.html contact/index.html privacy/index.html terms/index.html references/index.html provider-handoff/index.html; do
  sed -i '' -E 's#\?v=8"#?v=9"#g' "$f"
done
```
Images changed in place (same filename) refresh via Last-Modified on reload, so
they don't need versioning; but if a user says "I still see the old image,"
tell them Cmd+Shift+R once.

## Preview-tool quirks (you WILL hit these)

- `window.innerWidth` sometimes reports `0` in `preview_eval`, and
  `getBoundingClientRect()` returns collapsed values — the eval context desyncs
  from the render. **Screenshots are the source of truth**, not eval geometry.
- Screenshots only paint reliably at **scroll position 0**. Scrolled-down
  content often comes back black. Workarounds that work: (a) a fixed overlay
  like the lightbox screenshots fine anywhere; (b) to see a below-fold section,
  hide the sections above it via eval (`display:none`) so it sits at top, then
  screenshot. Set `document.documentElement.scrollTop` (not `window.scrollTo`)
  if you must scroll.
- To force fresh CSS in an already-open tab, inject a new `<link>` with a
  cache-busted href; the on-page `<link>` won't re-fetch on its own.

## State: everything done this session

Rounds 1–2 of the redesign plus several refinement passes are **done and
verified in the browser**. Summary:

**Landing (`index.html`)**
- Hero: eyebrow "A better migraine tracker", H1 "Migraine tracking, without the
  headache.", warm sub "Finally, a better way to track your migraines. Built by
  a headache specialist who actually gets it, and free to use.", official Apple
  App Store badge (`assets/app-store-badge.svg`).
- "Why track" 3-icon row.
- **Feature carousel** (`.fcards`, center-focus coverflow): 6 cards
  (daily-check-in video, Auto classification, Calendar, Head map, Treatment
  response = `insights-baseline.jpg`, Safety). Off-center cards scale+dim via
  JS (`focus()` in site.js). Bigger/brighter arrows. All phone media forced to
  one aspect via `aspect-ratio: 860/1868` + `object-fit: cover`.
- Migraine Buddy import line (centered), mid CTA band ("...that you'll actually
  enjoy using."), report showcase, privacy band, closing ("...We promise your
  doctor will be impressed.").

**Providers (`providers/index.html`)**
- Order: hero (text only, de-named) → **Provider handoff** (centered) → **"Look
  under the hood" classification-engine demo** (LOAD-BEARING, self-contained
  inline style+markup+script, do NOT break it) → 90-day calendar report → chart
  note (now an intro + `.note-list` bullet list + "copy/send through your
  portal") → daily flow → safety ("Nonjudgmental warning flags.") → treatment
  response (any preventive, individual+combined, payer/prior-auth angle) → data
  practices → closing ("Know a patient who might benefit from Ember?" + free-to-
  use philosophy line). References link in the data-practices band.

**Global**
- Real Ember orb: `assets/adaptive-icon.png` (its bg is baked to `#0a0a0a` =
  site bg, so it drops in seamlessly). Wired via `.brand-orb` in site.css
  (`background: url(adaptive-icon.png) center/contain`) at 40px. Handoff page's
  orb fixed in `provider-handoff.css` chrome block. (Do NOT revert to the old
  CSS-gradient orb — Sam rejected it hard.)
- Amber-tinted Download button, no glow (glow hurt text readability).
- Footers: dropped "for iPhone" and the "Cascade Headache" meta span.
- **All "sample data" figcaptions/labels removed site-wide** — Sam confirmed he
  wants them gone. (Minor compliance note: these were the honesty labels on demo
  screenshots; easy to add back selectively if App Store review ever asks.)

**Report display (latest round)**
- Calendar paper is now warm **cream** (baked into the image), not white — white
  was blinding and dimming white looked "dirty." `.paper` frame changed from
  cream to a **dark warm mat** (`#16130d`, no more bright border). Global paper
  dim is `filter: brightness(var(--paper-dim, 0.92))` on `.paper img`.
- Report render + all 3 providers crops are **click-to-enlarge lightbox**
  (`[data-zoom]` → JS in site.js builds a fixed overlay; click image again for
  1:1 zoom, scroll to pan; Esc/×/backdrop to close). On-page renders shrunk to
  `max-width: 660px` with a "Click to enlarge" hint pill + zoom-in cursor.

## Open items / decisions for Sam

1. ~~51-day vs 90-day sample.~~ **Resolved (2026-07-09, confirmed by Sam):** not
   a bug. The "90-day"/"ninety days" copy describes the feature (Ember builds
   a 90-day calendar); the sample export just happens to only span 51 days of
   history at the time it was generated. No copy or asset change needed.
2. **Clean vector de-named PDF.** The downloadable `assets/sample-calendar.pdf`
   is currently a **raster** rebuilt from the de-named cream master (Sam's
   source PDF had his name "S. URKOV, ARNP" and a white bg). If Sam re-exports a
   vector PDF with a blank/generic provider field, swap it in for crispness.
3. **Hotspot "explore the report" idea (future enhancement).** Sam floated:
   keep the report big and add hotspot dots at key spots (day cell, impact dots,
   med codes, injection markers) that pulse with a *reverse* concentric-ripple
   "beacon" animation and, on hover, pop an explainer of that part of the
   calendar. We shipped the lightbox instead (directly fixes "it's tiny even
   when big"); the hotspots are a nice additive layer if he wants it. Would
   need %-based positions on the report image + a small popover component +
   the reverse-ripple keyframes.

## Non-negotiable rules (from Sam; see CLAUDE.md for full list)

- **No personal names anywhere** — copy, meta, OR rendered artifacts (PDF/report
  images). "S. URKOV, ARNP · CASCADE HEADACHE" was erased from the calendar
  render; keep it erased. Credibility is impersonal: "a practicing headache
  specialist."
- **Credibility engine claim:** no AI, hard-coded auditable ICHD-3 rules, no
  inferences. Approved line: "Every classification follows deterministic ICHD-3
  rules. No AI guesses, no black box." Never "rules a headache specialist wrote."
- Copy register: plain, confident, neutral-warm. Sentence case. No em-dashes,
  no anaphora, no tricolons, no "it's not X it's Y", no AI-slop vocab
  (seamless/comprehensive/journey/robust/leverage/etc.). Sam's voice is a bit
  warmer than the old brief (he added "who actually gets it", "We promise your
  doctor will be impressed", "competent, beautiful, easy migraine tracking").
- Only shipped features; "free to use" is the only pricing message; no
  testimonials/quotes/ratings/invented stats; observation language, never
  "predict"; keep the footer "doesn't diagnose / isn't a substitute for care"
  line. No colorblind report version.

## Design tokens (assets/site.css)

bg `#0a0a0a` · ember `#ecaa68` · amber `#e8a547` · button beige `#ddcfba` ·
data hues mig `#9b7acc` head-blue `#4a8abf` clear `#a8c4d4` period `#cc7fa3`
sea `#7fc0a8` leaf `#5a9a6a` warn `#c8a43e` alert `#c06060`. Report paper cream
`#f6f2ea` (token) but the actual calendar image is baked to ~`#efe... cream`.
Type: Source Serif 4 (display), Inter (body), mono reserved for
clinical-artifact/figure labels only.

## Asset pipeline notes (all via ffmpeg / PIL / sips / qlmanage)

- **Calendar render** (`assets/report-full.jpg` + `report-crop-{strip,header,
  legend}.jpg` + `sample-calendar.pdf`): rendered `Downloads/calendar_color.pdf`
  at 2400px (`qlmanage -t -s 2400`), then in PIL: sampled the header-band color,
  drew a box over the provider-name line to erase it, recolored near-white
  (`>=246` all channels) → cream `(241,233,217)`, saved as
  `scratchpad/calendar-master.png`. Crops are cropped from that master at fixed
  y-bands (header 0–350, JUNE strip 844–1129, legend 0–1352→1360×270). PDF is
  `sips -s format pdf` of the master. To regen, that master is in the session
  scratchpad; re-render from the PDF if it's gone.
- **Screenshots** `assets/screens2/*.jpg` are 860px-wide, banner erased. The
  daily-entry **video** (`daily-entry-flow-v2.mp4`, 760×1650, 17.9s) and
  `safety-nudge.jpg` (860×1868) were **padded to the 860/1868 phone aspect** so
  the carousel's `object-fit: cover` shows all cards uniformly with no clipping.
  `safety-nudge.jpg` also has a baked "spotlight" dim (everything but the AS
  NEEDED section darkened so the overuse warning pops).
- Orb source: `~/Code/headache-tracker-final/assets/adaptive-icon.png` (copied
  into `assets/`).

## Quick verify checklist when you change things

- Bump `?v=` if you touched site.css/site.js.
- `grep -ri urkov *.html assets` → must be empty; check the report images
  visually too (no name).
- Engine demo: all 5 scenarios still run on the providers page.
- No horizontal page overflow at 375px and 1280px.
- Copy scan: no em-dashes, no AI-slop, sentence case.
