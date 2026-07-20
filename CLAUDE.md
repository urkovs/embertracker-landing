# CLAUDE.md — embertracker.app landing site

Static marketing site for Ember (iOS migraine tracker) on GitHub Pages.
Repo `urkovs/embertracker-landing`, domain `embertracker.app` (CNAME).
**No build step, no frameworks, no tests.** Plain HTML per directory, shared
styles in `assets/site.css`, shared JS in `assets/site.js`. The provider-handoff
page has its own `assets/provider-handoff.css` / `.js`. The app repo (source of
truth for product claims) is `~/Code/headache-tracker-final`.

**State (July 9, 2026):** rounds 1–2 of the redesign plus several refinement
passes are built, verified in the browser, and committed/pushed live. `HANDOFF.md`
is the current-state layer (what's done, the `?v=N` cache-busting rule,
preview-tool quirks, the calendar asset pipeline). `REDESIGN-BRIEF.md` is the
original round-2 spec. Check `git status`/`git log` for anything newer.

## Facts — never guess these, they have been corrected before

- Legal entity is **Cascade Headache, PLLC** (not "LLC"). It appears in every
  footer and throughout `/privacy` and `/terms`.
- Classification claims: **deterministic, hardcoded ICHD-3 rules — no AI, no
  black box**. Never describe the engine as AI-powered or interpretive. Approved
  line: "Every classification follows deterministic ICHD-3 rules. No AI
  guesses, no black box." Never "rules a headache specialist wrote."
- The app is **free** (no "free right now" / launch-window framing); "free to
  use" is the only pricing message.
- **No personal names anywhere** — site copy, meta tags, or rendered artifacts
  (PDF renders included). Credibility is "a practicing headache specialist,"
  impersonal on purpose (July 2026, reversing an earlier decision).
- Privacy page: the app **does use Sentry crash reporting** (anonymized, no
  health data). Don't write "no crash reporting" style absolutes; check
  `/privacy` before making privacy claims anywhere.
- Demo mode: tap the version line in Profile **7 times** to toggle bundled
  demo data.
- No testimonials/quotes/ratings/invented stats (Sam declined, July 2026); no
  diagnosis claims (the "doesn't diagnose, isn't a substitute for care" footer
  line stays); no colorblind report version (removed July 2026); pattern
  insights use observation language, never "predict."
- Do not invent clinical or demo-data details (sample adverse effects, med
  codes, dosages). Pull example data from what's already on the site or ask.

## Page map

- `index.html` — patient landing. Round 2 makes this brief and visual:
  short hero with the official App Store badge, three "why track" mini-cards,
  a one-line-per-feature overview (carousel on mobile), CTA band, report
  showcase, privacy band, big closing CTA.
- `providers/index.html` — clinician page. Report hero, the interactive
  classification-engine demo ("Look under the hood."), report anatomy crops,
  chart-note excerpt, patient-flow video, safety engine, treatment response,
  data practices, handoff link. **The engine demo is load-bearing — never
  drop it in a rewrite.** It is fully self-contained (inline style + markup +
  script); recover from git history if needed.
- `contact/index.html` — form posts to FormSubmit
  (`formsubmit.co/hello@cascadeheadache.com`). Do not alter the form fields,
  action, or hidden inputs; the first-submission email confirmation is done.
- `privacy/ terms/ references/` — content pages, shared chrome only. Editing
  the substantive content of `/privacy` or `/terms` → update their "Last
  updated" date.
- `provider-handoff/` — functional in-browser tool with its own CSS and JS.
  Only the appended "chrome alignment" block at the end of
  `assets/provider-handoff.css` is fair game for styling.
- `clinic/cascade-headache/` — unlinked, noindex fallback for the clinic QR.
  Universal/App Links normally open Ember directly; this page offers the
  `ember://clinic/cascade-headache` button when platform handoff falls back to
  the browser and uses the real Ember orb from `assets/onboarding-ember.png`.
  `.well-known/apple-app-site-association` and
  `.well-known/assetlinks.json` are production link-verification contracts.
  Asset Links keeps both the Google Play app-signing certificate and the EAS
  upload certificate so Play installs and direct preview installs both verify.
- `beta/ provider-update/` — legacy one-off pages, self-contained. Leave alone.
- Keep the favicon files and the App Store link (`id6762041852`) intact.
- `<title>` patterns in use: brand-first with a hyphen for main pages
  ("Ember Migraine Tracker - Providers") or "Page | Ember Migraine Tracker"
  for utility pages.

## Design system (`assets/site.css`)

- Tokens mirror the app: bg `#0a0a0a`, ember `#ecaa68`, button beige
  `#ddcfba`, data hues mig `#9b7acc` · head-blue `#4a8abf` · clear `#a8c4d4` ·
  period `#cc7fa3` · sea `#7fc0a8` · leaf `#5a9a6a` · warn `#c8a43e` · alert
  `#c06060`. Report paper is `#f6f2ea`.
- Type: Source Serif 4 for display, Inter for body. Monospace is reserved for
  real clinical artifacts and figure captions only; that is a rule, not a
  habit.
- Feature sections set `--thread` (inline style attribute) which colors the
  eyebrow, phone-frame border/glow, and caption tick.
