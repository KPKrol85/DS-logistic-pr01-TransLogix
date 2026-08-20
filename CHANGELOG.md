# Changelog

All significant changes to this project are documented in this file.

## [Unreleased]

### Changed

- Aligned the privacy and cookies policies with the active service-filter `sessionStorage`, the `translogix-static-v4` cache name, and the verified absence of analytics.
- Standardized `terms.html` against the canonical KP_Code Terms template using the verified TransLogix functionality, Netlify Forms, browser-storage, PWA, external-service, Operator-data, and proprietary-license contracts.
- Archived the completed implementation plan and zero-finding daily audit as dated records under `docs/plans/` and `docs/audits/`.

## [1.0.0] - 2026-08-19

### Added

- Added the initial TransLogix static multi-page front-end in a dedicated repository, covering the home, services, service detail, fleet, pricing, contact, thank-you, privacy, terms, cookies, `404`, and `offline` pages built with HTML, modular CSS, and Vanilla JavaScript ES modules.
- Added shared header and footer partials loaded at runtime by source pages and inlined into the `dist/` output during the build.
- Added data-driven service content sourced from `assets/data/services.json` for the services listing and the service detail page.
- Added the contact form with Netlify Forms attributes, a honeypot field, client-side validation with `aria-invalid` and `aria-describedby` error messaging, and a dedicated `thankyou.html` confirmation page.
- Added front-end interaction modules for navigation, active link state, theme switching, site consent, tabs, FAQ accordion, service and gallery filters, fleet card galleries, lightbox, reveal behavior, and footer statistics.
- Added accessibility mechanisms across the source pages, including skip links to `main`, landmark and heading structure, synchronized ARIA state for the mobile menu, tabs, accordion, lightbox and filters, `:focus-visible` styling, and `prefers-reduced-motion` handling in CSS and selected JS modules.
- Added a service worker (`sw.js`) with page precache, network-first navigation, stale-while-revalidate caching for `/assets/` responses, an `offline.html` fallback, and removal of caches other than the active version.
- Added a web app manifest (`assets/icons/site.webmanifest`) with icons, shortcuts, and screenshots.
- Added SEO metadata across the source pages, including canonical URLs, Open Graph and Twitter Card tags, inline JSON-LD, `robots.txt`, and `sitemap.xml`.
- Added static hosting configuration with `_redirects` rules for the extensionless `/services`, `/fleet`, `/pricing`, and `/contact` routes plus an `/index.html` to `/` redirect, and per-type `Cache-Control` policies in `_headers`.

### Build and Tooling

- Assessed the clean-install development dependency advisories and updated `cssnano`, `pa11y-ci`, `sharp`, `start-server-and-test` plus safe lockfile-resolved advisory paths, reducing `npm audit` from 20 findings (5 moderate and 15 high) to 6 high entries propagated from one accepted Puppeteer install-time `extract-zip` advisory; the clean install, complete release gate, Sharp image workflows and five-URL Lighthouse command passed after the update.
- Reconciled the Lighthouse CI assertion contract by overriding only the scoreless `lcp-lazy-loaded`, `prioritize-lcp-image`, and `non-composited-animations` preset audits to `off`, while retaining `lighthouse:no-pwa`, every other applicable preset assertion, and the existing category thresholds.
- Added a deployment-package smoke check that rebuilds `dist/` and validates built local form actions, static and Vite-generated service-worker precache targets, canonical paths, and sitemap paths, with standalone and `release-check` integration.
- Migrated Lighthouse CI from the repository source root to the Vite-generated `dist/` deployment package, with `qa:lighthouse` rebuilding the package before collecting the existing five production URLs and an explicit Lighthouse-compatible mobile form factor.
- Migrated performance-budget validation to the current Vite production package: `qa:budget` now rebuilds `dist/`, discovers all emitted CSS and JavaScript through the generated manifest, sums actual gzip sizes against the retained 12000 B and 18000 B limits, and replaces the obsolete pre-Vite build and tracked `.min` paths.
- Migrated the primary development and production workflow to Vite with explicit 12-page MPA inputs, development-time runtime partials, production-time partial inlining, versioned CSS/JS output, and controlled copying of static deployment resources into `dist/`.
- Added an explicit repository line-ending policy that normalizes project text to LF, keeps Windows batch files CRLF, excludes tracked binary image, font and icon formats from text normalization, and removes CRLF-only status noise.
- Standardized the repository ignore rules to exclude dependencies, the generated `dist/` output, test and report artifacts, local agent worktrees, `.netlify` files, environment files, logs, and editor or operating system metadata, while keeping `assets/` and `package-lock.json` tracked.
- Added the production build pipeline: `build:css` resolves the CSS module imports and minifies the result into `assets/css/style.min.css` through PostCSS with cssnano, `build:js` strips comments and blank lines from `assets/js/main.js` into `assets/js/main.min.js`, and `build:dist` assembles `dist/` with inlined header and footer partials and references rewritten to the minified assets.
- Added the quality assurance script set covering source HTML validation, JSON-LD validation, local link checking, `pa11y-ci` accessibility runs, gzip performance budgets, asset verification, and Lighthouse CI, aggregated by the `qa` and `release-check` commands.

