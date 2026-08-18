# Daily Front-End Audit — TransLogix

**Audit date:** 2026-08-16
**Project type:** Static multi-page website (vanilla HTML, modular CSS, ES modules) with a Node-based build, Netlify static-hosting configuration, service worker and web manifest
**Audit mode:** Static repository review (plus one read-only request to the deployed origin)

## Overall assessment

The architecture is stable and the source/generated split is clean: canonical sources, a hand-written dependency-free build, and QA tooling proportionate to the project scope. All four dependency-free static checks in `scripts/` were executed during this audit and passed (asset verification, local-link check, JSON-LD validation, gzip budgets), and the tracked minified assets are newer than every one of their inputs.

Two areas carry real risk. The deployable package produced by `scripts/build-dist.js` still omits `thankyou.html`, and the production origin still answers 404 on that path, so the contact form — the primary conversion path — ends on a missing page. Separately, the reveal animation hides all main content behind `opacity: 0` with no non-JavaScript fallback, unlike the header, which is correctly gated behind the `.js` class; if the module graph does not execute, the six content pages render an empty page body between header and footer.

The remaining findings include a contradiction in the published footer statistic and drift or coverage gaps that create maintenance risk rather than current breakage. Apart from the build-package defect the project is ready for normal continued development.

## Verified strengths

- All four dependency-free QA scripts pass on the current tree: `verify-assets.js` ("All referenced assets exist"), `check-local-links.js` (12 files scanned), `validate-jsonld.js` (11 blocks), `check-budgets.js` (CSS 10 844 B gzip / 12 000 B limit; module graph 16 228 B gzip / 18 000 B limit across 17 files).
- Generated output is in sync with its sources: `assets/css/style.min.css` (2026-05-16 14:48) is newer than every file in `assets/css/modules/` (latest 14:46) and `assets/js/main.min.js` (15:10) is newer than `assets/js/main.js` (07:22); `build:dist` regenerates both before packaging.
- Defensive initialization across the JS layer: every exported `init*` returns early when its anchor elements are missing (`assets/js/nav.js:8`, `tabs.js`, `lightbox.js`, `stats.js:3`, `service-detail.js:16`, `gallery-filters.js:6`), and all `localStorage`/`sessionStorage` access is wrapped in `try/catch` (`theme-init.js:6`, `theme.js:4`, `site-consent.js:4`, `services-filters.js:3`).
- The data-driven views build DOM with `createElement`/`textContent`/`replaceChildren` rather than string injection (`assets/js/services-filters.js:28-76`, `service-detail.js:62-79`).
- The strict CSP in `_headers:10` (`script-src 'self'; style-src 'self'`, no `unsafe-inline`) is honoured by the markup: no `<style>` blocks, no `style="…"` attributes and no executable inline scripts exist in any source page or partial.
- The mobile-navigation breakpoint matches on both sides: `assets/js/nav.js:10` uses `matchMedia("(min-width: 900px)")` and `assets/css/modules/header.css:393` switches the nav to desktop layout at the same width; the closed panel is `visibility: hidden` (`header.css:181-186`), so its links are not reachable while `aria-hidden="true"` is set.
- Consistent indexing policy: `index,follow` on the nine public pages, `noindex,follow` on `404.html`, `offline.html` and `thankyou.html`, and `sitemap.xml` listing exactly the indexable set.
- Accessible interaction patterns implemented natively: roving `tabindex` with Arrow/Home/End handling (`assets/js/tabs.js:11-31`), lightbox with focus trap, `Escape` and focus return (`assets/js/lightbox.js:166-251`), skip link present on all 12 pages.
- No committed secrets, no `TODO`/`FIXME` markers and no debug logging in shipped source; the only `console` calls in `assets/js/` are two error paths in data loaders.

## P0 — Critical risks

### [P0-01] `thankyou.html` is excluded from the deployable package and 404s in production

