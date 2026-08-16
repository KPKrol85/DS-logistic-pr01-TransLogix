# TransLogix

## PL

### Przegląd projektu

TransLogix to statyczny, wielostronicowy front-end dla serwisu transportowo-logistycznego B2B. Projekt jest częścią workspace `kp-code-playground` i jest opisany w metadanych pakietu jako realizacja KP_Code Digital Studio.

Repozytorium nie używa frameworka front-endowego ani backendu aplikacyjnego. Warstwa źródłowa opiera się na stronach HTML, modularnym CSS i Vanilla JavaScript w modułach ES. Pliki źródłowe są kanoniczne; `dist/`, `assets/css/style.min.css` i `assets/js/main.min.js` są generowane przez pipeline builda.

### Kluczowe funkcje

- Strony źródłowe dla: home, services, service detail, fleet, pricing, contact, privacy, terms, cookies, thank you, 404 i offline.
- Wspólne partiale nagłówka i stopki ładowane w źródłach oraz inline'owane do `dist/` podczas builda.
- Moduły JS dla nawigacji, aktywnego stanu linków, przełącznika motywu, zgody użytkownika, reveal, tabs, FAQ accordion, formularzy, filtrów, galerii floty, lightboxa, szczegółów usługi i statystyk stopki.
- Dane usług w `assets/data/services.json`, używane przez listę usług i stronę szczegółów usługi.
- Formularz kontaktowy z atrybutami Netlify Forms, honeypotem i walidacją klienta.
- Service worker z precache stron, fallbackiem offline i cache'owaniem assetów.
- Manifest aplikacji z ikonami, skrótami i screenshotami.

### Stack technologiczny

Runtime:

- HTML
- CSS z modularnym entrypointem `assets/css/style.css`
- Vanilla JavaScript jako ES modules
- Service Worker API
- Web App Manifest

Build i QA:

- Node.js / npm
- PostCSS, `postcss-import`, Autoprefixer, cssnano
- `html-validate`
- `pa11y-ci`
- Playwright
- Lighthouse CI
- `http-server`
- Sharp

### Struktura projektu

```text
.
├── *.html                     # źródłowe strony root
├── assets/
│   ├── css/
│   │   ├── style.css          # źródłowy entrypoint CSS
│   │   └── modules/           # settings, base, layout, header, footer, components, utilities, pages
│   ├── data/                  # services.json i pliki JSON-LD
│   ├── fonts/                 # lokalne fonty
│   ├── icons/                 # favicony, manifest i ikony aplikacji
│   ├── img/                   # obrazy strony, OG images, screenshoty i SVG
│   └── js/                    # moduły interakcji front-end
├── partials/                  # źródłowy header i footer
├── templates/partials/        # kopie szablonowe partiali
├── scripts/                   # build, walidacja i weryfikacja
├── tests/e2e/                 # testy Playwright
├── dist/                      # generowany output builda
├── _headers                   # nagłówki dla hostingu statycznego
├── _redirects                 # reguły przekierowań/przepisania ścieżek
├── robots.txt
├── sitemap.xml
└── sw.js
```

### Instalacja i konfiguracja

```bash
npm install
```

Zależności developerskie są zdefiniowane w `package.json` i zablokowane w `package-lock.json`.

### Development lokalny

Projekt nie ma osobnego skryptu `dev`. Źródła do edycji znajdują się głównie w:

- root `*.html`
- `partials/`
- `assets/css/modules/`
- `assets/js/`
- `assets/data/`
- `scripts/`

Podgląd wygenerowanego `dist/`:

```bash
npm run preview:dist
```

### Build produkcyjny

```bash
npm run build
```

Skrypty builda:

- `npm run build:css` generuje `assets/css/style.min.css` z `assets/css/style.css`.
- `npm run build:js` generuje `assets/js/main.min.js`.
- `npm run build:assets` uruchamia build CSS i JS.
- `npm run build:dist` buduje `dist/`, kopiuje pliki root i `assets/`, inline'uje partiale oraz przepisuje referencje na minifikowane assety.
- `npm run clean` usuwa `dist/`.

### Deployment

Repozytorium zawiera pliki wspierające hosting statyczny:

- `_headers` z nagłówkami bezpieczeństwa, CSP i politykami cache.
- `_redirects` z regułami dla `/services`, `/fleet`, `/pricing`, `/contact` i `/index.html`.
- `robots.txt` wskazujący `sitemap.xml`.
- `sitemap.xml` z publicznymi adresami stron.
- `sw.js` oraz `assets/icons/site.webmanifest`.

### Dostępność

W kodzie są zaimplementowane wzorce dostępnościowe:

- skip linki do `main`;
- semantyczne sekcje, landmarki, nagłówki i nawigacje;
- ARIA dla menu mobilnego, tabs, accordion, lightboxa, filtrów i regionów dynamicznych;
- `aria-invalid`, `aria-describedby` i komunikaty błędów w formularzach;
- globalne i komponentowe style `:focus-visible`;
- obsługa `prefers-reduced-motion` w CSS i wybranych modułach JS;
- konfiguracja `pa11y-ci` dla stron root.

### SEO

Źródła zawierają:

- tytuły stron i meta description;
- canonical URLs na stronach biznesowych i prawnych;
- Open Graph i Twitter Card metadata;
- inline JSON-LD w stronach HTML;
- pliki JSON-LD w `assets/data/jsonld/`;
- `robots.txt`;
- `sitemap.xml`;
- obrazy OG w `assets/img/og-img/`.

### Wydajność

Repozytorium zawiera wykrywalne mechanizmy wydajnościowe:

- minifikacja CSS i JS w pipeline builda;
- budżety gzip dla `assets/css/style.min.css` i grafu modułów `assets/js/main.min.js`;
- lokalne fonty ładowane przez `@font-face` z `font-display: swap`;
- obrazy w formatach AVIF, WebP, JPG, PNG i SVG;
- `image-set()` dla hero images;
- `loading="lazy"` i jawne wymiary na wielu obrazach;
- service worker z precache i runtime cachingiem assetów.

### Quality Assurance

Główne komendy:

```bash
npm run qa
npm run release-check
npm run test:e2e
```

Kontrole szczegółowe:

```bash
npm run qa:html
npm run qa:jsonld
npm run qa:links
npm run qa:a11y
npm run qa:budget
npm run qa:lighthouse
npm run assets:verify
```

Zakres:

- `qa` uruchamia walidację HTML, JSON-LD, linków lokalnych i dostępności.
- `release-check` uruchamia `qa`, `assets:verify`, `qa:budget` i `test:e2e`.
- `test:e2e` uruchamia Playwright na zbudowanym `dist/`.
- Testy E2E obejmują formularz kontaktowy, lightbox floty, nawigację mobilną, stronę offline, service worker/offline fallback i filtrowanie usług.
- `qa:lighthouse` używa konfiguracji Lighthouse CI dla strony głównej, usług i kontaktu.

### Utrzymanie projektu

- Edytuj źródła, nie artefakty generowane.
- Nie edytuj ręcznie `dist/`, `assets/css/style.min.css` ani `assets/js/main.min.js`.
- Zmiany w CSS utrzymuj w `assets/css/modules/`; kolejność importów definiuje `assets/css/style.css`.
- Zmiany w interakcjach utrzymuj w modułach `assets/js/`, a inicjalizację w `assets/js/main.js`.
- Zmiany w nagłówku i stopce utrzymuj w `partials/`.
- Po zmianach w HTML, assetach, ścieżkach lub service workerze uruchom odpowiednie skrypty QA z `package.json`.

### Licencja

Projekt jest proprietary. `package.json` deklaruje `UNLICENSED`, a `LICENSE` zastrzega wszystkie prawa i ogranicza użycie do celów portfolio, referencyjnych i code review bez udzielenia licencji.

## EN

### Project Overview

TransLogix is a static multi-page front-end for a B2B transport and logistics website. The project is part of the `kp-code-playground` workspace and is identified in package metadata as a KP_Code Digital Studio build.

The repository does not use a front-end framework or an application backend. The source layer is built with HTML pages, modular CSS, and Vanilla JavaScript ES modules. Source files are canonical; `dist/`, `assets/css/style.min.css`, and `assets/js/main.min.js` are generated by the build pipeline.

### Key Features

- Source pages for home, services, service detail, fleet, pricing, contact, privacy, terms, cookies, thank you, 404, and offline.
- Shared header and footer partials loaded in source pages and inlined into `dist/` during the build.
- JS modules for navigation, active link state, theme toggle, user consent, reveal behavior, tabs, FAQ accordion, forms, filters, fleet galleries, lightbox, service details, and footer stats.
- Services data in `assets/data/services.json`, used by the services list and service detail page.
- Contact form with Netlify Forms attributes, honeypot field, and client-side validation.
- Service worker with page precache, offline fallback, and asset caching.
- Web app manifest with icons, shortcuts, and screenshots.

### Tech Stack

Runtime:

- HTML
- CSS with the modular entrypoint `assets/css/style.css`
- Vanilla JavaScript as ES modules
- Service Worker API
- Web App Manifest

Build and QA:

- Node.js / npm
- PostCSS, `postcss-import`, Autoprefixer, cssnano
- `html-validate`
- `pa11y-ci`
- Playwright
- Lighthouse CI
- `http-server`
- Sharp

### Project Structure

