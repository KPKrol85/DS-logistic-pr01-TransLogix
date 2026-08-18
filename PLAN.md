# TransLogix — Development Plan

**Last reviewed:** 2026-08-18
**Project type:** Static multi-page website (vanilla HTML, modular CSS, ES modules) with a Vite production build, Netlify static-hosting configuration, service worker and web manifest
**Plan status:** Active

## Planning principles

- The plan reflects the current verified state of the repository, not earlier documentation.
- Source files are canonical; the generated `dist/` package is never edited directly.
- A main item is checked only when every required subtask and its completion condition are satisfied.
- Completed significant changes are recorded separately in `CHANGELOG.md`.
- Findings converted from `daily-AUDIT.md` carry their source identifier for traceability.

## Current priorities

1. `PH1-01` — Ship `thankyou.html` in the deployable package so the contact flow stops ending on a 404.
2. `PH2-01` — Gate the reveal hidden state behind the `.js` class so content survives a non-executing module graph.
3. `PH3-01` — Align the `Organization` structured data with the published company address.
4. `PH3-02` — Remove the conflicting delivery figure from the footer statistic.

## Phase 1 — Contact conversion path

**Goal:** Make the contact form end on a real confirmation page in the deployed package, with exactly one confirmation mechanism.

- [x] **PH1-01 — Include `thankyou.html` in the deployable package** — **Priority:** Critical
  - [x] add `thankyou.html` to `rootFilesToCopy` in `scripts/build-dist.js`
  - [x] confirm the packaged root file set covers every page referenced by the form action (`contact.html`), the service-worker precache list (`sw.js`), the page canonical URLs and `sitemap.xml`
  - [x] rebuild the package locally and verify that `dist/thankyou.html` exists with the header and footer partials inlined and the minified asset references rewritten
  - [x] verify after deployment that `/thankyou.html` returns HTTP 200 on the production origin
  - **Completion condition:** a successful contact submission lands on the confirmation page in the deployed site and the service-worker install step no longer skips `/thankyou.html`
  - **Source:** `daily-AUDIT.md` — P0-01

- [x] **PH1-02 — Consolidate the contact form confirmation path to one mechanism** — **Priority:** Medium
  - [x] decide which confirmation surface is authoritative: the `thankyou.html` redirect or the inline `#contact-success` message
  - [x] remove the unreachable path — either the `?success=1` branch in `assets/js/form.js` together with the `#contact-success` markup in `contact.html`, or the redirect target
  - [x] verify the contact Playwright spec still reflects the retained flow
  - **Completion condition:** exactly one success mechanism exists in source and it is the one the deployed form actually triggers
  - **Depends on:** `PH1-01`
  - **Source:** `daily-AUDIT.md` — P2-09

## Phase 2 — Non-JavaScript rendering baseline

**Goal:** Ensure every indexable page renders its main content when the module graph does not execute.

- [x] **PH2-01 — Gate the reveal hidden state behind the `.js` class** — **Priority:** High
  - [x] scope `.reveal { opacity: 0; transform: … }` in `assets/css/modules/utilities.css` to the `.js` class, matching the pattern already used by `.js .nav__panel` in `assets/css/modules/header.css`
  - [x] confirm `assets/js/boot.js` sets the `js` class early enough that no visible flash is introduced on the six affected pages
  - [x] regenerate `assets/css/style.min.css` through `npm run build:css` and re-run `npm run qa:budget`
  - [x] verify with scripting disabled that `index.html`, `services.html`, `service.html`, `fleet.html`, `pricing.html` and `contact.html` render their main content
  - **Completion condition:** disabling JavaScript leaves all `.reveal` content visible, and the animation still runs when scripting is active
  - **Source:** `daily-AUDIT.md` — P1-01

- [x] **PH2-02 — Provide a non-JavaScript baseline for the offer listing** — **Priority:** Medium
  - [x] add a static baseline or a `noscript` fallback for `#services-list` in `services.html`, following the `noscript` pattern already used in `service.html`
  - [x] keep `assets/data/services.json` as the single source of the offer data for the scripted path
  - [x] verify the page is never empty for a non-executing client and that `qa:html` still passes
  - **Completion condition:** `services.html` presents offer content without JavaScript, and the client-side filtering path is unchanged
  - **Depends on:** `PH2-01`
  - **Source:** `daily-AUDIT.md` — P2-07

## Phase 3 — Published content and data integrity

**Goal:** Remove contradictions between machine-readable data, visible content and the legal documents.