- **Classification:** Defect
- **Evidence:** `scripts/build-dist.js:8-25` (`rootFilesToCopy`), `contact.html:110`, `sw.js:15`, `README.md:191`
- **Current behavior:** The contact form posts to `action="/thankyou.html"` (submitted natively via `form.submit()` in `assets/js/form.js:120-123`) and the service worker precaches `/thankyou.html`, but `rootFilesToCopy` lists every other root page and omits `thankyou.html`, so the file never reaches `dist/`. `README.md:191` describes the step as copying "the root HTML pages", and `README.md:218` documents `dist/` as the publish directory. A request to `https://transport-pr01-translogix.netlify.app/thankyou.html` returned HTTP 404 when re-checked on 2026-08-16.
- **Impact:** A visitor who successfully submits the contact form lands on a 404, so the primary conversion flow gives no confirmation. The page's own canonical URL and the service-worker precache entry point at an unavailable resource, and the SW install step logs a skipped asset on every deploy.
- **Recommended direction:** Include `thankyou.html` in the packaged root file set so the built output matches the pages the form, the service worker and the page's canonical reference already assume.

## P1 — Important issues worth fixing next

### [P1-01] Reveal animation hides all main content when the module graph does not run

- **Classification:** Defect
- **Evidence:** `assets/css/modules/utilities.css:2-6`, `assets/js/reveal.js:2-21`, `index.html:93,106,153,198,264`, contrasted with `assets/css/modules/header.css:181`
- **Current behavior:** `.reveal { opacity: 0; transform: translateY(18px); }` is declared unconditionally; visibility is restored only when `initReveal()` adds `is-visible`. The header solves the same problem correctly by scoping its hidden state to `.js .nav__panel`, and `boot.js` maintains the `no-js`/`js` class pair, but no CSS rule references `no-js` anywhere. Every main content block on `index.html` (5), `services.html` (2), `contact.html` (2), `pricing.html` (2), `fleet.html` (1) and `service.html` (1) carries the class.
- **Impact:** With scripting unavailable, or after any error that stops `assets/js/main.js` before `initReveal()` (it runs 25th in a single top-level sequence), the six content pages render header and footer around an empty body. The failure is silent and total for the page content, unlike the guarded per-module failures elsewhere in the codebase.
- **Recommended direction:** Scope the hidden state to the `.js` class as the header already does, so content is visible by default and only animated when scripting is active.

### [P1-02] Organization structured data states a different address than every visible instance — Resolved

- **Classification:** Contract mismatch
- **Historical evidence:** `index.html:64-70` versus `partials/footer.html:52-56` and `contact.html:93,103-104`
- **Previous behavior:** The `Organization` JSON-LD on the home page declared `ul. Przemysłowa 10`, `Warszawa`, `postalCode: "00-000"`, while the shared footer `<address>`, the contact page and the embedded map all used `ul. Marynarki Wojennej 12, 33-100 Tarnów`. `00-000` was a placeholder rather than a valid Polish postal code.
- **Previous impact:** The machine-readable business record contradicted the human-readable one on every page, which is exactly what structured-data consumers flag, and it undercut the realistic-business presentation the project is built to demonstrate.
- **Resolution (PH3-01, 2026-08-17):** Updated only the inline `Organization` `PostalAddress` in `index.html` to `ul. Marynarki Wojennej 12`, `33-100 Tarnów`, `PL`, matching the visible contact page and canonical footer address.
- **Verification:** `npm run qa:jsonld` passed after the correction; validation covered all 11 inline JSON-LD blocks.

### [P1-03] Footer statistic renders one number in markup and a different one after script execution — Resolved

