# CLAUDE.md — embertracker.app landing site

Static marketing site for Ember (iOS and Android migraine tracker) on GitHub Pages.
Repo `urkovs/embertracker-landing`, domain `embertracker.app` (CNAME).
**No build step, no frameworks, no tests.** Plain HTML per directory. Every
page uses the V3 system: shared styles `assets/v3/v3.css`, page styles
`assets/v3/pages/<page>.css`, shared JS `assets/v3/v3.js` (contents and API in
the file headers). Forms load `/assets/web-form.js`; the provider-handoff tool
loads `/assets/provider-handoff*.js`. `assets/site.css` and `site.js` are legacy
(only `v2/` uses them). `v3/` holds redirects to the root pages. The app repo
(source of truth for product claims) is `~/Code/ember`.

**State (Oct 16, 2026):** the V3 redesign is live at the root (built by a
multi-agent design and copy team; specs, voice guide and reviews in
`~/Code/_archive/website-v3-team-20261015/`). Older July notes follow.

**State (July 9, 2026):** rounds 1–2 of the redesign plus several refinement
passes are built, verified in the browser, and committed/pushed live. `HANDOFF.md`
is the current-state layer (what's done, the `?v=N` cache-busting rule,
preview-tool quirks, the calendar asset pipeline). `REDESIGN-BRIEF.md` is the
original round-2 spec. Check `git status`/`git log` for anything newer.

## Facts — never guess these, they have been corrected before

- Legal entity is **Cascade Headache, PLLC** (not "LLC"). It appears in every
  footer and throughout `/privacy` and `/terms`.
- Classification claims: **fixed, hardcoded rules built on ICHD-3 criteria — no
  AI, no black box**. Never describe the engine as AI-powered or interpretive,
  and never claim strict ICHD-3 conformance (the app's migraine-day-without-
  headache rule is gated on functional impact, not the 2-feature threshold).
  Approved line (Sept 2026): "Every classification follows fixed rules built on
  ICHD-3 criteria. No AI guesses, no black box." Never "rules a headache
  specialist wrote."
- The app is **free** (no "free right now" / launch-window framing); "free to
  use" is the only pricing message.
- Clinic pricing (Sam, Oct 25, 2026): Direct Send is free for a clinic's first
  90 days, then $50 a month per clinic or $500 a year, billed through Stripe.
  A card or bank account is required to start; the trial begins at checkout.
  Patients never pay for it. Stated on `/providers/join/` and in the clinic
  terms at `/providers/terms/` (keep the two in step).
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
  line stays); no colorblind report version (removed July 2026).