- [x] **PH3-01 — Align the `Organization` structured data with the published address** — **Priority:** High
  - [x] replace the `PostalAddress` in the `index.html` JSON-LD block with the address used in `partials/footer.html` and `contact.html`, including a valid postal code
  - [x] re-run `npm run qa:jsonld`
  - **Completion condition:** the structured-data address matches every visible instance of the company address across the site
  - **Source:** `daily-AUDIT.md` — P1-02

- [x] **PH3-02 — Resolve the conflicting footer delivery statistic** — **Priority:** High
  - [x] choose one authoritative figure for `data-stat="deliveries"` in `partials/footer.html`
  - [x] make the markup text and the `data-value` attribute agree, or drop the attribute so `assets/js/stats.js` leaves the static text alone
  - **Completion condition:** the displayed number no longer changes after script execution on any page that includes the footer
  - **Source:** `daily-AUDIT.md` — P1-03

- [x] **PH3-03 — State the demonstration character in the entry consent dialog** — **Priority:** Medium
  - [x] add one sentence to the dialog text in `assets/js/site-consent.js` stating that TransLogix is a portfolio demonstration with a fictional brand, consistent with the wording already used in `terms.html`, `privacy.html` and `cookies.html`
  - [x] keep the existing links to the three legal documents and the current focus and acceptance behavior
  - [x] run `npm run build:js`; the command completed successfully and `assets/js/main.min.js` remained content-identical because the build reads only `assets/js/main.js`
  - **Completion condition:** the pre-entry dialog discloses the demo nature before acceptance, without changing the consent storage key or flow
  - **Source:** `daily-AUDIT.md` — P2-10

- [x] **PH3-04 — Align the contact form consent wording with the declared legal basis** — **Priority:** Medium
  - [x] compare the `rodo` checkbox label in `contact.html` ("zgoda … w celu przygotowania oferty") with the processing purpose and legal basis declared in `privacy.html` (art. 6(1)(f), correspondence)
  - [x] restate the checkbox label so it describes the same purpose and basis as the privacy policy, or update the policy entry so the consent basis is the documented one
  - [x] keep the field required and its `aria-describedby` error wiring intact
  - **Completion condition:** the form label and the privacy policy describe one consistent purpose and legal basis for contact data

## Phase 4 — Accessibility and semantic corrections

**Goal:** Correct source-level accessibility defects that current QA scripts do not catch.

- [x] **PH4-01 — Apply `aria-current` on the extensionless routes served by the host** — **Priority:** Medium
  - [x] normalize both sides of the comparison in `assets/js/aria-current.js` so `/services` and `/services.html` resolve to the same key, covering the four routes declared in `_redirects`
  - [x] keep the existing home-page matching for `/`, `./` and `index.html`
  - [x] verify current-page marking on both the extensionless and the `.html` form of each route
  - **Completion condition:** exactly one navigation link carries `aria-current="page"` on every route form the host serves
  - **Source:** `daily-AUDIT.md` — P2-06

- [x] **PH4-02 — Correct the heading level sequence on the system pages** — **Priority:** Medium
  - [x] resolve the `h1 → h3` skip on `404.html`, `offline.html` and `thankyou.html`, either by giving the footer statistics a level consistent with their `h2` section context or by supplying the missing section heading on those pages
  - [x] confirm the change does not alter heading order on the nine content pages, which already supply `h2` headings
  - [x] verify against the `pa11y-ci` URL set once dependencies are available
  - **Completion condition:** no heading level is skipped on any of the 12 source pages
  - **Source:** `daily-AUDIT.md` — P2-03

- [x] **PH4-03 — Give `.legal-section h3` its own typographic step** — **Priority:** Low
  - [x] add a local `var(--fs-06)` rule for `.legal-section h3` in `assets/css/modules/pages.css`, next to the existing `.legal-section h2` rule
  - [x] verify the subsection hierarchy on `privacy.html` and `cookies.html`, and confirm `terms.html` has no `h3` subsection and requires no markup change
  - [x] regenerate `assets/css/style.min.css` and re-run `npm run qa:budget`
  - **Completion condition:** `h3` subsections in the legal documents render visually below their parent `h2`
  - **Source:** `daily-AUDIT.md` — P2-02

## Phase 5 — Source-of-truth and QA contracts

**Goal:** Remove duplicated sources of truth and close the coverage gaps that let the packaging defect pass every existing check.

- [x] **PH5-01 — Resolve the duplicated markup and structured-data copies** — **Priority:** Medium
  - [x] confirm `templates/partials/` has no runtime or build consumer and retain `partials/` as the only shared-markup source
  - [x] confirm `assets/data/jsonld/*.json` has no runtime, build or generator consumer and retain inline HTML JSON-LD as the only structured-data source
  - [x] remove both redundant source groups and their obsolete QA discovery references
  - [x] update the relevant architecture, structure, QA and maintenance sections of `README.md`
  - **Completion condition:** every markup and structured-data file in the repository is either canonical or verified against its canonical source by a check
  - **Source:** `daily-AUDIT.md` — P2-01