- **Classification:** Defect
- **Historical evidence:** `partials/footer.html:8`, `assets/js/stats.js:17-23`
- **Previous behavior:** The markup contained `<h3 data-stat="deliveries" data-value="550">612+</h3>`. `initFooterStats()` read `data-value` and overwrote the text, so the figure visibly changed from `612+` to `550+` shortly after load, on every page that included the footer. Before PH5-01, the same conflicting pair was also present in the now-removed redundant partial copy.
- **Previous impact:** A published figure had two sources of truth in a single element and visibly changed in front of the visitor; whichever value was intended, the other was wrong site-wide.
- **Resolution (PH3-02, 2026-08-17):** Removed `data-value="550"` from the deliveries heading in the canonical footer, retaining the published static text `612+` as its single source of truth. The existing `initFooterStats()` fallback now parses `612` from that text and writes `612+` back without a visible change; the vehicles and countries values remain attribute-driven.
- **Verification:** `npm run qa:html` passed; a focused module test with a deliveries element lacking `data-value` confirmed `612+` before and after `initFooterStats()`; a source sweep found no active deliveries `data-value="550"` conflict.

## P2 — Minor refinements

### [P2-01] Duplicate copies of canonical markup and metadata exist with no check comparing them — Resolved

- **Classification:** Maintenance risk
- **Historical evidence:** `templates/partials/footer.html` versus `partials/footer.html`; `assets/data/jsonld/*.json` versus the inline blocks in the root pages; `scripts/validate-jsonld.js`
- **Previous behavior:** The unused partial copies were still included by `qa:html` and `assets:verify` and had drifted from `partials/`. The nine JSON-LD reference files duplicated inline blocks but had no runtime, build or generator consumer and no comparison check.
- **Previous impact:** Two sets of files looked authoritative while only one was active; edits to the canonical sources could silently leave the redundant copies stale.
- **Resolution (PH5-01, 2026-08-17):** Removed `templates/partials/` and `assets/data/jsonld/`. Runtime and production build continue to use `partials/header.html` and `partials/footer.html`; inline blocks in the root HTML pages are now the only maintained JSON-LD source. Removed the obsolete `templates/` discovery entries from `qa:html` and `assets:verify`, and synchronized the affected README sections.
- **Verification:** `npm run assets:verify`, `npm run qa:html` and `npm run qa:jsonld` all passed after the cleanup; JSON-LD validation covered 11 inline blocks.

### [P2-02] `h3` in legal sections renders at the same size as the `h2` above it — Resolved

- **Classification:** Defect
- **Historical evidence:** `assets/css/modules/pages.css:1421-1423`, `assets/css/modules/base.css:135-137`
- **Previous behavior:** `.legal-section h2` and the global `h3` rule both used `var(--fs-07)` (1.25rem), so the `h3` subsections present in `privacy.html` and `cookies.html` rendered at the same size as their parent headings. The current `terms.html` contains `.legal-section` sections with `h2` headings but no `h3` subsection.
- **Previous impact:** The affected legal-document hierarchy was visually flat, making the subsection structure harder to scan even though the underlying semantics were correct.
- **Resolution (PH4-03, 2026-08-17):** Added a local `.legal-section h3` rule using the adjacent lower token `var(--fs-06)`. `.legal-section h2` remains `var(--fs-07)`, while the global `h3` rule and typography tokens remain unchanged. No legal-document markup or wording was modified.
- **Verification:** `npm run build:css` passed and regenerated `assets/css/style.min.css`; `npm run qa:budget` passed at 10.60 KB / 11.72 KB for CSS and 15.98 KB / 17.58 KB for the JavaScript module graph; `git diff --check` passed. Static inspection confirmed four affected `h3` subsections in each of `privacy.html` and `cookies.html`, and none in `terms.html`.

### [P2-03] Heading level skips from `h1` to `h3` on the three system pages — Resolved

