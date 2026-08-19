# TransLogix — Development Plan

**Last reviewed:** 2026-08-19
**Project type:** Static multi-page website (vanilla HTML, modular CSS, ES modules) with a Vite production build, Netlify static-hosting configuration, service worker and web manifest
**Plan status:** Active

## Planning principles

- The plan reflects the current verified state of the repository, not earlier documentation.
- Source files are canonical; the generated `dist/` package is never edited directly.
- A main item is checked only when every required subtask and its completion condition are satisfied.
- Completed significant changes are recorded separately in `CHANGELOG.md`.
- Findings converted from `daily-AUDIT.md` carry their source identifier for traceability.

## Current priorities

1. `PH5-09` — Assess the current clean-install dependency advisories and make an evidence-based risk decision.
2. `PH5-10` — Reconcile Lighthouse assertions that cannot produce a score while preserving applicable checks.

`PH6-02` remains blocked pending the owner's release version and date. `D-01` remains deferred pending the owner's postal identification data.

## Phase 1 — Contact conversion path

**Goal:** Make the contact form end on a real confirmation page in the deployed package, with exactly one confirmation mechanism.

- [x] **PH1-01 — Include `thankyou.html` in the deployable package** — **Priority:** Critical
  - [x] add `thankyou.html` to `rootFilesToCopy` in `scripts/build-dist.js`
  - [x] confirm the packaged root file set covers every page referenced by the form action (`contact.html`), the service-worker precache list (`sw.js`), the page canonical URLs and `sitemap.xml`
  - [x] rebuild the package locally and verify that `dist/thankyou.html` exists with the header and footer partials inlined and the minified asset references rewritten
  - [x] verify after deployment that `/thankyou.html` returns HTTP 200 on the production origin
  - **Completion condition:** a successful contact submission lands on the confirmation page in the deployed site and the service-worker install step no longer skips `/thankyou.html`

- [x] **PH1-02 — Consolidate the contact form confirmation path to one mechanism** — **Priority:** Medium
  - [x] decide which confirmation surface is authoritative: the `thankyou.html` redirect or the inline `#contact-success` message
  - [x] remove the unreachable path — either the `?success=1` branch in `assets/js/form.js` together with the `#contact-success` markup in `contact.html`, or the redirect target
  - [x] verify the contact Playwright spec still reflects the retained flow
  - **Completion condition:** exactly one success mechanism exists in source and it is the one the deployed form actually triggers
  - **Depends on:** `PH1-01`

## Phase 2 — Non-JavaScript rendering baseline

**Goal:** Ensure every indexable page renders its main content when the module graph does not execute.

- [x] **PH2-01 — Gate the reveal hidden state behind the `.js` class** — **Priority:** High
  - [x] scope `.reveal { opacity: 0; transform: … }` in `assets/css/modules/utilities.css` to the `.js` class, matching the pattern already used by `.js .nav__panel` in `assets/css/modules/header.css`
  - [x] confirm `assets/js/boot.js` sets the `js` class early enough that no visible flash is introduced on the six affected pages
  - [x] regenerate `assets/css/style.min.css` through `npm run build:css` and re-run `npm run qa:budget`
  - [x] verify with scripting disabled that `index.html`, `services.html`, `service.html`, `fleet.html`, `pricing.html` and `contact.html` render their main content
  - **Completion condition:** disabling JavaScript leaves all `.reveal` content visible, and the animation still runs when scripting is active

- [x] **PH2-02 — Provide a non-JavaScript baseline for the offer listing** — **Priority:** Medium
  - [x] add a static baseline or a `noscript` fallback for `#services-list` in `services.html`, following the `noscript` pattern already used in `service.html`
  - [x] keep `assets/data/services.json` as the single source of the offer data for the scripted path
  - [x] verify the page is never empty for a non-executing client and that `qa:html` still passes
  - **Completion condition:** `services.html` presents offer content without JavaScript, and the client-side filtering path is unchanged
  - **Depends on:** `PH2-01`

## Phase 3 — Published content and data integrity

**Goal:** Remove contradictions between machine-readable data, visible content and the legal documents.