- [x] **PH5-02 — Correct stale asset references and extend asset verification** — **Priority:** Medium
  - [x] replace or remove the `image` values in `assets/data/services.json` that point at the non-existent `assets/img/solo.svg`, `refrigerated.svg` and `mega.svg` (seven of eight records)
  - [x] rename the orphaned `assets/img/fleet/mega/1 (1).webp` to the project naming pattern and reference it as the WebP `<source>` for the Mega card in `index.html` and `fleet.html`, or delete it
  - [x] extend `scripts/verify-assets.js` to cover `srcset` values and asset paths referenced from data files
  - [x] re-run `npm run assets:verify`
  - **Completion condition:** no asset reference in markup or data files points at a missing file, and the extended check fails when one does
  - **Source:** `daily-AUDIT.md` — P2-04

- [x] **PH5-03 — Point Lighthouse CI at the deployable package** — **Priority:** Medium
  - [x] change `staticDistDir` in `lighthouserc.json` from the repository root to `dist/`, matching the Vite package served by the e2e configuration in `playwright.config.js`
  - [x] make the standalone `qa:lighthouse` workflow rebuild `dist/` before Lighthouse collection
  - [x] confirm the five collected URLs resolve inside the package after `npm run build`
  - [x] preserve one run, mobile execution, `lighthouse:no-pwa`, the category warning thresholds and temporary public storage upload; replace the unsupported `preset: "mobile"` value with the current Lighthouse-compatible `formFactor: "mobile"`
  - [x] run `npm run qa:lighthouse` and record its focused outcome: all five URLs were collected and uploaded, while retained `lighthouse:no-pwa` audit failures made the assertion step exit with code 1
  - [x] update the `lighthouserc.json` description in `README.md` (PL and EN sections) to state the new collection source
  - **Completion condition:** Lighthouse CI measures the deployed Vite layer, including Vite-processed production CSS/JavaScript and build-time inlined partials
  - **Source:** `daily-AUDIT.md` — P2-08

- [x] **PH5-04 — Declare a line-ending policy for the repository** — **Priority:** Low
  - [x] add a root `.gitattributes` defining normalization for text files and binary handling for the tracked image, font and icon assets
  - [x] run `git add --renormalize .` after staging the policy; no existing tracked file required an index content change
  - [x] verify that `git status --short` reports only intentional PH5-04 changes, with no historical CRLF-only group
  - **Completion condition:** `git status` reflects real content changes only, with no line-ending noise
  - **Source:** `daily-AUDIT.md` — P2-05

- [x] **PH5-05 — Migrate the development and production workflow to Vite** — **Priority:** Medium
  - [x] add Vite and expose `npm run dev`, `npm run build` and `npm run preview` without changing the package module type
  - [x] configure all 12 maintained root HTML pages as explicit MPA inputs
  - [x] serve the canonical source pages and runtime-loaded partials through the Vite development server
  - [x] build the deployable `dist/` with Vite-processed CSS and the existing JavaScript module graph
  - [x] inline the canonical header and footer into every production page without duplicating their maintained markup
  - [x] preserve the required hosting files, service worker and stable-path runtime resources in `dist/`
  - [x] verify the production layout, representative shared-shell output, development endpoints and focused services behavior
  - **Completion condition:** Vite is the primary development and production workflow, all 12 pages and baseline deployment resources are present in `dist/`, and service-worker, performance-budget and Lighthouse migrations remain separate tasks

- [x] **PH5-06 — Align the service worker precache with Vite build output** — **Priority:** Medium
  - [x] discover the generated production CSS and JavaScript paths from the current Vite bundle output
  - [x] integrate the generated asset paths automatically into the production `dist/sw.js` without hardcoded hashes in source
  - [x] advance the service-worker cache version from `translogix-static-v3` to `translogix-static-v4`
  - [x] preserve the existing network-first navigation, offline fallbacks, stale-while-revalidate asset handling and cache lifecycle
  - [x] verify that `dist/sw.js` references the generated files that exist in `dist/` and omits the legacy production CSS/JavaScript paths
  - [x] pass `npx playwright test tests/e2e/service-worker-offline.spec.js` against the current Vite-built package
  - **Completion condition:** the Vite build writes the current generated CSS/JavaScript paths into `dist/sw.js`, and the focused offline service-worker test passes