- **Classification:** Source-visible risk
- **Historical evidence:** `404.html`, `offline.html`, `thankyou.html` in combination with the former `partials/footer.html:8-18`
- **Previous behavior:** These pages contain a single `h1` and no `h2` in `main`, so the next heading in document order was the footer statistics `h3`, producing `h1 → h3 → h3 → h3 → h2 …`. The nine content pages were unaffected because their sections supplied `h2` headings.
- **Previous impact:** Screen-reader users navigating by heading level met a skipped level on all three system pages; those URLs are in the `pa11y-ci` set, so this was also a likely source of future QA noise.
- **Resolution (PH4-02, 2026-08-17):** Added the visually hidden `h2` heading `Kluczowe liczby TransLogix` with `id="footer-stats-title"` immediately inside the canonical footer statistics section and replaced its `aria-label` with `aria-labelledby="footer-stats-title"`. The existing statistic `h3` elements, their `data-stat` hooks, values and JavaScript behavior remain unchanged.
- **Verification:** A focused effective-document inspection with the canonical header and footer inserted found no skipped heading levels on any of the 12 source pages; `404.html`, `offline.html` and `thankyou.html` now transition `h1 → h2 → h3`. `npm run qa:html` passed. `npm run qa:a11y` completed the configured Pa11y checks with `12/12 URLs passed` and zero errors per page, then the wrapper returned an unrelated Windows `ps-tree` cleanup error while stopping the local server.

### [P2-04] Asset references in data files and image variants sit outside the coverage of `verify-assets.js` — Resolved

- **Classification:** Maintenance risk
- **Historical evidence:** `assets/data/services.json:35,57,79,101,123,145,167`; the former `scripts/verify-assets.js:88-105`; the former `assets/img/fleet/mega/1 (1).webp` versus the former `index.html:250-251` and `fleet.html:458-459`
- **Previous behavior:** Seven of the eight service records carried an `image` field pointing at `assets/img/solo.svg`, `refrigerated.svg` or `mega.svg`, none of which existed; nothing broke because `services-filters.js` resolved `service.icon || service.image` and every record had a valid `icon`. Separately, the Mega fleet picture was the only one without a WebP `<source>` — the variant existed under the download-artifact name `1 (1).webp` and was referenced nowhere. `verify-assets.js` extracted only `link[href]`, `script[src]`, `img[src]` and `source[src]`, so neither the JSON references nor `srcset` and runtime image metadata were checked.
- **Previous impact:** Dead references sat in the canonical service data waiting to surface if `icon` were ever dropped, WebP-capable browsers without AVIF support fell back to JPEG on one card, and the asset check gave more confidence than its coverage supported.
- **Resolution (PH5-02, 2026-08-17):** Removed the redundant `image` property from all eight service records after a repository-wide consumer check confirmed the valid `icon` paths remain authoritative. Renamed `assets/img/fleet/mega/1 (1).webp` to `assets/img/fleet/mega/1.webp` without changing its binary contents, added AVIF → WebP → JPG fallback to the home card, and added optional WebP source and thumbnail metadata to the Mega gallery. `fleet-card-gallery.js` now updates the optional WebP source together with the existing AVIF and JPG paths while AVIF/JPG-only galleries retain their previous behavior. Extended `verify-assets.js` to parse one or multiple `srcset` candidates, the focused `data-main-avif`, `data-main-webp` and `data-main-jpg` attributes, recursively discovered JSON string references under `assets/data/`, malformed JSON, the existing HTML references and `PRECACHE_URLS`.
- **Verification:** `node --check scripts/verify-assets.js` and `node --check assets/js/fleet-card-gallery.js` passed. `npm run assets:verify` passed with `All referenced assets exist.` A controlled fixture in `C:\tmp` containing the copied verifier and service JSON but no image files reported all eight missing icon paths and returned the expected `NEGATIVE_EXIT_CODE=1`; the fixture was then removed. The focused Playwright regression `npx playwright test tests/e2e/fleet-lightbox.spec.js -g "keeps Mega AVIF, WebP, and JPG sources synchronized"` passed 1/1. `npm run qa:html` passed.

### [P2-05] No `.gitattributes`, so 24 files permanently report as modified — Resolved

