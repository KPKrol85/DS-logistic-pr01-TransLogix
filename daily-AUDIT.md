# Daily Front-End Audit — TransLogix

**Audit date:** 2026-08-19
**Project type:** Static multi-page website (vanilla HTML, modular CSS, ES modules) with a Vite production build, Netlify static-hosting configuration, service worker and web manifest
**Audit mode:** Current-state repository reconciliation with retained evidence from the PH6-01 clean-install and current PH5-11 Lighthouse verification

## Overall assessment

The repository has no current P0 finding. The canonical source/generated boundary is coherent: 12 maintained source pages feed a Vite 8 production build, shared partials are fetched only in the source-development path and inlined into `dist/`, and the production service worker receives the current Vite CSS and JavaScript asset URLs during the build.

The implementation and QA cycle resolved the former packaging, non-JavaScript, structured-data, accessibility, route-state, source-duplication, asset-reference, contact-flow, shared-header and fleet-image findings. Those completed changes are recorded in `CHANGELOG.md` and are not retained below as audit history.

Four current findings remain. The higher-priority risk is the unassessed clean-install dependency advisory set. Three lower-priority findings concern Lighthouse assertions that return no score, avoidable offscreen/shared-image transfers, and operator postal identification data that the project owner has not supplied. The first release record also remains blocked by an owner decision, but it is a release-planning constraint rather than an implementation defect.

## Active finding count

- **P0 — Critical:** 0
- **P1 — Important:** 1
- **P2 — Minor or deferred:** 3
- **Total active findings:** 4

## Verified current strengths

- `vite.config.mjs` defines all 12 maintained pages as explicit MPA inputs, empties and regenerates `dist/`, inlines the canonical `partials/`, copies the required stable deployment resources, and generates the production `sw.js` asset list from emitted CSS and JavaScript.
- `package.json` exposes Vite as the canonical `dev`, `build` and `preview` workflow. The production-package budget, package smoke check, Lighthouse collection and Playwright server all build or serve `dist/` rather than treating the source root as the deployed package.
- The PH6-01 source, JSON-LD, link, Pa11y, asset, budget and package checks passed. After the `aria-current` test was aligned with the Vite package, the canonical Playwright suite passed 13/13.
- The seven current Playwright spec files cover current-page marking, the deferred Google Maps flow and Netlify form contract, fleet lightbox behavior, mobile navigation, the offline page, service-worker offline fallback, and the services no-JavaScript/filter behavior.
- The Contact page initially renders a local Google Maps placeholder and disclosure. `assets/js/deferred-map.js` creates the external `iframe` only after explicit button activation, and the focused contact test verifies that no Google Maps request occurs before activation.
- The fleet and home cards use measured 160, 320 and 640 px AVIF/WebP/JPG derivatives, while the full 800 px gallery media remains event-driven for the lightbox; the current `/fleet.html` Lighthouse run scored 1.00 for performance and all three retained image-delivery audits passed with zero findings.
- `LICENSE` identifies TransLogix, the `KPKrol85/DS-logistic-pr01-TransLogix` repository and KP_Code ownership, and states the proprietary, all-rights-reserved status in Polish and English. Project npm metadata points to that authoritative document; third-party materials remain governed by their own licenses.

## P0 — Critical risks

No active P0 finding.

## P1 — Important issues

### [P1-01] Clean-install dependency advisories remain unassessed

- **Classification:** Dependency and release risk
- **Evidence:** `package-lock.json`; PH6-01 lockfile-controlled `npm ci` result recorded on 2026-08-18
- **Current state:** The clean install reported 20 audit findings (5 moderate and 15 high) in the development, build and QA dependency graph. The current lockfile has not received an advisory assessment or approved remediation, and `PH5-09` remains unchecked.
- **Risk:** Advisory severity alone does not establish runtime exposure for this static project, but leaving the graph unassessed prevents an evidence-based release risk decision.
- **Tracking:** `PLAN.md` — `PH5-09`.

## P2 — Minor or deferred issues

### [P2-01] Some retained Lighthouse preset assertions cannot produce a score