### Testing

- Added a Playwright end-to-end suite covering the contact form, fleet lightbox, mobile navigation, the offline page, the service worker offline fallback, and services filtering, with a `pretest:e2e` hook running the local link check first.
- Completed the PH6-01 clean-install release verification, recording the passing source, accessibility, asset, budget and package gates together with the deterministic Vite-package E2E failure, five-URL Lighthouse results and separately scoped follow-up work.

### Fixed

- Prevented eager shared-image transfer by selecting only the active theme logo and toggle icon, deferring footer social SVGs until viewport entry, and retaining explicit dimensions, accessible link names and built no-JavaScript fallbacks.
- Optimized fleet image delivery with deterministic 160, 320 and 640 px AVIF/WebP/JPG variants, measured `srcset`/`sizes` contracts for fleet and home cards, modern-format thumbnails, and an event-driven AVIF → WebP → JPG lightbox path that keeps full-size media unloaded until the gallery opens.
- Gave the shared header brand link one explicit accessible home-page name and replaced generic `Start` home links in the shared header and footer with `Strona główna`, passing the Lighthouse `link-name` and `link-text` audits without changing the visual header design.
- Consolidated the services price-range handling inside its initializer and synchronized the visible label immediately with restored filter state.
- Fixed the build package configuration to include `thankyou.html`, so the contact-form confirmation route is present in `dist/`.
- Consolidated the contact form on the verified `thankyou.html` redirect by removing the unreachable inline `?success=1` confirmation path.
- Gated the reveal animation's hidden initial state behind the document's `.js` class, keeping `.reveal` content visible when JavaScript does not execute.
- Added a non-JavaScript fallback to the services listing, keeping all eight offer names, routes, and a contact path available when the client-side renderer does not run.
- Aligned the home-page `Organization` structured-data address with the published company address used on the contact page and in the canonical footer.
- Removed the conflicting footer deliveries `data-value`, keeping the published `612+` text as the single authoritative value before and after JavaScript initialization.
- Added a pre-entry disclosure to the site-consent dialog stating that TransLogix is a demonstration portfolio project and the presented brand and company are fictional.
- Aligned the required contact-form acknowledgement with the processing purpose and legal basis stated in the privacy policy.
- Corrected current-page navigation marking so the extensionless and `.html` forms of the hosted routes resolve to the same `aria-current="page"` state without treating fragment links as page-level matches.
- Aligned the `aria-current` E2E coverage with the Vite production package and removed its dependency on the source-only JavaScript module URL.
- Corrected the footer and system-page heading hierarchy by giving the statistics section a visually hidden `h2` heading above its existing `h3` values.
- Corrected the visual hierarchy of legal-document headings by rendering `.legal-section h3` below its parent `h2` with the adjacent lower typography token.
- Removed stale service-data image references, normalized and integrated the Mega WebP variant across the home card and synchronized gallery, and extended asset verification to responsive and runtime markup references plus project data JSON.

### Changed

- Published Kamil Król's real operator postal and contact details under the KP_Code Digital Studio brand across the legal documents, Contact page, shared footer and structured data, while keeping the TransLogix transport company explicitly fictional and the Google Maps embed visitor-activated.
- Deferred the Contact page's Google Maps embed until a dedicated visitor action and synchronized the privacy and cookies policies with the conditional loading behavior.
- Aligned the production service-worker precache with Vite by deriving the current versioned CSS and JavaScript paths from each build, generating `dist/sw.js` from the canonical source, and advancing the cache to `translogix-static-v4`.
- Removed the unused `templates/partials/` and `assets/data/jsonld/` copies, leaving `partials/` and inline HTML JSON-LD as the respective canonical sources and aligning source-file discovery in QA tooling.
- Rewrote the privacy policy, cookie policy, and terms of service as complete documents adapted from the KP_Code legal templates, aligning the disclosures with the site's actual behavior (Netlify-hosted form handling, embedded Google map, browser-only pricing calculators, browser storage keys, no analytics), stating that TransLogix is a fictional brand presented in a demonstration project, and removing the embedded template comments and unresolved variants from the published pages.

### Security

- Added security response headers in `_headers`, including a restrictive Content-Security-Policy, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, cross-origin isolation headers, and `Strict-Transport-Security`.

### Documentation

- Reconciled the project license metadata and the Polish and English README license sections with the existing proprietary KP_Code `LICENSE`, using `SEE LICENSE IN LICENSE` for the root npm package metadata without changing third-party licenses.
- Adapted the KP_Code proprietary license for TransLogix in Polish and English by applying verified project metadata and removing the template instructions.
- Added a bilingual (PL/EN) `README.md` documenting the project overview, tech stack, structure, build pipeline, deployment files, accessibility and SEO mechanisms, QA commands, and the rule that source files are canonical while `dist/`, `assets/css/style.min.css`, and `assets/js/main.min.js` are generated.
