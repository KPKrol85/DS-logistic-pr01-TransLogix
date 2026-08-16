# Daily Front-End Audit — TransLogix

**Audit date:** 2026-08-16
**Project type:** Static multi-page website (vanilla HTML, modular CSS, ES modules) with a Node-based build, Netlify static-hosting configuration, service worker and web manifest
**Audit mode:** Static repository review (plus two read-only requests to the deployed origin)

## Overall assessment

The implementation is mature and internally consistent: source and generated layers are clearly separated, generated assets are currently in sync with their inputs, module initialization is defensive, and the QA tooling (html-validate, JSON-LD validation, local-link check, pa11y-ci over 12 URLs, gzip budgets, Playwright e2e against the built package) is proportionate to the project scope.

One blocker exists. The deployable package produced by `scripts/build-dist.js` omits `thankyou.html`, and the production origin confirms a 404 on that path — so the contact form, the site's primary conversion path, ends on a missing page. Everything else found is lower-impact: one metadata contradiction against visible content, one public figure with two sources of truth, and a set of duplication and coverage gaps that create drift risk rather than current breakage.

Apart from the build-package defect the project is ready for normal continued development.

## Verified strengths

- Source and generated layers are separated and currently synchronized: `assets/css/style.min.css` (mtime 2026-05-16 14:48) is newer than every file in `assets/css/modules/`, and `assets/js/main.min.js` is newer than `assets/js/main.js`; `build:dist` also regenerates both before packaging.
- Defensive initialization across the JS layer: every exported `init*` returns early when its anchor elements are absent (`assets/js/nav.js`, `tabs.js`, `lightbox.js`, `stats.js`, `service-detail.js`), and all `localStorage`/`sessionStorage` access is wrapped in `try/catch` (`assets/js/theme-init.js`, `theme.js`, `site-consent.js`, `services-filters.js`).
- Data-driven views build DOM safely with `createElement`/`textContent`/`replaceChildren` instead of string injection (`assets/js/service-detail.js`, `assets/js/services-filters.js:28-78`).
- The strict CSP in `_headers` (`script-src 'self'; style-src 'self'`, no `unsafe-inline`) is actually honoured by the markup: no `<style>` blocks, no `style="…"` attributes and no executable inline scripts exist in any source page.
- Consistent indexing policy: `index,follow` plus a canonical URL on all nine public pages, `noindex,follow` on `404.html`, `offline.html` and `thankyou.html`, and `sitemap.xml` listing exactly the indexable set.
- Accessible interaction patterns implemented natively: roving `tabindex` with Arrow/Home/End handling in `assets/js/tabs.js`, and a lightbox with focus trap, `Escape` handling and focus return in `assets/js/lightbox.js:160-250`.
- Build and QA scripts are dependency-free plain Node (`scripts/build-dist.js`, `build-js.js`, `check-local-links.js`, `verify-assets.js`, `validate-jsonld.js`), so the packaging step is reproducible without a bundler toolchain.
- No committed secrets, `TODO`/`FIXME` markers or debug logging in shipped source; the only `console` calls are progress output inside `scripts/` and error paths in the service worker and data loaders.

## P0 — Critical risks

### [P0-01] `thankyou.html` is excluded from the deployable package and 404s in production

- **Classification:** Defect
- **Evidence:** `scripts/build-dist.js:8-25` (`rootFilesToCopy`), `contact.html:110`, `sw.js:15`
- **Current behavior:** The contact form posts to `action="/thankyou.html"` and the service worker precaches `/thankyou.html`, but `rootFilesToCopy` in `scripts/build-dist.js` lists every other root page and omits `thankyou.html`, so the file is never copied into `dist/`. `README.md:218` documents `dist/` as the publish directory, and the deployed origin serves inlined partials (i.e. the `dist/` package). A request to `https://transport-pr01-translogix.netlify.app/thankyou.html` returned HTTP 404 when checked on 2026-08-16.
- **Impact:** A visitor who successfully submits the contact form is redirected to a 404 page, so the primary conversion flow gives no confirmation. The `thankyou.html` canonical URL and the sitemap-adjacent SW precache entry also point at an unavailable resource, and the SW install step logs a skipped asset on every deploy.
- **Recommended direction:** Include `thankyou.html` in the packaged root file set so the built output matches the pages the form, the service worker and the page's own canonical reference.