- **Classification:** Maintenance risk
- **Historical evidence:** `git status --short` (24 entries) versus an empty `git diff --ignore-cr-at-eol`; no `.gitattributes` in the repository root
- **Previous behavior:** The audited working tree showed 24 modified files whose only difference was line endings; the repository declared no line-ending normalization policy. The historical 24-file state did not reproduce in the PH5-04 worktree: its initial `git status --short` and `git diff --ignore-cr-at-eol` were both empty, although `git ls-files --eol` confirmed LF index content with CRLF working-tree text under the Windows Git configuration.
- **Previous impact:** Real uncommitted work could become indistinguishable from CRLF noise, making review, `git status` checks and future pre-commit tooling unreliable.
- **Resolution (PH5-04, 2026-08-17):** Added a root `.gitattributes` policy using `* text=auto eol=lf`, with `*.bat text eol=crlf` and binary handling for the tracked AVIF, ICO, JPG, PNG, WebP and WOFF2 formats. SVG and the web manifest remain normal text with useful diffs. The owner staged `.gitattributes` and ran `git add --renormalize .`; no existing tracked file required an index content change and no mass EOL diff was produced.
- **Verification:** `git diff --cached --stat` reported only `.gitattributes | 10 ++++++++++`. `git check-attr` confirmed LF text policy for representative HTML, CSS, JavaScript, JSON, Markdown, extensionless, SVG and manifest files; CRLF for the batch helper; and unset text/diff/merge attributes for representative binary assets. `git ls-files --eol` confirmed LF index content for tracked text with line endings, while binary assets remained `-text`. `git diff --ignore-cr-at-eol`, `git diff --cached --check` and the unstaged diff were empty before bookkeeping edits. Final status contains only intentional PH5-04 changes pending the owner's normal Git commit process.

### [P2-06] Current-page marking never applies on the extensionless routes the host serves — Resolved

- **Classification:** Contract mismatch
- **Historical evidence:** `_redirects:1-4`, `assets/js/aria-current.js:5-16`
- **Previous behavior:** `_redirects` rewrote `/services`, `/fleet`, `/pricing` and `/contact` to their `.html` counterparts with status 200, so the browser URL kept the extensionless form. `applyAriaCurrent()` compared each `href` against the last path segment, which was then `services` rather than `services.html`, so no link matched and no `aria-current="page"` was set.
- **Previous impact:** On the clean URLs the navigation lost its current-page indication for assistive technology and for the associated `aria-current` styling in header and footer.
- **Resolution (PH4-01, 2026-08-17):** Normalized the final pathname segment for both the browser location and page-level navigation links by mapping an empty segment to `index.html` and removing a trailing `.html` suffix. Links with fragments remain excluded, and the existing first-match rule still marks exactly one selected navigation link.
- **Verification:** `node --check assets/js/aria-current.js` and `git diff --check` passed. The focused Playwright test `npx playwright test tests/e2e/aria-current.spec.js` passed 1/1, covering `/`, `/index.html`, and both extensionless and `.html` forms of `/services`, `/fleet`, `/pricing` and `/contact`; every case had exactly one `aria-current="page"`, and the contact fragment links remained unmarked.

### [P2-07] The offer list has no non-JavaScript baseline

- **Classification:** Source-visible risk
- **Evidence:** `services.html:119` (`<div id="services-list" …></div>`), `assets/js/services-filters.js:92-111`, contrasted with `service.html:157-160`
- **Current behavior:** `services.html` ships an empty results container; all eight offers are rendered client-side from `assets/data/services.json`. A fetch failure is handled with an explanatory message, but with scripting unavailable the page shows filter controls and no offers. `service.html` is the only page in the project with a `<noscript>` fallback.
- **Impact:** The main offer page — indexable and listed in the sitemap — has no content for non-executing clients; combined with [P1-01] this page would be empty twice over.
- **Recommended direction:** Provide a static baseline list or a `noscript` message so the offer page is never empty.

### [P2-08] Lighthouse CI audits the source root instead of the deployable package — Resolved