- **Classification:** QA contract mismatch
- **Evidence:** `lighthouserc.json`; PH6-01 Lighthouse assertion output
- **Current state:** Collection from `dist/` succeeds for all five configured URLs, but the retained `lighthouse:no-pwa` preset asserts `minScore` for `lcp-lazy-loaded`, `prioritize-lcp-image` and `non-composited-animations`. The pinned LHCI/Lighthouse path returned `NaN` with `scoreDisplayMode: error` for those audits on all five URLs. `PH5-10` remains unchecked.
- **Risk:** An unavailable audit is reported as a hard assertion failure, obscuring the distinction between an inapplicable tool result and an actionable regression.
- **Tracking:** `PLAN.md` — `PH5-10`.

### [P2-02] Hidden and offscreen shared images are transferred before use

- **Classification:** Production performance refinement
- **Evidence:** `partials/header.html`, `partials/footer.html`; PH6-01 mobile Lighthouse reports collected from `dist/`
- **Current state:** Lighthouse reported offscreen-image savings on `/` (3 KiB), `/services.html` (78 KiB), `/contact.html` (3 KiB) and `/pricing.html` (194 KiB), led by the hidden dark logo variant and below-fold shared imagery. `PH5-12` remains unchecked.
- **Risk:** The shared shell causes avoidable image transfer on four audited pages even when the assets are initially hidden or below the fold.
- **Tracking:** `PLAN.md` — `PH5-12`.

### [P2-03] Operator postal identification data is not present

- **Classification:** Deferred legal-document data gap
- **Evidence:** `terms.html` identifies the operator as KP_Code Digital Studio (Kamil Król) and provides `kontakt@kp-code.pl`, but no owner postal identification data; the displayed TransLogix address is explicitly fictional and not the operator's address
- **Current state:** The required owner-supplied postal data is absent from the repository, so it cannot be added safely during implementation or documentation maintenance. `D-01` remains unchecked and deferred.
- **Risk:** The operator-identification section cannot be completed until the project owner supplies the authoritative data.
- **Tracking:** `PLAN.md` — `D-01`.

## Current release constraints

- `PH6-02` remains **blocked**. The repository still declares package version `1.0.0`, has no first dated release section in `CHANGELOG.md`, and the owner has not supplied the release version and date required to reconcile and tag the first release.
- `D-01` remains **deferred** for the owner-data reason described in [P2-03].
- This audit does not treat a PLAN entry as resolved without corresponding implementation evidence.

## Current priority summary

1. `PH5-09` — dependency advisory assessment and risk decision.
2. `PH5-10` — Lighthouse assertion compatibility.
3. `PH5-12` — hidden and offscreen shared-image delivery.
4. `PH6-02` and `D-01` remain owner-blocked or deferred rather than actionable implementation work.

## Verification context and limits

- PH6-01 used a lockfile-controlled clean install. `package.json` and `package-lock.json` were confirmed unchanged by that install before this documentation and metadata reconciliation.
- The recorded PH6-01 `release-check` passed `qa:html`, `qa:jsonld` (11 blocks), `qa:links` (12 files), `qa:a11y` (12/12 URLs with zero errors), `assets:verify`, `qa:budget` and `qa:package`. Its historical `aria-current` E2E failure was subsequently fixed, and the focused test plus the canonical Playwright suite passed 1/1 and 13/13 respectively.
- The PH5-11 follow-up rebuilt `dist/` and collected all five configured mobile URLs with pinned LHCI 0.14.0. Public temporary upload was not authorized, so the identical collection and assertions were run with only the upload target overridden to local filesystem storage. `/fleet.html` scored 1.00/1.00/1.00/1.00 across performance/accessibility/best practices/SEO, with 357 KiB total transfer, 1.5 s LCP and 1.5 s Time to Interactive; the home and fleet responsive, optimized and modern-image audits each scored 1 with zero findings.
- The local LHCI assertion command returned exit code 1 only for the active `PH5-10` unavailable audits on all five URLs and `PH5-12` offscreen-image findings on `/`, `/services.html` and `/pricing.html`; no full release suite was run as part of PH5-11.
- Completed implementation history, including the former audit findings and optional improvements, is maintained in `CHANGELOG.md` rather than duplicated here.