## P1 — Important issues worth fixing next

### [P1-01] Organization structured data states a different address than every visible instance

- **Classification:** Contract mismatch
- **Evidence:** `index.html:64-70` versus `partials/footer.html:54-60` and `contact.html:93`
- **Current behavior:** The `Organization` JSON-LD on the home page declares `ul. Przemysłowa 10`, `Warszawa`, `postalCode: "00-000"`, while the shared footer, the contact page and the embedded map all use `ul. Marynarki Wojennej 12, 33-100 Tarnów`. `00-000` is a placeholder rather than a valid Polish postal code.
- **Impact:** The site's machine-readable business record contradicts the human-readable one on every page, which is exactly the kind of inconsistency structured-data consumers flag; it also weakens the "realistic business" presentation the project is built to demonstrate.
- **Recommended direction:** Align the JSON-LD `PostalAddress` with the address used in the footer and on the contact page, including a valid postal code.

### [P1-02] Footer statistic renders one number in markup and a different one after script execution

- **Classification:** Defect
- **Evidence:** `partials/footer.html:8`, `assets/js/stats.js:17-24`
- **Current behavior:** The markup contains `<h3 data-stat="deliveries" data-value="550">612+</h3>`. `initFooterStats()` reads `data-value` and overwrites the text, so the figure visibly changes from `612+` to `550+` shortly after load, on every page that includes the footer.
- **Impact:** A public figure has two conflicting sources of truth in one element and visibly changes in front of the user; whichever value is intended, the other is wrong everywhere the footer appears.
- **Recommended direction:** Keep one authoritative value — either drive the markup from `data-value` or drop the attribute and let the static text stand.

## P2 — Minor refinements

### [P2-01] Duplicate copies of canonical markup and metadata exist with no check comparing them

- **Classification:** Maintenance risk
- **Evidence:** `templates/partials/footer.html` versus `partials/footer.html`; `assets/data/jsonld/*.json` versus the inline blocks in the root pages
- **Current behavior:** `templates/partials/` is not used by the runtime or by `scripts/build-dist.js`, but it is still validated by `qa:html` and `assets:verify` — and it has already drifted: the canonical footer wraps company data in `<address>`, uses `class="footer"` and the separator `|`, while the template copy has none of these. The nine files in `assets/data/jsonld/` are byte-equivalent to the inline JSON-LD today, but nothing compares them; `scripts/validate-jsonld.js:92` only reads root HTML.
- **Impact:** Two sets of files look authoritative while only one is; edits applied to the canonical copies silently leave the duplicates stale, and the drift is invisible to the existing QA scripts.
- **Recommended direction:** Either remove the unused copies or add a check that fails when a copy diverges from its canonical source.

### [P2-02] `h3` in legal sections renders at the same size as the `h2` above it

- **Classification:** Defect
- **Evidence:** `assets/css/modules/pages.css:1421-1424`, `assets/css/modules/base.css:135-137`
- **Current behavior:** `.legal-section h2` is set to `var(--fs-07)`, and the global `h3` rule uses the same `var(--fs-07)`. `privacy.html`, `cookies.html` and `terms.html` all use `h3` subsections, which therefore render identically to their parent headings.
- **Impact:** The document hierarchy on the three longest pages is visually flat, making the legal content harder to scan even though the underlying semantics are correct.
- **Recommended direction:** Give `.legal-section h3` its own step below `--fs-07`.

### [P2-03] Heading level skips from `h1` to `h3` on the three system pages

- **Classification:** Source-visible risk
- **Evidence:** `404.html`, `offline.html`, `thankyou.html` in combination with `partials/footer.html:8-18`
- **Current behavior:** These pages contain a single `h1` and no `h2` in `main`, so the next heading in document order is the footer statistics `h3`, producing the sequence `h1 → h3 → h3 → h3 → h2 …`. The nine content pages are unaffected because their sections supply `h2` headings.
- **Impact:** Screen-reader users navigating by heading level encounter a skipped level on all three system pages; these URLs are inside the `pa11y-ci` set, so it is also a likely source of future QA noise.
- **Recommended direction:** Give the footer statistics a heading level consistent with their `h2` section context, or add the missing section heading on the system pages.

### [P2-04] `services.json` references image files that do not exist, and asset verification cannot see them

