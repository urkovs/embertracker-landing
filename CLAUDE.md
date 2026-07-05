# Ember landing site (embertracker.app)

Static marketing site for Ember, an iPhone migraine/headache tracker. Served by
GitHub Pages from the repo root (CNAME = embertracker.app). No build step, no
framework, no tests: plain HTML per directory, shared styles in
`assets/site.css`, shared JS in `assets/site.js`. The provider-handoff page has
its own `assets/provider-handoff.css` / `.js`. Preview by opening the HTML file
directly or with any static file server.

## Facts — never guess these, they have been corrected before

- Legal entity is **Cascade Headache, PLLC** (not "LLC"). It appears in every
  footer and throughout `/privacy` and `/terms`.
- The founder line is "built by a **practicing headache specialist who also
  gets migraines**" — don't shorten or embellish it.
- Classification claims: **deterministic, hardcoded ICHD-3 rules — no AI, no
  black box**. Never describe the engine as AI-powered or interpretive.
- The app is **free** (no "free right now" / launch-window framing).
- Privacy page: the app **does use Sentry crash reporting** (anonymized, no
  health data). Don't write "no crash reporting" style absolutes; check
  `/privacy` before making privacy claims anywhere.
- Demo mode: tap the version line in Profile **7 times** to toggle bundled
  demo data.
- Do not invent clinical or demo-data details (sample adverse effects, med
  codes, dosages). If a section needs example data, pull it from what's
  already on the site or ask.

## Copy voice

Nearly every manual fixup commit in this repo's history is the owner rewriting
AI-drafted copy, so treat copy as the highest-risk change type:

- **No em dashes in marketing copy.** The owner strips `&mdash;`/`—` on sight;
  use a plain `-`, `--`, or restructure the sentence. (Em dashes are tolerated
  only in date ranges, e.g. "Feb 1 — Apr 30".)
- Voice is direct and benefit-forward, not understated or precious. The owner
  happily uses `<br>` line breaks and `<b>` for emphasis in body copy — match
  that rather than "tasteful restraint".
- Benefit statements name the artifact: "Export a PDF of your patterns", not
  "Three months of your patterns".
- `<title>` patterns in use: brand-first with a hyphen for main pages
  ("Ember Migraine Tracker - Providers") or "Page | Ember Migraine Tracker"
  for utility pages.
- For any substantial copy rewrite, show the proposed text in the
  conversation before committing it.

## Marketing pages simplify clinical artifacts

When recreating app artifacts (calendar export, chart note) for the site,
strip clinical detail that reads as noise at marketing scale: uniform colors
per day-type, no severity tints, no med-code abbreviations. Full fidelity
belongs in the app/PDF, not the landing page.

## Layout QA

Overflow and alignment bugs have recurred (chart-note overflow, providers
wide-screen break, engine-viz centering took multiple attempts). After any
layout change, check three widths before committing: ~375px, ~768px (several
components switch layout at `<768px`), and ≥1440px.

## Housekeeping

- Editing `/privacy` or `/terms` → update their "Last updated" date.
- Ship optimized `.mp4` video only; raw `.mov` recordings stay untracked
  (see `.gitignore`).
- `.claude/` is gitignored, so project settings/skills placed there never
  reach fresh clones (including Claude Code web sessions). Shared rules
  belong in this file.