```text
.
├── *.html                     # root source pages
├── assets/
│   ├── css/
│   │   ├── style.css          # source CSS entrypoint
│   │   └── modules/           # settings, base, layout, header, footer, components, utilities, pages
│   ├── data/                  # services.json and JSON-LD files
│   ├── fonts/                 # local fonts
│   ├── icons/                 # favicons, manifest, and app icons
│   ├── img/                   # site images, OG images, screenshots, and SVG
│   └── js/                    # front-end interaction modules
├── partials/                  # source header and footer
├── templates/partials/        # template copies of partials
├── scripts/                   # build, validation, and verification
├── tests/e2e/                 # Playwright tests
├── dist/                      # generated build output
├── _headers                   # headers for static hosting
├── _redirects                 # redirect/rewrite rules
├── robots.txt
├── sitemap.xml
└── sw.js
```

### Setup and Installation

```bash
npm install
```

Development dependencies are declared in `package.json` and locked in `package-lock.json`.

### Local Development

The project has no dedicated `dev` script. Source files are primarily located in:

- root `*.html`
- `partials/`
- `assets/css/modules/`
- `assets/js/`
- `assets/data/`
- `scripts/`

Preview the generated `dist/` output:

```bash
npm run preview:dist
```

### Production Build

```bash
npm run build
```

Build scripts:

- `npm run build:css` generates `assets/css/style.min.css` from `assets/css/style.css`.
- `npm run build:js` generates `assets/js/main.min.js`.
- `npm run build:assets` runs the CSS and JS builds.
- `npm run build:dist` builds `dist/`, copies root files and `assets/`, inlines partials, and rewrites references to minified assets.
- `npm run clean` removes `dist/`.

### Deployment

The repository contains files that support static hosting:

- `_headers` with security headers, CSP, and cache policies.
- `_redirects` with rules for `/services`, `/fleet`, `/pricing`, `/contact`, and `/index.html`.
- `robots.txt` pointing to `sitemap.xml`.
- `sitemap.xml` with public page URLs.
- `sw.js` and `assets/icons/site.webmanifest`.

### Accessibility

The codebase implements accessibility patterns:

- skip links to `main`;
- semantic sections, landmarks, headings, and navigation;
- ARIA for mobile menu, tabs, accordion, lightbox, filters, and dynamic regions;
- `aria-invalid`, `aria-describedby`, and form error messages;
- global and component-level `:focus-visible` styles;
- `prefers-reduced-motion` handling in CSS and selected JS modules;
- `pa11y-ci` configuration for root pages.

### SEO

The source files include:

- page titles and meta descriptions;
- canonical URLs on business and legal pages;
- Open Graph and Twitter Card metadata;
- inline JSON-LD in HTML pages;
- JSON-LD files in `assets/data/jsonld/`;
- `robots.txt`;
- `sitemap.xml`;
- OG images in `assets/img/og-img/`.

### Performance

The repository includes detectable performance mechanisms:

- CSS and JS minification in the build pipeline;
- gzip budgets for `assets/css/style.min.css` and the `assets/js/main.min.js` module graph;
- local fonts loaded through `@font-face` with `font-display: swap`;
- images in AVIF, WebP, JPG, PNG, and SVG formats;
- `image-set()` for hero images;
- `loading="lazy"` and explicit dimensions on many images;
- service worker precache and runtime asset caching.

### Quality Assurance

Main commands:

```bash
npm run qa
npm run release-check
npm run test:e2e
```

Focused checks:

```bash
npm run qa:html
npm run qa:jsonld
npm run qa:links
npm run qa:a11y
npm run qa:budget
npm run qa:lighthouse
npm run assets:verify
```

Scope:

- `qa` runs HTML, JSON-LD, local link, and accessibility validation.
- `release-check` runs `qa`, `assets:verify`, `qa:budget`, and `test:e2e`.
- `test:e2e` runs Playwright against the built `dist/`.
- E2E tests cover the contact form, fleet lightbox, mobile navigation, offline page, service worker/offline fallback, and services filtering.
- `qa:lighthouse` uses the Lighthouse CI configuration for the home, services, and contact pages.

### Project Maintenance

- Edit source files, not generated artifacts.
- Do not edit `dist/`, `assets/css/style.min.css`, or `assets/js/main.min.js` manually.
- Keep CSS changes in `assets/css/modules/`; import order is defined by `assets/css/style.css`.
- Keep interaction changes in `assets/js/` modules and initialization in `assets/js/main.js`.
- Keep header and footer changes in `partials/`.
- After HTML, asset, path, or service worker changes, run the relevant QA scripts from `package.json`.

### License

The project is proprietary. `package.json` declares `UNLICENSED`, and `LICENSE` reserves all rights and limits use to portfolio, reference, and code review purposes without granting a license.