- **Classification:** Contract mismatch
- **Historical evidence:** `lighthouserc.json:4` (`"staticDistDir": "."`), `playwright.config.js:24-28` (`npm run build && npx http-server dist`)
- **Previous behavior:** The e2e suite ran against the built `dist/`, while Lighthouse CI collected from the repository root, where pages loaded the unminified `style.css` with eight `@import` requests and fetched the header and footer at runtime.
- **Previous impact:** Performance, best-practice and SEO scores described a layer that was never deployed, so the assertion thresholds did not measure the shipped package.
- **Resolution (PH5-03, 2026-08-18):** Changed Lighthouse's static source to `dist/` and made `qa:lighthouse` run the Vite build before autorun, so Lighthouse, Playwright and deployment now use the same Vite-generated CSS/JavaScript and build-time inlined partials. Preserved the five URLs, one run, `lighthouse:no-pwa`, category thresholds and temporary public storage; the unsupported `preset: "mobile"` value was minimally replaced by the current Lighthouse-compatible `formFactor: "mobile"`.
- **Verification:** `npm run build` passed, and `/`, `/services.html`, `/contact.html`, `/fleet.html` and `/pricing.html` each returned HTTP 200 from a server rooted at `dist/`. `npm run qa:lighthouse` rebuilt the package, collected and uploaded all five URLs, then returned exit code 1 because the retained `lighthouse:no-pwa` preset produced detail-audit assertion failures. Category scores (performance/accessibility/best practices/SEO) were respectively `0.89/0.96/1.00/0.92`, `0.97/0.97/1.00/0.92`, `0.98/0.97/1.00/0.92`, `0.75/0.96/1.00/0.92` and `0.98/0.97/1.00/0.92`; category warnings were limited to performance on `/` and `/fleet.html` and SEO on all five URLs.

### [P2-09] The contact page carries a second, unreachable success mechanism

- **Classification:** Maintenance risk
- **Evidence:** `assets/js/form.js:238-244`, `contact.html:150`
- **Current behavior:** `initContactForm()` reveals `#contact-success` when the URL carries `?success=1`, but nothing in the repository ever produces that URL: the form action is `/thankyou.html` and `_redirects` contains no rule adding the parameter. The inline success message is therefore dead in the current flow.
- **Impact:** Two confirmation paths exist for one form while only one is live, so a maintainer can reasonably assume the inline message covers the success case that [P0-01] currently breaks.
- **Recommended direction:** Keep one confirmation path — either wire the query parameter into the submit flow or drop the unused branch and its markup.

### [P2-10] The entry consent dialog does not state the demo nature of the project — Resolved

- **Classification:** Contract mismatch
- **Historical evidence:** `assets/js/site-consent.js:20-38`
- **Previous behavior:** The blocking dialog shown before first use asked the visitor to accept the terms and linked to the three legal documents, but its own text said nothing about the site being a demonstration project with a fictional brand. That disclosure existed only inside `terms.html:192-194`, `privacy.html:119,126` and `cookies.html:85,112`.
- **Previous impact:** The project's only pre-entry disclosure surface could be accepted without the visitor ever seeing that TransLogix is a portfolio demonstration, which is the one thing the disclosure is meant to establish up front.
- **Resolution (PH3-03, 2026-08-17):** Added one concise sentence to the existing `#site-consent-desc` paragraph stating that TransLogix is a demonstration portfolio project by KP_Code Digital Studio and that the presented brand and transport-logistics company are fictional. The existing ARIA relationship, legal-document links, consent key, focus handling, Escape prevention and acceptance flow remain unchanged.
- **Verification:** `npm run build:js` passed; `assets/js/main.min.js` remained content-identical because the build processes only `assets/js/main.js`. `node --check assets/js/site-consent.js` and `git diff --check` passed, and focused static inspection confirmed that the disclosure is inside the element referenced by `aria-describedby`. No dedicated consent-dialog test exists in the current Playwright suite.

## Extra quality improvements

### Package-level smoke check for the built output

- **Evidence:** `scripts/build-dist.js:8-25` maintains an explicit file list, while `scripts/check-local-links.js:8` and `scripts/verify-assets.js:23-28` both resolve against the repository root and never against `dist/` — which is why all three checks passed while [P0-01] was live.
- **Potential value:** A check that resolves form actions, service-worker precache entries, canonical URLs and sitemap entries against the built package would have caught [P0-01] before deployment and would keep the packaging list honest as pages are added.
- **Scope boundary:** Optional hardening of the existing script set; the current checks are correct within the source layer they were written for.