- [x] **PH3-01 — Align the `Organization` structured data with the published address** — **Priority:** High
  - [x] replace the `PostalAddress` in the `index.html` JSON-LD block with the address used in `partials/footer.html` and `contact.html`, including a valid postal code
  - [x] re-run `npm run qa:jsonld`
  - **Completion condition:** the structured-data address matches every visible instance of the company address across the site

- [x] **PH3-02 — Resolve the conflicting footer delivery statistic** — **Priority:** High
  - [x] choose one authoritative figure for `data-stat="deliveries"` in `partials/footer.html`
  - [x] make the markup text and the `data-value` attribute agree, or drop the attribute so `assets/js/stats.js` leaves the static text alone
  - **Completion condition:** the displayed number no longer changes after script execution on any page that includes the footer

- [x] **PH3-03 — State the demonstration character in the entry consent dialog** — **Priority:** Medium
  - [x] add one sentence to the dialog text in `assets/js/site-consent.js` stating that TransLogix is a portfolio demonstration with a fictional brand, consistent with the wording already used in `terms.html`, `privacy.html` and `cookies.html`
  - [x] keep the existing links to the three legal documents and the current focus and acceptance behavior
  - [x] run `npm run build:js`; the command completed successfully and `assets/js/main.min.js` remained content-identical because the build reads only `assets/js/main.js`
  - **Completion condition:** the pre-entry dialog discloses the demo nature before acceptance, without changing the consent storage key or flow

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

- [x] **PH4-02 — Correct the heading level sequence on the system pages** — **Priority:** Medium
  - [x] resolve the `h1 → h3` skip on `404.html`, `offline.html` and `thankyou.html`, either by giving the footer statistics a level consistent with their `h2` section context or by supplying the missing section heading on those pages
  - [x] confirm the change does not alter heading order on the nine content pages, which already supply `h2` headings
  - [x] verify against the `pa11y-ci` URL set once dependencies are available
  - **Completion condition:** no heading level is skipped on any of the 12 source pages

- [x] **PH4-03 — Give `.legal-section h3` its own typographic step** — **Priority:** Low
  - [x] add a local `var(--fs-06)` rule for `.legal-section h3` in `assets/css/modules/pages.css`, next to the existing `.legal-section h2` rule
  - [x] verify the subsection hierarchy on `privacy.html` and `cookies.html`, and confirm `terms.html` has no `h3` subsection and requires no markup change
  - [x] regenerate `assets/css/style.min.css` and re-run `npm run qa:budget`
  - **Completion condition:** `h3` subsections in the legal documents render visually below their parent `h2`

- [x] **PH4-04 — Correct shared-header link names in the production package** — **Priority:** High
  - [x] give the canonical header brand link the single accessible name `TransLogix — strona główna`, while retaining empty alternatives for both decorative logo variants and the unchanged hidden visual text
  - [x] replace the generic `Start` wording with `Strona główna` in the canonical header and footer navigation, preserving the home destination and current-page behavior
  - [x] rebuild the Vite package, verify the responsive header and `aria-current` behavior, and confirm `link-name` and `link-text` scores of 1 on all five configured Lighthouse URLs
  - **Resolved outcome (2026-08-18):** the PH4-04 target audits and SEO category pass on all five URLs; the overall Lighthouse assertion command still exits with code 1 only for the separately scoped `PH5-10`, `PH5-11` and `PH5-12` findings
  - **Completion condition:** the built shared header gives the brand link a discernible accessible name, gives the home navigation target descriptive link text, preserves the visual design, and passes the Lighthouse `link-name` and `link-text` audits on all configured URLs
  - **Source:** PH6-01 clean-install release verification (2026-08-18)

## Phase 5 — Source-of-truth and QA contracts

**Goal:** Remove duplicated sources of truth and close the coverage gaps that let the packaging defect pass every existing check.

- [x] **PH5-01 — Resolve the duplicated markup and structured-data copies** — **Priority:** Medium
  - [x] confirm `templates/partials/` has no runtime or build consumer and retain `partials/` as the only shared-markup source
  - [x] confirm `assets/data/jsonld/*.json` has no runtime, build or generator consumer and retain inline HTML JSON-LD as the only structured-data source
  - [x] remove both redundant source groups and their obsolete QA discovery references
  - [x] update the relevant architecture, structure, QA and maintenance sections of `README.md`
  - **Completion condition:** every markup and structured-data file in the repository is either canonical or verified against its canonical source by a check