- **Classification:** Maintenance risk
- **Evidence:** `assets/data/services.json:35,57,79` and four further records (`assets/img/solo.svg`, `assets/img/refrigerated.svg`, `assets/img/mega.svg`), `scripts/verify-assets.js:88-96`
- **Current behavior:** Seven of the eight service records carry an `image` field pointing at one of three SVG files that are not present in the repository. Nothing breaks today because `services-filters.js` resolves `service.icon || service.image` and every record has a valid `icon`. `verify-assets.js` extracts only `link[href]`, `script[src]`, `img[src]` and `source[src]`, so neither these JSON references nor any `srcset` value in the fleet and hero markup is verified.
- **Impact:** Dead references sit in the canonical service data waiting to surface if `icon` is ever removed, and the asset check gives more confidence than its actual coverage supports.
- **Recommended direction:** Remove or correct the stale `image` values, and extend the asset check to `srcset` and to referenced data files.

### [P2-05] No `.gitattributes`, so 24 files permanently report as modified

- **Classification:** Maintenance risk
- **Evidence:** `git status --short` (24 entries) versus an empty `git diff --ignore-cr-at-eol`; no `.gitattributes` in the repository root
- **Current behavior:** The working tree shows 24 modified files whose only difference is line endings; the repository declares no line-ending normalization policy.
- **Impact:** Real uncommitted work is indistinguishable from CRLF noise, which makes review, `git status` checks and any future pre-commit tooling unreliable.
- **Recommended direction:** Add a line-ending policy for text files so `git status` reflects actual content changes.

### [P2-06] Current-page marking never applies on the extensionless routes the host serves

- **Classification:** Contract mismatch
- **Evidence:** `_redirects:1-4`, `assets/js/aria-current.js:6-16`
- **Current behavior:** `_redirects` rewrites `/services`, `/fleet`, `/pricing` and `/contact` to their `.html` counterparts with status 200, so the browser URL keeps the extensionless form. `applyAriaCurrent()` compares `href` against the last path segment, which is then `services` rather than `services.html`, so no link matches and no `aria-current="page"` is set.
- **Impact:** On the clean URLs the navigation loses its current-page indication for assistive technology and for the associated styling.
- **Recommended direction:** Normalize both sides of the comparison so extensionless and `.html` paths resolve to the same key.

### [P2-07] The offer list has no non-JavaScript baseline

- **Classification:** Source-visible risk
- **Evidence:** `services.html:119` (`<div id="services-list" …></div>`), `assets/js/services-filters.js:92-104`
- **Current behavior:** `services.html` ships an empty results container; all eight offers are rendered client-side from `assets/data/services.json`. A fetch failure is handled with an explanatory message, but with scripting unavailable the page shows filter controls and no offers, and there is no `<noscript>` fallback anywhere in the project.
- **Impact:** The main offer page — an indexable, sitemap-listed URL — has no content for non-executing clients, while the rest of the site (after the build inlines the partials) degrades gracefully.
- **Recommended direction:** Provide a static baseline list or a `noscript` message so the offer page is never empty.

### [P2-08] Lighthouse CI audits the source root instead of the deployable package

- **Classification:** Contract mismatch
- **Evidence:** `lighthouserc.json:4` (`"staticDistDir": "."`), `playwright.config.js:24` (`npm run build && npx http-server dist`)
- **Current behavior:** The e2e suite runs against the built `dist/`, while Lighthouse CI collects from the repository root, where pages load the unminified `style.css` with eight `@import` requests and fetch the header and footer at runtime.
- **Impact:** Performance, best-practice and SEO scores describe a layer that is never deployed, so the assertion thresholds do not measure the shipped package.
- **Recommended direction:** Point the Lighthouse collection at the build output, consistent with the e2e configuration.

### [P2-09] The entry consent dialog does not state the demo nature of the project

- **Classification:** Contract mismatch
- **Evidence:** `assets/js/site-consent.js:20-40`
- **Current behavior:** The blocking dialog shown before first use asks the visitor to accept the terms and links to the three legal documents, but its own text says nothing about the site being a demonstration project with a fictional brand. That disclosure exists only inside `terms.html:192-194`, `privacy.html:119-126` and `cookies.html:85`.
- **Impact:** The project's only pre-entry disclosure surface can be accepted without the visitor ever seeing that TransLogix is a portfolio demonstration, which is the one thing the disclosure is meant to establish up front.
- **Recommended direction:** State the demo/portfolio character in one sentence in the dialog itself, keeping the links to the full documents.

