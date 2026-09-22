# Ember Plus website preview

September 21, 2026. Local implementation on `codex/website-plus-20260921`, based on fetched website `origin/main` b112049. Not published.

## Scope

Homepage introduction and hero link, dedicated `/plus/` page, Plus navigation/footer links on the six main information pages, and sitemap entry. Existing styles and orb assets are reused. Shared `site.css` and `site.js`, provider tools, forms, legal body copy, and app code are unchanged.

The user requested Plus content guided by Migraine Buddy while retaining Ember's design language. The current request supersedes the older two-page-only marketing brief for this dedicated Plus page.

Reference reviewed: https://migrainebuddy.com/ and https://migrainebuddy.com/mbplus/ . Structural inspiration: paid-tier navigation, short benefit sections, and FAQs. No competitor assets, pricing, testimonials, or outcome claims copied.

## Claims

Verified source in `/Users/samurkov/Code/ember-new-iphone-20260918`:
- `src/plus/billing/setup.ts`: `PLUS_SALES_READY = false`.
- `src/plus/integration/setup.ts`: weather, health import, personal comparisons, encrypted backup destinations.
- `src/plus/providers.ts`: weather observation/forecast distinction and supported health metrics.
- `src/plus/billing/presentation.ts`: free logging, editing, reports, and manual-backup access.

All Plus content is explicitly a preview. Public launch, price, and platform feature acceptance are not asserted. Direct vendor integrations and Apple Watch companion are not advertised. Homepage privacy copy distinguishes free on-device storage from optional Plus encrypted backup.

## Validation

Browser checks on homepage and Plus page at 375, 768, and 1440px: document width matches viewport; no broken loaded images. Mobile orb sizing and navigation wrapping corrected after screenshot review. Homepage Plus link reaches `/plus/`; native FAQ disclosure opens successfully. Seven changed HTML pages have one h1, unique IDs, and valid local links/assets/fragment targets. `git diff --check` passes.

This is focused browser/layout verification, not a full accessibility audit or physical-device acceptance.

## Review

Run `python3 -m http.server 4178 --bind 127.0.0.1` from this worktree. Review `/` and `/plus/`. The current task has a server running on that port. Publication and changes to preview/price/availability messaging remain separate next steps.

## Illustration refinement

Removed the hero scroll CTA and section-jump navigation following owner feedback. Replaced the text rows with four original SVG feature illustrations and single-sentence descriptions, shortened the free section, and changed the Plus page Download styling to a dark outlined treatment. Store actions at the bottom now link directly to the stores. FAQs retain the feature limitations and privacy details.

Browser review confirmed the mobile stacked illustration layout, desktop alternating layout, four illustrations, and no horizontal overflow at the observed viewport sizes. SVG XML parsing and diff whitespace checks pass. Still local and unpublished.

## Expandable feature details

Added native details/summary controls to all four illustrated sections. Health copy names Apple Health and Android Health Connect; device details include Apple Watch, Oura Ring, and Garmin with the platform sharing path. Weather copy now explains optional personalized pressure-change alerts, with an example notification and the distinction between a recorded association and an attack prediction. The illustration includes a barometer dial and notification bell.

Verified against `src/plus/health/SourceHelp.tsx`, `src/plus/weather/personalPattern.ts`, `pressurePlan.ts`, and `notifications.ts` in the current iPhone source worktree. Vendor sharing paths cross-checked with Oura integration documentation and Garmin support. General weather-condition personalization and direct vendor connections are not claimed.

Browser check: device disclosure opens, alert disclosure opens with Enter, both expanded sections fit the observed narrow viewport without overflow, and loaded images are intact. Still unpublished.