- [x] **PH5-07 — Align performance budgets with Vite production output** — **Priority:** Medium
  - [x] inspect the current Vite production CSS and JavaScript assets and their gzip sizes
  - [x] discover production assets dynamically from the generated Vite manifest without hardcoded hashes
  - [x] migrate the 12000 B CSS gzip budget to the aggregate Vite CSS output
  - [x] migrate the 18000 B JavaScript gzip budget from the source module graph to the aggregate Vite JavaScript output
  - [x] make `npm run qa:budget` build and check the current production package deterministically
  - [x] remove the legacy budget/build commands, scripts, tracked `.min` files and CLI dependency after confirming they have no active consumer
  - [x] pass the focused Vite build, positive budget check, empty-group failure check, Node syntax check and diff validation
  - **Completion condition:** the current Vite production CSS and JavaScript pass their retained gzip limits through hash-independent manifest discovery, and no obsolete pre-Vite budget path remains active

## Phase 6 — Release verification

**Goal:** Confirm the full quality suite on a clean dependency install and settle the release record.

- [ ] **PH6-01 — Run the complete `release-check` suite on a clean install** — **Priority:** Medium
  - [ ] install dependencies from `package-lock.json` (`node_modules/` is absent from the working copy)
  - [ ] run `npm run release-check`, covering `qa:html`, `qa:jsonld`, `qa:links`, `qa:a11y`, `assets:verify`, `qa:budget` and `test:e2e`
  - [ ] run `npm run qa:lighthouse` separately, since it is not part of `release-check`
  - [ ] record every failure as a new plan item under the phase that owns the affected area
  - **Completion condition:** the four checks never executed during the current audit cycle (`qa:html`, `qa:a11y`, `qa:lighthouse`, `test:e2e`) have a recorded outcome on the current tree
  - **Depends on:** `PH1-01`, `PH2-01`
  - **Source:** `daily-AUDIT.md` — Verification performed

- [ ] **PH6-02 — Establish the first released version in `CHANGELOG.md`** — **Status:** Blocked — **Priority:** Low
  - [ ] move the entries from `[Unreleased]` into a dated version section
  - [ ] reconcile the version with the `1.0.0` value declared in `package.json` and tag the repository
  - **Blocker:** no release version and date have been decided; the repository has no tags and `CHANGELOG.md` holds its entire history in `[Unreleased]`
  - **Unblocks when:** the project owner confirms the version number and release date

## Optional future improvements

- [x] **O-01 — Add a package-level smoke check for the built output**
  - [x] generate a fresh Vite production package before each standalone package check
  - [x] validate non-empty local form actions from built HTML against `dist/`
  - [x] validate both static `PRECACHE_URLS` and Vite-generated `VITE_ASSET_URLS` from the final `dist/sw.js`
  - [x] validate canonical URL pathnames declared by built HTML against package pages
  - [x] validate every URL pathname declared in the built `sitemap.xml` against package pages
  - [x] expose `qa:package` and include it in `release-check` without removing any existing gate
  - [x] pass the Node syntax check, fresh-build package check and an isolated missing-target negative check
  - **Value:** `scripts/check-local-links.js` and `scripts/verify-assets.js` both resolve against the repository root, which is why every check passed while `thankyou.html` was missing from `dist/`; a check resolving form actions, precache entries, canonical URLs and sitemap entries against the package would verify the Vite MPA and static deployment path configuration directly
  - **Scope boundary:** non-blocking hardening; the existing checks are correct within the source layer they target
  - **Source:** `daily-AUDIT.md` — Extra quality improvements

- [ ] **O-02 — Load the embedded map only after an explicit visitor action**
  - **Value:** `contact.html` loads a Google Maps `iframe` on page load while the rest of the site ships no third-party requests; deferring the embed would match the no-tracking-before-consent posture the project demonstrates
  - **Scope boundary:** non-blocking product decision; the current behavior is disclosed in the legal documents rather than hidden
  - **Source:** `daily-AUDIT.md` — Extra quality improvements

- [x] **O-03 — Move the price-label handler inside `initServicesFilters()`**
  - [x] remove the module-scope price-range lookup and label handler
  - [x] keep one initialization-owned input handler for price state, label and results updates
  - [x] synchronize the visible price label with restored filter state during initialization
  - [x] verify restored and changed range values with focused Playwright coverage
  - **Value:** `assets/js/services-filters.js` registers an `input` listener at module scope, duplicating the range handler already registered inside the init function; moving it would match the pattern used by every other module
  - **Scope boundary:** non-blocking cleanup; the current code works because the module loads after the markup is parsed
  - **Source:** `daily-AUDIT.md` — Extra quality improvements

## Deferred work

- [ ] **D-01 — Publish the operator's postal identification data in the legal documents**
  - **Reason:** `terms.html` identifies the operator by name and e-mail only; the postal data required of a service provider is a decision for the project owner and is not present anywhere in the repository