- Risk framing is allowed (Sam, Oct 17, 2026, reversing the July "never
  predict" rule): Ember may say it flags days when your migraine risk looks
  higher, so people can plan around them. Keep it to qualitative risk from
  the patient's own patterns: no percentages, odds or promises about a
  specific attack. The /plus/ FAQ "Does Ember Plus predict migraines?" says
  this.
- On purpose, ahead of the app: the homepage Plus "Your patterns" tile shows
  a today risk card ("Extra high risk", 5 hours of sleep plus Friday) that
  the app doesn't have yet. Sam chose to publish it first and align the app
  later. Don't swap it back to an app finding.
- Homepage H1 is Sam's: "Migraine tracking, without the headache." Do not
  rewrite it (a Sept 2026 replacement was rejected and reverted).
- Do not invent clinical or demo-data details (sample adverse effects, med
  codes, dosages). Pull example data from what's already on the site or ask.

## Page map

- `index.html` — patient landing. Round 2 makes this brief and visual:
  short hero with official App Store and Google Play badges, three "why track" mini-cards,
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
- `privacy/ terms/ providers/terms/ references/` — content pages, shared chrome only. Editing
  the substantive content of `/privacy` or `/terms` → update their "Last
  updated" date.
- `provider-handoff/` — functional in-browser tool with its own CSS and JS.
  `New handoff` creates a full initial plan; `Follow-up handoff` parses pasted
  Patient Instructions/AVS locally and exports only approved named changes.
  A prior handoff is optional cross-check context, never required. Both flows
  can add dated temporary treatments, including the six-day Medrol Dosepak
  shortcut. Raw AVS text is discarded and never included in the update file.
  Preserve the appended chrome-alignment block in `assets/provider-handoff.css`.
- `send/` — unlinked patient utility route for the generic provider-report
  handoff. Keep the page task-focused: exact heading "Send your provider your
  report.", an `ember://send` installed-app action, platform store fallbacks,
  and no implementation-status or deep-link explainer copy.
- `clinic/cascade-headache/` — unlinked, noindex fallback for the clinic QR.
  Universal/App Links normally open Ember directly; this page offers the
  `ember://clinic/cascade-headache` button when platform handoff falls back to
  the browser, displays a printable QR that invokes the same
  `ember://clinic/cascade-headache` app action directly, and uses the real Ember
  orb from `assets/onboarding-ember.png`.
  `/send` and `/clinic/*` are allowlisted in the mirrored root and
  `.well-known/apple-app-site-association` files. Those files and
  `.well-known/assetlinks.json` are production link-verification contracts.
  Asset Links keeps both the Google Play app-signing certificate and the EAS
  upload certificate so Play installs and direct preview installs both verify.
- `migraine-day/` and `headache-diary/` — patient learn pages written for
  search (styles `assets/v3/pages/learn.css`, linked from the footer's Learn
  group). Day types, features and the medicine rule use the app's Learning
  Center wording; the "Try a day" classifier is the homepage widget (v3.css
  §23, v3.js `[data-try]`). Clinical claims carry numbered sources and a
  "Reviewed by a practicing headache specialist" date: update that date when
  Sam re-reviews. If the app's classification rules change, update both pages,
  the classifier and the diary key together.
- `headache-diary/ember-headache-diary.pdf` is rendered from
  `headache-diary/print.html` (noindex; the rebuild command is in its head
  comment). It must stay one US Letter page; re-render the images in
  `assets/v3/diary/` from the PDF after any change.
- `beta/ provider-update/` — legacy one-off pages, self-contained. Leave alone.
- Keep the favicon files and the App Store link (`id6762041852`) intact.
- `<title>` patterns in use: brand-first with a hyphen for main pages
  ("Ember Migraine Tracker - Providers") or "Page | Ember Migraine Tracker"
  for utility pages.

## Design system

V3 (live): app tokens below; Source Serif 4 display with the system UI font for
body; colored section kickers (`.kicker.k-*`); finite reveal motion gated by a
JS class (content visible without JS, none with Reduce Motion); the home scroll
orb (`[data-orb-path]`, wide screens only). Kicker alignment (Oct 21, 2026):
on phones (under 600px) every section head starts at the left gutter with its
dot, `.center-head` included, so sections share one left edge; page heroes
stay centered. A kicker that stays centered (wider screens, heroes, `/send`)
drops its dot. Rules in v3.css §19. Split and FAQ sections put their kicker
and title in a `.wrap.split-head > .center-head` above the columns (v3.css
after `.center-head`), so on 600px and up every section title on a page is
centered; build new split sections the same way. The notes below are from V1; where
they name `site.css`/`site.js` classes, V3 equivalents live in `assets/v3/`.


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
- The official Apple App Store badge is stored in `assets/app-store-badge.svg`;
  the official Google Play badge loads from Google's badge service. Never
  hand-draw an imitation of either badge.

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
- Fonts: Source Serif 4 is self-hosted (`assets/v3/fonts/`, `@font-face` at
  the top of `v3.css`); every page preloads the latin file. Don't add Google
  Fonts links back: they were the main render-blocking cost on phones.
- SEO (Oct 16, 2026): every indexable page carries an absolute canonical (with
  the trailing slash, since `/x` 301s to `/x/`), a description, OG/Twitter tags
  and `og:site_name`. The homepage JSON-LD `@graph` (WebSite, Organization,
  MobileApplication) reuses the meta description, so change them together.
  Add new indexable pages to `sitemap.xml` with a `lastmod`; utility and
  legacy pages (`/send`, `/clinic/*`, `beta/`, `v2/`, `v3/`) stay `noindex`.
  `robots.txt` keeps the repo's `.md` notes, which Pages also serves, out of
  search, and lets every crawler in, AI search and assistants included.
- AI search (Oct 17, 2026): `/llms.txt` is built from each page's live title
  and meta description; rebuild it when those change or a page is added. The
  Plus and clinicians FAQs carry FAQPage JSON-LD that repeats the visible Q&A
  word for word, so edit both together. IndexNow (Bing, which feeds ChatGPT
  search and Copilot): the key file is `/ebe3c7b9dc16705c4ef3b14314152817.txt`; after a deploy that adds
  or changes pages, POST the changed URLs to `https://api.indexnow.org/indexnow`
  with that key. The hero screenshot stays the uncompressed JPG (Sam's crispness
  call), even though Lighthouse flags it.

## Quick verify checklist when you change things

- Bump `?v=` on `assets/v3/v3.css`/`v3.js` (and the page CSS you touched)
  across every HTML file that links them.
- `grep -ri urkov *.html assets` → must be empty; check report images
  visually too (no name).
- Engine demo: all 5 scenarios still run on the providers page.
- No horizontal page overflow at 375px, ~768px, and 1280px.
- Copy scan: no em-dashes, no AI-slop, sentence case.