- Components: `.phone` (device frame), `.paper` (cream artifact card),
  `.note` (mono chart-note block), `.band` (full-width tonal band),
  `.swap-pill` + `.viewswap` (image toggle), `.reveal`/`.in` (scroll-in).
- `site.js` contracts: `#nav.scrolled`, `.reveal` IntersectionObserver,
  `[data-contact-form]` fetch submit, `[data-swap-btn]`/`[data-swap-view]`
  toggle, video autoplay honoring `prefers-reduced-motion`, paused offscreen.
- Page-specific styles live in a `<style>` block in each page's head.
- Grid children need `min-width: 0` (already set for existing grids); remember
  it when adding new grids or `white-space: pre` content blows the layout out.
- Marketing renders of app artifacts (calendar export, chart note) should
  simplify clinical detail that reads as noise at marketing scale: uniform
  colors per day-type, no severity tints, no med-code abbreviations. Full
  fidelity belongs in the app/PDF, not the landing page.

## Copy rules (Sam's, non-negotiable)

**Register: plain, confident, neutral-warm. Say the clinical thing directly
and let the screenshots carry the charm.** Banned mannerisms (all from real
feedback, July 2026):

- Cute prepositional tails ("right on the treatment").
- Personifying UI ("rings carry impact").
- Stating the obvious ("works by tapping").
- Manufactured idiom ("earning its keep").
- Vague softeners where a clinical statement belongs. Calibration sample,
  Sam's own: "Menstrual tracking helps illuminate any potential relationship
  between your hormones and migraine attacks."

Structural constraints:

- Sentence case everywhere, including headings and buttons.
- No em-dashes (tolerated only in date ranges, e.g. "Feb 1 – Apr 30"). No
  anaphora. No tricolons or rule-of-three rhythm. No antithetical parallelism
  ("it's not X, it's Y" and near-variants).
- Nothing AI-sounding; scan for banned vocab (delve, seamless, comprehensive,
  empower, journey, robust, leverage, etc.).
- Feature captions 12 words max; body paragraphs two sentences max on the
  landing page.
- Only shipped features; screenshots show the real UI; sample data stays
  labeled via figure captions.
- For any substantial copy rewrite, show the proposed text in the
  conversation before committing it.

This register (July 2026) supersedes any older, more "benefit-forward"/
promotional copy voice found in earlier repo history — it was a deliberate,
explicit pivot from Sam, not drift to correct back.

## Assets

- `assets/screens2/*.jpg` — July 2026 app captures, 860px wide, with the
  demo banner erased in post (see REDESIGN-BRIEF.md). Source PNGs live at
  `~/Code/headache-tracker-final/screenshots/`; always rebuild from source,
  not from the scaled JPEGs.
- `assets/report-full.jpg` + `report-crop-*.jpg` — renders of the real
  calendar-PDF export, provider name erased in post. `sample-calendar.pdf`
  is the downloadable sample (raster rebuild; swap in a vector re-export
  with a generic provider name if Sam produces one). Regenerate renders via
  `qlmanage -t -s 2400` + ffmpeg crops.
- `assets/daily-entry-flow-v2.mp4` (+ `-poster.jpg`) — simulator recording,
  top region cropped (status bar + banner), trimmed to 17.9s; past that the
  Logged! screen renders a broken orb in the simulator. A physical-phone
  re-record can restore the full flow as a drop-in swap. Ship optimized
  `.mp4` only; raw `.mov` recordings stay untracked (see `.gitignore`).
- `assets/onboarding-ember.png` is the Ember orb used by the clinic QR fallback.
- Old April assets (`assets/screens/`, `daily-entry-flow.mp4`, etc.) are
  unused by current pages, kept as legacy-page insurance. Check `beta/` and
  `provider-update/` references before deleting.
- The official Apple App Store badge comes from Apple's badge service
  (tools.applemediaservices.com); never hand-draw an imitation.

## Working on it

- Preview: `python3 -m http.server 4173` from the repo root (or use
  `.claude/launch.json`; note `.claude/` is gitignored, so it never reaches
  fresh clones or other sessions — shared rules belong in this file, not there).
- Reveal animations race headless screenshots. Before capturing, run
  `document.querySelectorAll('.reveal').forEach(e => e.classList.add('in'))`
  and scroll with `behavior: 'instant'` (the html element has smooth scroll).
- Layout QA: overflow and alignment bugs have recurred (chart-note overflow,
  providers wide-screen break, engine-viz centering, nav wrapping). Check at
  least three widths before committing: ~375px, ~768px (several components
  switch layout under 768px), and ~1280–1440px.
- Deploy is a push to `main`; GitHub Pages serves the tree as-is.

## Quick verify checklist when you change things

- Bump `?v=` on `assets/site.css`/`site.js`/`provider-handoff.css` links
  across every HTML file if you touched those files.
- `grep -ri urkov *.html assets` → must be empty; check report images
  visually too (no name).
- Engine demo: all 5 scenarios still run on the providers page.
- No horizontal page overflow at 375px, ~768px, and 1280px.
- Copy scan: no em-dashes, no AI-slop, sentence case.