- [x] **PH5-02 — Correct stale asset references and extend asset verification** — **Priority:** Medium
  - [x] replace or remove the `image` values in `assets/data/services.json` that point at the non-existent `assets/img/solo.svg`, `refrigerated.svg` and `mega.svg` (seven of eight records)
  - [x] rename the orphaned `assets/img/fleet/mega/1 (1).webp` to the project naming pattern and reference it as the WebP `<source>` for the Mega card in `index.html` and `fleet.html`, or delete it
  - [x] extend `scripts/verify-assets.js` to cover `srcset` values and asset paths referenced from data files
  - [x] re-run `npm run assets:verify`
  - **Completion condition:** no asset reference in markup or data files points at a missing file, and the extended check fails when one does

- [x] **PH5-03 — Point Lighthouse CI at the deployable package** — **Priority:** Medium
  - [x] change `staticDistDir` in `lighthouserc.json` from the repository root to `dist/`, matching the Vite package served by the e2e configuration in `playwright.config.js`
  - [x] make the standalone `qa:lighthouse` workflow rebuild `dist/` before Lighthouse collection
  - [x] confirm the five collected URLs resolve inside the package after `npm run build`
  - [x] preserve one run, mobile execution, `lighthouse:no-pwa`, the category warning thresholds and temporary public storage upload; replace the unsupported `preset: "mobile"` value with the current Lighthouse-compatible `formFactor: "mobile"`
  - [x] run `npm run qa:lighthouse` and record its focused outcome: all five URLs were collected and uploaded, while retained `lighthouse:no-pwa` audit failures made the assertion step exit with code 1
  - [x] update the `lighthouserc.json` description in `README.md` (PL and EN sections) to state the new collection source
  - **Completion condition:** Lighthouse CI measures the deployed Vite layer, including Vite-processed production CSS/JavaScript and build-time inlined partials

- [x] **PH5-04 — Declare a line-ending policy for the repository** — **Priority:** Low
  - [x] add a root `.gitattributes` defining normalization for text files and binary handling for the tracked image, font and icon assets
  - [x] run `git add --renormalize .` after staging the policy; no existing tracked file required an index content change
  - [x] verify that `git status --short` reports only intentional PH5-04 changes, with no historical CRLF-only group
  - **Completion condition:** `git status` reflects real content changes only, with no line-ending noise

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

- [x] **PH5-08 — Align the `aria-current` end-to-end test with the Vite package** — **Priority:** High
  - [x] remove the direct dependency on the source-only `/assets/js/aria-current.js` module from the test
  - [x] exercise observable current-page marking through the normal bundled bootstrap in the generated production package
  - [x] retain root, extensionless and `.html` pathname coverage together with the exactly-one-link and fragment-link exclusions
  - [x] pass the focused Playwright test (1/1) and the canonical `npm run test:e2e` suite (13/13)
  - **Previous failure:** `npm run release-check` and one focused `npm run test:e2e` retry both finished with 12/13 tests passing because `tests/e2e/aria-current.spec.js` imported `/assets/js/aria-current.js`
  - **Root cause:** Playwright serves the generated `dist/` package, where Vite bundles the source module into a versioned production asset, so the source-only URL was not part of the production-package contract
  - **Completion condition:** the test exercises current-page marking through the production package without depending on a source-only module URL, retains coverage for extensionless and `.html` routes, and the canonical `npm run test:e2e` command passes

- [ ] **PH5-09 — Assess the clean-install dependency advisories** — **Priority:** Medium
  - **Observed issue:** lockfile-controlled `npm ci` reported 20 audit findings (5 moderate and 15 high) in the installed build and QA dependency graph
  - **Scope:** map the advisories to direct and transitive development dependencies, determine their actual exposure in this static-site toolchain, and perform any justified minimal lockfile-controlled remediation as a separate dependency task
  - **Completion condition:** a current `npm audit` has no unresolved findings, or every remaining finding has an explicit evidence-based risk decision, and the complete release gate still passes after any approved dependency changes
  - **Source:** `daily-AUDIT.md` — P1-01

