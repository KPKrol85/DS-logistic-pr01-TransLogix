# Changelog

All significant changes to this project are documented in this file.

## [Unreleased]

### Added

- Added the initial TransLogix static multi-page front-end in a dedicated repository, covering the home, services, service detail, fleet, pricing, contact, thank-you, privacy, terms, cookies, `404`, and `offline` pages built with HTML, modular CSS, and Vanilla JavaScript ES modules.
- Added shared header and footer partials loaded at runtime by source pages and inlined into the `dist/` output during the build.
- Added data-driven service content sourced from `assets/data/services.json` for the services listing and the service detail page.
- Added the contact form with Netlify Forms attributes, a honeypot field, client-side validation with `aria-invalid` and `aria-describedby` error messaging, and a dedicated `thankyou.html` confirmation page.
- Added front-end interaction modules for navigation, active link state, theme switching, site consent, tabs, FAQ accordion, service and gallery filters, fleet card galleries, lightbox, reveal behavior, and footer statistics.
- Added accessibility mechanisms across the source pages, including skip links to `main`, landmark and heading structure, synchronized ARIA state for the mobile menu, tabs, accordion, lightbox and filters, `:focus-visible` styling, and `prefers-reduced-motion` handling in CSS and selected JS modules.
- Added a service worker (`sw.js`) with page precache, network-first navigation, stale-while-revalidate caching for `/assets/` responses, an `offline.html` fallback, and removal of caches other than the active `translogix-static-v3` version.
- Added a web app manifest (`assets/icons/site.webmanifest`) with icons, shortcuts, and screenshots.
- Added SEO metadata across the source pages, including canonical URLs, Open Graph and Twitter Card tags, inline JSON-LD, `robots.txt`, and `sitemap.xml`.
- Added static hosting configuration with `_redirects` rules for the extensionless `/services`, `/fleet`, `/pricing`, and `/contact` routes plus an `/index.html` to `/` redirect, and per-type `Cache-Control` policies in `_headers`.

### Build and Tooling

- Standardized the repository ignore rules to exclude dependencies, the generated `dist/` output, test and report artifacts, local agent worktrees, `.netlify` files, environment files, logs, and editor or operating system metadata, while keeping `assets/` and `package-lock.json` tracked.
- Added the production build pipeline: `build:css` resolves the CSS module imports and minifies the result into `assets/css/style.min.css` through PostCSS with cssnano, `build:js` strips comments and blank lines from `assets/js/main.js` into `assets/js/main.min.js`, and `build:dist` assembles `dist/` with inlined header and footer partials and references rewritten to the minified assets.
- Added the quality assurance script set covering source HTML validation, JSON-LD validation, local link checking, `pa11y-ci` accessibility runs, gzip performance budgets, asset verification, and Lighthouse CI, aggregated by the `qa` and `release-check` commands.

### Testing

- Added a Playwright end-to-end suite covering the contact form, fleet lightbox, mobile navigation, the offline page, the service worker offline fallback, and services filtering, with a `pretest:e2e` hook running the local link check first.

### Fixed

- Fixed the build package configuration to include `thankyou.html`, so the contact-form confirmation route is present in `dist/`.
- Consolidated the contact form on the verified `thankyou.html` redirect by removing the unreachable inline `?success=1` confirmation path.
- Gated the reveal animation's hidden initial state behind the document's `.js` class, keeping `.reveal` content visible when JavaScript does not execute.
- Added a non-JavaScript fallback to the services listing, keeping all eight offer names, routes, and a contact path available when the client-side renderer does not run.
- Aligned the home-page `Organization` structured-data address with the published company address used on the contact page and in the canonical footer.
- Removed the conflicting footer deliveries `data-value`, keeping the published `612+` text as the single authoritative value before and after JavaScript initialization.
- Added a pre-entry disclosure to the site-consent dialog stating that TransLogix is a demonstration portfolio project and the presented brand and company are fictional.
- Aligned the required contact-form acknowledgement with the processing purpose and legal basis stated in the privacy policy.
- Corrected current-page navigation marking so the extensionless and `.html` forms of the hosted routes resolve to the same `aria-current="page"` state without treating fragment links as page-level matches.

### Changed

- Removed the unused `templates/partials/` and `assets/data/jsonld/` copies, leaving `partials/` and inline HTML JSON-LD as the respective canonical sources and aligning source-file discovery in QA tooling.
- Rewrote the privacy policy, cookie policy, and terms of service as complete documents adapted from the KP_Code legal templates, aligning the disclosures with the site's actual behavior (Netlify-hosted form handling, embedded Google map, browser-only pricing calculators, browser storage keys, no analytics), stating that TransLogix is a fictional brand presented in a demonstration project, and removing the embedded template comments and unresolved variants from the published pages.

### Security

- Added security response headers in `_headers`, including a restrictive Content-Security-Policy, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, cross-origin isolation headers, and `Strict-Transport-Security`.

### Documentation

- Adapted the KP_Code proprietary license for TransLogix in Polish and English by applying verified project metadata and removing the template instructions.
- Added a bilingual (PL/EN) `README.md` documenting the project overview, tech stack, structure, build pipeline, deployment files, accessibility and SEO mechanisms, QA commands, and the rule that source files are canonical while `dist/`, `assets/css/style.min.css`, and `assets/js/main.min.js` are generated.