### Consent-gated loading for the embedded map

- **Evidence:** `contact.html:101-107` loads a Google Maps `iframe` on page load; the site otherwise ships no analytics and no third-party requests, and the legal pages describe this behavior accurately.
- **Potential value:** Deferring the embed until the visitor asks for it would make the contact page's third-party footprint match the "no tracking before consent" posture the rest of the project demonstrates.
- **Scope boundary:** Optional; the current behavior is disclosed rather than hidden, and this is a product decision, not a code defect.

### Module boundaries in `services-filters.js`

- **Evidence:** `assets/js/services-filters.js:165-173` runs DOM lookups and registers an `input` listener at module scope, outside the exported `initServicesFilters()`, duplicating the range handler already registered inside it at line 148.
- **Potential value:** Moving the price-label update into the init function would match the pattern used by every other module and remove the second listener on the same control.
- **Scope boundary:** Optional cleanup; the current code works because the module is loaded after the markup is parsed.

## Verification performed

- Inspected: all 12 root HTML pages, `partials/`, `templates/partials/`, all eight CSS modules plus `style.css`, all 20 files in `assets/js/`, all 11 files in `scripts/`, `postcss.config.js` and both local PostCSS plugins, the seven Playwright specs and their helper, `package.json`, `playwright.config.js`, `.htmlvalidate.json`, `.pa11yci.json`, `lighthouserc.json`, `perf-budgets.json`, `sw.js`, `assets/icons/site.webmanifest`, `assets/data/services.json`, `assets/data/jsonld/*.json`, `_headers`, `_redirects`, `robots.txt`, `sitemap.xml`, `.gitignore`, `README.md`, `CHANGELOG.md`.
- Executed (read-only, dependency-free Node scripts already in the repository): `node scripts/verify-assets.js` (pass), `node scripts/check-local-links.js` (pass, 12 files), `node scripts/validate-jsonld.js` (pass, 11 blocks), `node scripts/check-budgets.js` (pass, both budgets under limit). None of these write files.
- Read-only Git checks: `git status --porcelain`, `git log --oneline`, `git diff --ignore-cr-at-eol --stat` (seven commits, empty content diff).
- Static analyses run against the file index: normalized comparison of every inline JSON-LD block against `assets/data/jsonld/` (all nine identical), heading-order extraction per page with the footer partial inlined, modification-time comparison of generated assets against their sources, reference sweep for orphaned image files, breakpoint inventory across all CSS modules.
- External verification: one request to the production origin on 2026-08-16 — `/thankyou.html` returned HTTP 404.
- Not executed: `qa:html`, `qa:a11y`, `qa:lighthouse` and `test:e2e`. `node_modules/` is absent from the working copy and installing dependencies is outside the scope of this audit. `npm run build` was not run because it writes `dist/` and regenerates tracked minified assets.
- Verification limitations: no browser rendering, so responsive behavior, contrast and actual assistive-technology output were not verified; accessibility findings are source-level only and no WCAG conformance claim is made. The repository contains no `netlify.toml`, so build and publish settings live host-side; the `dist/`-as-publish-directory conclusion rests on `README.md:218` plus the observed 404 for a page that exists in the source root and is missing from the package.

## Senior rating

**Rating:** 7/10

Source organization, build reproducibility and the QA script set are consistently strong for a static multi-page project: the four checks that can run without dependencies all pass, generated output is in sync with its inputs, the CSP is actually honoured by the markup, and the accessible interaction patterns are implemented natively rather than bolted on with ARIA. The rating is held back by one confirmed production defect on the primary conversion path caused by a hand-maintained packaging list, by a content layer that disappears entirely if scripting does not run, and by two published-data contradictions. Each is a small, well-scoped correction; none touches the core architecture.