- [ ] **PH5-10 — Reconcile Lighthouse assertions that cannot produce a score** — **Priority:** Medium
  - **Observed failure:** the retained `lighthouse:no-pwa` preset asserted `minScore` for `lcp-lazy-loaded`, `prioritize-lcp-image` and `non-composited-animations`, while Lighthouse returned no value (`NaN`, `scoreDisplayMode: error`) for each audit on all five URLs
  - **Scope:** review the preset against the pinned LHCI/Lighthouse behavior and change only assertions that are demonstrably unsupported or inapplicable, preserving the existing category thresholds and every applicable audit
  - **Completion condition:** all five reports are still collected from `dist/`, applicable assertions remain enforced, and unavailable audits no longer turn a successful collection into an uninformative hard failure
  - **Source:** `daily-AUDIT.md` — P2-01

- [x] **PH5-11 — Optimize fleet image delivery in the production package** — **Priority:** High
  - **Observed failure:** the mobile Lighthouse audit for `/fleet.html` scored 0.75 for performance with a 5,194 KiB transfer, 11.0 s LCP and 11.4 s Time to Interactive; 16 JPEGs failed optimized/modern-format checks and 20 images exposed 4,720 KiB of responsive-sizing savings
  - **Related evidence:** the same card-image delivery produced two responsive-sizing findings and 37 KiB of potential savings on the home page
  - [x] add deterministic 160, 320 and 640 px AVIF/WebP/JPG derivatives for the 16 fleet images used by cards and thumbnails, generated from the maintained 800×600 JPG sources
  - [x] serve measured responsive candidates on the fleet and home cards, retain the 800 px compatibility fallback for main cards, and give only the first above-the-fold fleet image eager high-priority delivery
  - [x] keep full-size lightbox images event-driven, prefer AVIF then WebP through a real `<picture>` fallback, and preserve selected-index, keyboard, focus, Escape, zoom and navigation behavior
  - [x] pass source asset/HTML checks, the production Vite build and the focused fleet Playwright suite (3/3)
  - **Resolved outcome (2026-08-19):** a pinned local LHCI collection from `dist/` scored `/fleet.html` at 1.00 performance with 357 KiB total transfer, 1.5 s LCP and 1.5 s Time to Interactive; `uses-responsive-images`, `uses-optimized-images` and `modern-image-formats` scored 1 with zero findings on both `/fleet.html` and `/`; the overall assertion command still exited with code 1 only for the separately scoped `PH5-10` unavailable audits and `PH5-12` offscreen-image findings
  - **Completion condition:** the built fleet and home card/gallery paths deliver right-sized modern image resources without eagerly transferring full-size lightbox media, while preserving the AVIF/WebP/JPG fallback and gallery behavior; the related Lighthouse image assertions pass and the fleet category reaches the configured performance threshold
  - **Source:** `daily-AUDIT.md` — P1-02

- [x] **PH5-12 — Avoid eager transfer of hidden and offscreen shared images** — **Priority:** Medium
  - **Observed failure:** Lighthouse reported offscreen-image savings on `/` (3 KiB), `/services.html` (78 KiB), `/contact.html` (3 KiB) and `/pricing.html` (194 KiB), led by the hidden dark logo variant and below-fold social or theme icons
  - [x] replace simultaneous light/dark logo and toggle images with one source selected by the existing theme module, retaining the early theme class, storage key, accessible toggle state and a static no-JavaScript fallback
  - [x] defer the four footer social images until their links enter the viewport, retaining native lazy loading, explicit dimensions, decorative alternatives and link names
  - [x] pass source HTML, asset, link, syntax, Vite build, package and budget checks plus the focused theme/shared-image Playwright suite (4/4)
  - **Resolved outcome (2026-08-19):** a pinned local LHCI collection from `dist/` gave `offscreen-images` score 1 with zero findings on `/`, `/services.html`, `/contact.html`, `/fleet.html` and `/pricing.html`; all configured category thresholds passed, while the assertion command still exited with code 1 only for the separately scoped `PH5-10` unavailable audits
  - **Completion condition:** non-visible theme variants and below-fold shared imagery are not transferred before use where avoidable, the four affected URLs pass the offscreen-image audit, and theme, footer, accessibility and no-JavaScript behavior remain unchanged
  - **Source:** `daily-AUDIT.md` — P2-02