## Extra quality improvements

### Package-level smoke check for the built output

- **Evidence:** `scripts/build-dist.js` maintains an explicit file list, and `scripts/check-local-links.js` and `scripts/verify-assets.js` both resolve against the repository root, never against `dist/`.
- **Potential value:** A check that resolves form actions, service-worker precache entries, canonical URLs and sitemap entries against the built package would have caught [P0-01] before deployment and would keep the packaging list honest as pages are added.
- **Scope boundary:** Optional hardening of the existing script set; the current checks are correct within the source layer they were written for.

### Consent-gated loading for the embedded map

- **Evidence:** `contact.html:101-107` loads a Google Maps `iframe` on page load; the site otherwise ships no analytics and no third-party requests, and the legal pages describe this behavior accurately.
- **Potential value:** Deferring the embed until the visitor asks for it would make the contact page's third-party footprint match the "no tracking before consent" posture the rest of the project already demonstrates.
- **Scope boundary:** Optional; the current behavior is disclosed rather than hidden, and this is a product decision, not a code defect.

### Module boundaries in `services-filters.js`

- **Evidence:** `assets/js/services-filters.js:165-173` runs DOM lookups and registers an `input` listener at module scope, outside the exported `initServicesFilters()`, duplicating the range handler already registered inside it.
- **Potential value:** Moving the price-label update into the init function would make the module's side effects match the pattern used by every other module and remove the second listener on the same control.
- **Scope boundary:** Optional cleanup; the current code works because the module is loaded after the markup is parsed.

## Verification performed

- Inspected: all 12 root HTML pages, `partials/`, `templates/partials/`, all eight CSS modules plus `style.css`, all 20 files in `assets/js/`, all 11 files in `scripts/`, all seven Playwright specs, `package.json`, `postcss.config.js`, `playwright.config.js`, `.htmlvalidate.json`, `.pa11yci.json`, `lighthouserc.json`, `perf-budgets.json`, `sw.js`, `assets/icons/site.webmanifest`, `assets/data/services.json`, `assets/data/jsonld/*.json`, `_headers`, `_redirects`, `robots.txt`, `sitemap.xml`, `.gitignore`, `README.md`, `CHANGELOG.md`.
- Read-only Git checks executed: `git status --short`, `git log --oneline`, `git tag`, `git diff --ignore-cr-at-eol --stat` (six commits, no tags, empty content diff).
- Static analyses executed against the repository file index: resolution of every `src`/`href`/`srcset`/`data-*` reference in HTML, `sw.js` and the manifest (no broken references); byte comparison of inline JSON-LD against `assets/data/jsonld/` (identical); heading-order and duplicate-`id` extraction per page with partials inlined; modification-time comparison of generated assets against their sources.
- External verification: two requests to the production origin on 2026-08-16 — `/` (responds, partials inlined) and `/thankyou.html` (HTTP 404).
- Not executed: `qa:html`, `qa:jsonld`, `qa:links`, `qa:a11y`, `qa:budget`, `qa:lighthouse`, `assets:verify` and `test:e2e`. `node_modules/` is absent in the working copy and installing dependencies is outside the scope of this audit. `npm run build` was not run because it writes `dist/` and regenerates tracked minified assets.
- Verification limitations: no browser rendering, so responsive behavior, contrast and actual screen-reader output were not verified; accessibility findings are source-level only and no WCAG conformance claim is made. The repository contains no `netlify.toml`, so build and publish settings live host-side; the `dist/`-as-publish-directory conclusion rests on `README.md:218` plus the observed production HTML, which serves statically inlined partials.

## Senior rating

**Rating:** 7/10

Architecture, source organization and QA tooling are consistently strong for a static multi-page project, generated output is in sync with its sources, and the accessible interaction patterns are implemented natively rather than bolted on with ARIA. The rating is held back by one confirmed production defect on the primary conversion path caused by a hand-maintained file list in the packaging script, by a metadata contradiction and a duplicated public figure, and by verification gaps — asset checks blind to `srcset` and data files, Lighthouse pointed at the source layer, and duplicated markup and metadata copies that nothing compares. None of these affect the core architecture, and all are small, well-scoped corrections.