## Phase 6 — Release verification

**Goal:** Confirm the full quality suite on a clean dependency install and settle the release record.

- [x] **PH6-01 — Run the complete `release-check` suite on a clean install** — **Priority:** Medium
  - [x] install dependencies from `package-lock.json`; the first sandboxed attempt failed with cache-access `EPERM`, while the one justified retry completed successfully without changing `package.json` or `package-lock.json`
  - [x] run `npm run release-check`, covering `qa:html`, `qa:jsonld`, `qa:links`, `qa:a11y`, `assets:verify`, `qa:budget`, `qa:package` and `test:e2e`
    - `qa:html`, `qa:jsonld`, `qa:links`, `qa:a11y` (12/12 URLs), `assets:verify`, `qa:budget` and `qa:package` passed
    - `test:e2e` failed deterministically at 12/13 tests; one focused retry reproduced the source-only `/assets/js/aria-current.js` import failure recorded as `PH5-08`
    - the initial `qa:a11y` server start reported transient `EADDRINUSE`, but all configured Pa11y URLs completed with zero errors and the aggregate continued
  - [x] complete `npm run qa:lighthouse` separately, since it is not part of `release-check`
    - the Vite production build, collection and temporary-public-storage upload passed for all five configured URLs; assertions then returned exit code 1
    - category scores (performance/accessibility/best practices/SEO) were: `/` 0.94/0.96/1.00/0.92; `/services.html` 0.97/0.97/1.00/0.92; `/contact.html` 0.99/0.96/1.00/0.92; `/fleet.html` 0.75/0.96/1.00/0.92; `/pricing.html` 0.99/0.97/1.00/0.92
    - deterministic assertion findings are recorded as `PH4-04`, `PH5-10`, `PH5-11` and `PH5-12`; category and metric warnings without a separate root cause remain recorded evidence rather than duplicate tasks
  - [x] record deterministic unresolved quality issues as new plan items under the phase that owns the affected area (`PH4-04`, `PH5-08` through `PH5-12`)
  - **Current outcome (2026-08-18):** complete — every intended current-tree gate has a recorded result; `release-check` and Lighthouse assertions both returned exit code 1, and all deterministic unresolved issues were separated from transient environment failures and warnings
  - **Completion condition:** a lockfile-controlled clean install completes without manifest changes; the canonical `release-check` has a recorded result for every current gate; the standalone Lighthouse build, five-URL collection, scores, warnings and assertions have a current-tree result; and deterministic unresolved issues are captured as separate plan work
  - **Depends on:** `PH1-01`, `PH2-01`

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

- [x] **O-02 — Load the embedded map only after an explicit visitor action**
  - [x] remove the automatically loaded Google Maps iframe from the initial Contact page markup
  - [x] require a dedicated explicit visitor action before creating the embedded map
  - [x] provide an accessible local placeholder while preserving the map area's layout
  - [x] synchronize the Google Maps disclosures in the privacy and cookies policies
  - [x] cover no request before activation and the intercepted request after activation in the focused Contact regression test
  - **Value:** `contact.html` previously loaded a Google Maps `iframe` on page load while the rest of the site ships no third-party requests; deferring the embed matches the no-tracking-before-consent posture the project demonstrates
  - **Scope boundary:** non-blocking product decision; the current behavior is disclosed in the legal documents rather than hidden

- [x] **O-03 — Move the price-label handler inside `initServicesFilters()`**
  - [x] remove the module-scope price-range lookup and label handler
  - [x] keep one initialization-owned input handler for price state, label and results updates
  - [x] synchronize the visible price label with restored filter state during initialization
  - [x] verify restored and changed range values with focused Playwright coverage
  - **Value:** `assets/js/services-filters.js` registers an `input` listener at module scope, duplicating the range handler already registered inside the init function; moving it would match the pattern used by every other module
  - **Scope boundary:** non-blocking cleanup; the current code works because the module loads after the markup is parsed

## Deferred work

- [ ] **D-01 — Publish the operator's postal identification data in the legal documents**
  - **Reason:** `terms.html` identifies the operator by name and e-mail only; the postal data required of a service provider is a decision for the project owner and is not present anywhere in the repository
  - **Source:** `daily-AUDIT.md` — P2-03
