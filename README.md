# TransLogix

## PL

### Przegląd projektu

TransLogix to statyczny, wielostronicowy front-end serwisu transportowo-logistycznego B2B, przygotowany przez KP_Code Digital Studio (`package.json`, `LICENSE`, stopka serwisu). Treść stron jest w języku polskim (`<html lang="pl">`).

Serwis prezentuje realistyczne doświadczenie firmowe, ale jest projektem demonstracyjnym: dokumenty prawne (`terms.html`, `privacy.html`, `cookies.html`) wprost informują, że TransLogix jest marką fikcyjną, a prezentowana firma transportowa nie istnieje.

Repozytorium nie zawiera frameworka front-endowego ani backendu aplikacyjnego. Warstwa źródłowa to strony HTML, modularny CSS i Vanilla JavaScript w modułach ES. Pliki źródłowe są kanoniczne; `dist/`, `assets/css/style.min.css` i `assets/js/main.min.js` powstają w pipeline builda.

Repozytorium: <https://github.com/KPKrol85/DS-logistic-pr01-TransLogix> (adres zadeklarowany w `LICENSE`).

### Wersja online

<https://transport-pr01-translogix.netlify.app/>

Adres jest zadeklarowany w źródłach projektu (`link rel="canonical"`, `sitemap.xml`, `robots.txt`, `terms.html`). Podczas przygotowania tej dokumentacji adres odpowiadał i serwował stronę TransLogix.

### Kluczowe funkcje

- Dwanaście stron źródłowych: `index.html`, `services.html`, `service.html`, `fleet.html`, `pricing.html`, `contact.html`, `thankyou.html`, `privacy.html`, `terms.html`, `cookies.html`, `404.html`, `offline.html`.
- Wspólny nagłówek i stopka jako partiale: w źródłach ładowane w przeglądarce przez `fetch` (`assets/js/partials.js`), a w `dist/` wstawiane statycznie podczas builda.
- Lista usług sterowana danymi z `assets/data/services.json`, z filtrowaniem i synchronizacją stanu filtrów do adresu URL (`history.replaceState`).
- Strona szczegółów usługi (`service.html`) renderowana na podstawie parametru `?service=` lub `?id=`.
- Galeria floty: przełączanie zdjęć w kartach, filtrowanie kategorii i lightbox z obsługą klawiatury.
- Kalkulator wyceny przewozu (dystans, waga, typ usługi, dodatki) na stronie głównej i w `pricing.html`, liczony wyłącznie w przeglądarce, wraz z listą ostatnich wyliczeń w pamięci sesji.
- Formularz kontaktowy z atrybutami Netlify Forms (`data-netlify`, `netlify-honeypot="bot-field"`), walidacją po stronie klienta i przekierowaniem na `thankyou.html`; na stronie kontaktu osadzona jest mapa Google w `iframe`.
- Modal akceptacji warunków serwisu (`assets/js/site-consent.js`) z pułapką fokusa i zapisem decyzji w `localStorage`.
- Przełącznik motywu jasny/ciemny z wczesnym skryptem inicjującym w `<head>`, zapamiętywany w `localStorage`.
- Service worker z precache stron, fallbackiem offline i cache'owaniem assetów oraz manifest aplikacji z ikonami, skrótami i screenshotami.

### Stack technologiczny

Runtime:

- HTML
- CSS z modularnym entrypointem `assets/css/style.css`
- Vanilla JavaScript jako moduły ES
- Service Worker API
- Web App Manifest
- lokalne fonty `woff2` (Manrope, Space Grotesk)

Build:

- Node.js i npm
- PostCSS z `postcss-cli`
- cssnano
- lokalne pluginy PostCSS w `scripts/postcss-plugins/`
- własne skrypty Node w `scripts/`

Testy i kontrola jakości:

- `html-validate`
- `pa11y-ci`
- Playwright (projekt `chromium`)
- Lighthouse CI (`@lhci/cli@0.14.0` uruchamiany przez `npx`)
- `http-server` i `start-server-and-test`

Obrazy:

- `sharp` (używany przez `scripts/optimize-images.js`)

Hosting:

- konfiguracja hostingu statycznego w formacie Netlify (`_headers`, `_redirects`, Netlify Forms)

### Architektura

Warstwa źródłowa i warstwa generowana są rozdzielone. Źródła to strony HTML w katalogu głównym, `partials/`, `assets/css/modules/`, `assets/js/`, `assets/data/` i `scripts/`. Generowane są `assets/css/style.min.css`, `assets/js/main.min.js` oraz katalog `dist/`.

CSS: `assets/css/style.css` zawiera wyłącznie listę `@import` i ustala kolejność modułów (`settings`, `base`, `layout`, `header`, `footer`, `components`, `utilities`, `pages`). `postcss.config.js` ładuje lokalne pluginy z `scripts/postcss-plugins/`: własną implementację `postcss-import` oraz `autoprefixer-local-noop`, który nie dodaje prefiksów. Minifikację wykonuje cssnano.

JavaScript: `assets/js/theme-init.js` i `assets/js/boot.js` są ładowane jako klasyczne skrypty w `<head>` i ustawiają motyw oraz klasę `js` przed renderem. `assets/js/main.js` jest modułem wejściowym: najpierw wykonuje `await initPartials()`, następnie inicjalizuje pozostałe moduły i na końcu rejestruje service workera (tylko dla `https:` lub `localhost`).

Partiale: w źródłach nagłówek i stopka są pobierane przez `fetch` z `partials/`, dlatego strony źródłowe wymagają serwera HTTP. W buildzie `scripts/build-dist.js` wstawia zawartość partiali bezpośrednio do plików HTML w `dist/` i przepisuje odwołania na wersje minifikowane.

Service worker: `sw.js` używa cache `translogix-static-v3`, stosuje strategię network-first dla nawigacji i stale-while-revalidate dla `/assets/`, a przy braku sieci zwraca `offline.html`, a w dalszej kolejności `404.html`. Podczas aktywacji usuwa cache o innych nazwach.

### Struktura projektu

```text
.
├── index.html                  # strony źródłowe w katalogu głównym
├── services.html
├── service.html
├── fleet.html
├── pricing.html
├── contact.html
├── thankyou.html
├── privacy.html
├── terms.html
├── cookies.html
├── 404.html
├── offline.html
├── assets/
│   ├── css/
│   │   ├── style.css           # źródłowy entrypoint z listą @import
│   │   ├── style.min.css       # generowany plik produkcyjny
│   │   └── modules/            # settings, base, layout, header, footer, components, utilities, pages
│   ├── data/
│   │   └── services.json       # dane usług
│   ├── fonts/                  # lokalne fonty woff2
│   ├── icons/                  # favicony, ikony aplikacji i site.webmanifest
│   ├── img/                    # obrazy stron, OG, screenshoty i SVG
│   └── js/                     # moduły ES; main.js jest entrypointem, main.min.js jest generowany
├── partials/                   # header.html i footer.html używane przez runtime i build
├── scripts/                    # skrypty builda, walidacji i weryfikacji
│   └── postcss-plugins/        # lokalne pluginy PostCSS
├── tests/e2e/                  # testy Playwright
├── _headers                    # nagłówki hostingu statycznego
├── _redirects                  # przekierowania i ścieżki bez rozszerzenia
├── robots.txt
├── sitemap.xml
├── sw.js
├── postcss.config.js
├── playwright.config.js
├── lighthouserc.json
├── .pa11yci.json
├── perf-budgets.json
├── .htmlvalidate.json
├── start-local-server.bat
├── CHANGELOG.md
├── LICENSE
└── package.json
```

### Instalacja

```bash
npm install
```

Zależności deweloperskie są zadeklarowane w `package.json` i zablokowane w `package-lock.json`. Repozytorium nie deklaruje wymaganej wersji Node.js.

### Development lokalny

Projekt nie ma skryptu `dev`. Strony źródłowe pobierają partiale przez `fetch`, więc należy je serwować przez HTTP — otwarcie pliku bezpośrednio z dysku nie zadziała.

Podgląd źródeł w systemie Windows:

```bash
start-local-server.bat
```

Skrypt uruchamia `python -m http.server 8181` w katalogu projektu.

Podgląd zbudowanego katalogu `dist/`:

```bash
npm run preview:dist
```

Komenda uruchamia `http-server dist -p 8182 -c-1`.

### Dostępne skrypty

- `npm run build` – alias dla `build:dist`.
- `npm run build:dist` – uruchamia `build:assets`, a następnie `scripts/build-dist.js`.
- `npm run build:assets` – uruchamia `build:css` i `build:js`.
- `npm run build:css` – uruchamia `postcss assets/css/style.css -o assets/css/style.min.css` zgodnie z `postcss.config.js`.
- `npm run build:js` – uruchamia `scripts/build-js.js`, który usuwa komentarze i puste linie z `assets/js/main.js` i zapisuje wynik do `assets/js/main.min.js`.
- `npm run clean` – usuwa katalog `dist/`.
- `npm run preview:dist` – serwuje `dist/` na porcie 8182.
- `npm run assets:verify` – sprawdza, czy assety wskazywane w HTML i w `PRECACHE_URLS` w `sw.js` istnieją.
- `npm run assets:optimize` – konwertuje pliki JPG i PNG z `assets/img/src_img` do WebP i AVIF w `assets/img/opt_img`; katalog źródłowy nie jest częścią repozytorium, więc bez niego skrypt kończy się bez konwersji.
- `npm run qa:html` – waliduje `html-validate` strony w katalogu głównym oraz pliki HTML w `partials/`.
- `npm run qa:jsonld` – parsuje bloki JSON-LD osadzone w stronach i sprawdza obecność `@context`, `@type` lub `@graph`.
- `npm run qa:links` – sprawdza lokalne odwołania `href` i `src` w stronach katalogu głównego.
- `npm run qa:a11y` – serwuje projekt przez `http-server . -p 8080` i uruchamia `pa11y-ci` zgodnie z `.pa11yci.json`.
- `npm run qa:budget` – sprawdza budżety gzip z `perf-budgets.json`.
- `npm run qa:lighthouse` – uruchamia Lighthouse CI zgodnie z `lighthouserc.json`.
- `npm run qa` – uruchamia `qa:html`, `qa:jsonld`, `qa:links` i `qa:a11y`.
- `npm run test:e2e` – uruchamia testy Playwright; hook `pretest:e2e` wykonuje wcześniej `qa:links`.
- `npm run test:e2e:ui` i `npm run test:e2e:report` – tryb UI Playwrighta i podgląd raportu.
- `npm run release-check` – uruchamia `qa`, `assets:verify`, `qa:budget` i `test:e2e`.

### Build produkcyjny

```bash
npm run build
```

Przebieg:

1. `build:css` generuje `assets/css/style.min.css` z `assets/css/style.css` (rozwinięcie `@import` i minifikacja cssnano).
2. `build:js` generuje `assets/js/main.min.js` z `assets/js/main.js`.
3. `scripts/build-dist.js` usuwa i odtwarza `dist/`, kopiuje strony HTML katalogu głównego, `robots.txt`, `sitemap.xml`, `sw.js`, `_headers`, `_redirects` oraz cały katalog `assets/`, wstawia partiale w miejsce `<div data-partial="header"></div>` i `<div data-partial="footer"></div>` (obsługiwane są też znaczniki `{{> header}}` i `{{> footer}}`) i przepisuje odwołania do `style.css` i `main.js` na wersje `.min`.

`dist/` jest ignorowany przez Git; `assets/css/style.min.css` i `assets/js/main.min.js` są w repozytorium śledzone.

### Testy i walidacja

Testy end-to-end uruchamia Playwright w projekcie `chromium`. Konfiguracja `playwright.config.js` startuje własny serwer poleceniem `npm run build && npx http-server dist -p 8080 -c-1` i używa `baseURL` `http://127.0.0.1:8080`, więc testy działają na zbudowanym `dist/`.

Pliki testów w `tests/e2e/`: `contact.spec.js`, `fleet-lightbox.spec.js`, `mobile-nav.spec.js`, `offline.spec.js`, `service-worker-offline.spec.js`, `services.spec.js`.

Skonfigurowane kontrole statyczne:

- `.htmlvalidate.json` rozszerza `html-validate:recommended` i wymusza styl doctype oraz zapis elementów void.
- `.pa11yci.json` używa standardu `WCAG2AA` i obejmuje dwanaście adresów serwowanych z katalogu projektu.
- `perf-budgets.json` ustala limity gzip: 12000 B dla `assets/css/style.min.css` i 18000 B dla grafu modułów `assets/js/main.min.js`.
- `lighthouserc.json` używa presetu mobilnego, katalogu `.` jako źródła statycznego i pięciu adresów (`/`, `/services.html`, `/contact.html`, `/fleet.html`, `/pricing.html`); progi kategorii są zdefiniowane jako ostrzeżenia.

Powyższe opisy pochodzą z konfiguracji w repozytorium. Komendy nie były uruchamiane podczas przygotowania tej dokumentacji, więc nie potwierdzają wyniku przebiegu.

### Wdrożenie

Repozytorium zawiera konfigurację hostingu statycznego w formacie Netlify:

- `_headers` z Content-Security-Policy, `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, nagłówkami cross-origin oraz politykami `Cache-Control` per typ zasobu.
- `_redirects` z regułami rewrite dla `/services`, `/fleet`, `/pricing` i `/contact` oraz przekierowaniem 301 z `/index.html` na `/`.
- Formularz kontaktowy przygotowany pod Netlify Forms.

Katalogiem publikacji jest `dist/` tworzony przez `npm run build` — `_headers` i `_redirects` są kopiowane właśnie tam. Repozytorium nie zawiera pliku `netlify.toml`, więc ustawienia builda i publikacji są konfigurowane po stronie hostingu.

### Dostępność

W kodzie zaimplementowano między innymi:

- skip link do `#main` na stronach źródłowych;
- semantyczne landmarki, nagłówki i nawigacje z etykietami `aria-label`;
- synchronizację stanu ARIA w menu mobilnym, tabach, akordeonie FAQ, lightboxie i filtrach;
- modal warunków serwisu z `role="dialog"`, `aria-modal`, pułapką fokusa i przywróceniem fokusa po zamknięciu;
- walidację formularzy z `aria-invalid`, `aria-describedby` i komunikatami błędów;
- style `:focus-visible` w `base.css` oraz w modułach komponentów, nagłówka, stopki i stron;
- obsługę `prefers-reduced-motion` w CSS (`components.css`, `header.css`, `pages.css`) oraz w modułach `reveal.js`, `stats.js` i `site-consent.js`;
- konfigurację `pa11y-ci` ze standardem `WCAG2AA`.

Repozytorium nie zawiera raportu potwierdzającego zgodność z WCAG.

### SEO

Źródła zawierają:

- tytuły stron i meta description;
- `link rel="canonical"` na stronach publicznych;
- metadane Open Graph i Twitter Card wraz z obrazami w `assets/img/og-img/`;
- bloki JSON-LD osadzone bezpośrednio w stronach;
- politykę indeksowania: `index,follow` na stronach publicznych oraz `noindex,follow` w `404.html`, `offline.html` i `thankyou.html`;
- `robots.txt` wskazujący `sitemap.xml`;
- `sitemap.xml` z dziewięcioma adresami publicznymi.

Bloki JSON-LD osadzone bezpośrednio w stronach są jedynym utrzymywanym źródłem danych strukturalnych.

### PWA i obsługa offline

- `assets/icons/site.webmanifest` deklaruje `start_url` `/`, tryb `standalone`, kolory motywu, ikony 192 i 512 px (`any maskable`), trzy skróty i dwa screenshoty.
- `sw.js` precache'uje strony, ikony, `robots.txt` i `sitemap.xml`, a CSS pobiera z fallbackiem `style.min.css` → `style.css`.
- Nawigacje obsługuje strategia network-first z fallbackiem na `offline.html`, a następnie `404.html`; zasoby z `/assets/` obsługuje stale-while-revalidate.
- Wersjonowanie cache odbywa się przez stałą `CACHE_NAME` (`translogix-static-v3`); podczas aktywacji pozostałe cache są usuwane.
- Rejestracja service workera następuje tylko dla `https:` lub `localhost`.
- Zachowanie offline i fallback pokrywają testy `offline.spec.js` oraz `service-worker-offline.spec.js`.

### Wydajność

Mechanizmy obecne w repozytorium:

- minifikacja CSS i JS w pipeline builda;
- budżety gzip weryfikowane przez `npm run qa:budget`;
- lokalne fonty `woff2` ładowane przez `@font-face` z `font-display: swap` i wariantami `local()`;
- obrazy w formatach AVIF, WebP, JPG, PNG i SVG, w tym warianty rozdzielczości dla hero;
- `image-set()` w CSS oraz elementy `<picture>` w stronach;
- `loading="lazy"` i jawne wymiary obrazów;
- precache i runtime caching w service workerze;
- polityki `Cache-Control` w `_headers` (długi cache dla assetów, rewalidacja dla HTML i `sw.js`).

Repozytorium nie zawiera zapisanych wyników pomiarów wydajności.

### Dane i trwałość stanu

- Dane usług są statyczne i pochodzą z `assets/data/services.json`.
- `localStorage` przechowuje dwa klucze: `translogix-theme` (wybrany motyw) i `kpc_site_terms_accepted_v1` (akceptacja warunków serwisu).
- Historia wyliczeń kalkulatora jest trzymana w pamięci strony i znika po przeładowaniu.
- Cache Storage przechowuje zasoby w cache `translogix-static-v3`.
- Formularz kontaktowy wysyła dane metodą POST do obsługi Netlify Forms; repozytorium nie zawiera backendu aplikacyjnego, kont użytkowników ani bazy danych.

### Utrzymanie projektu

- Edytuj pliki źródłowe; nie modyfikuj ręcznie `dist/`, `assets/css/style.min.css` ani `assets/js/main.min.js`.
- Zmiany stylów trzymaj w `assets/css/modules/`; kolejność importów definiuje `assets/css/style.css`.
- Zmiany interakcji trzymaj w modułach `assets/js/`, a ich inicjalizację w `assets/js/main.js`.
- Nagłówek i stopkę edytuj wyłącznie w `partials/` — to jedyne utrzymywane źródło używane przez runtime i przez `scripts/build-dist.js`.
- `scripts/build-css.js` zawiera alternatywną implementację builda CSS i nie jest podpięty pod żaden skrypt npm — `build:css` korzysta z `postcss-cli` i `postcss.config.js`.
- Po zmianie tras lub assetów aktualizuj `PRECACHE_URLS` i podnieś `CACHE_NAME` w `sw.js`, a następnie uruchom `npm run assets:verify`.
- Zmiany w adresach stron odzwierciedlaj w `sitemap.xml` i `_redirects`.
- Istotne zmiany dokumentuj w `CHANGELOG.md`.

### Licencja

Projekt jest własnościowy. `package.json` deklaruje `UNLICENSED`, a plik [`LICENSE`](LICENSE) (w wersji polskiej i angielskiej) zastrzega wszelkie prawa i dopuszcza wyłącznie ograniczone wykorzystanie w celach portfolio, referencyjnych i code review, bez udzielenia licencji na kopiowanie, wdrażanie czy użycie komercyjne. Licencja nie obejmuje materiałów podmiotów trzecich, w tym zależności, fontów i ikon, które podlegają własnym warunkom.

## EN

### Project Overview

TransLogix is a static multi-page front-end for a B2B transport and logistics website, built by KP_Code Digital Studio (`package.json`, `LICENSE`, site footer). Page content is in Polish (`<html lang="pl">`).

The site presents a realistic company experience, but it is a demonstration project: the legal documents (`terms.html`, `privacy.html`, `cookies.html`) state explicitly that TransLogix is a fictional brand and that the transport company shown does not exist.

The repository contains no front-end framework and no application backend. The source layer consists of HTML pages, modular CSS, and Vanilla JavaScript ES modules. Source files are canonical; `dist/`, `assets/css/style.min.css`, and `assets/js/main.min.js` are produced by the build pipeline.

Repository: <https://github.com/KPKrol85/DS-logistic-pr01-TransLogix> (URL declared in `LICENSE`).

### Live Version

<https://transport-pr01-translogix.netlify.app/>

The URL is declared in the project sources (`link rel="canonical"`, `sitemap.xml`, `robots.txt`, `terms.html`). While this documentation was prepared, the URL responded and served the TransLogix site.

### Key Features

- Twelve source pages: `index.html`, `services.html`, `service.html`, `fleet.html`, `pricing.html`, `contact.html`, `thankyou.html`, `privacy.html`, `terms.html`, `cookies.html`, `404.html`, `offline.html`.
- Shared header and footer as partials: fetched in the browser in source pages (`assets/js/partials.js`) and inlined statically into `dist/` during the build.
- Services listing driven by `assets/data/services.json`, with filtering and filter state synchronized to the URL (`history.replaceState`).
- Service detail page (`service.html`) rendered from the `?service=` or `?id=` query parameter.
- Fleet gallery: per-card image switching, category filtering, and a keyboard-operable lightbox.
- Shipping rate calculator (distance, weight, service type, extras) on the home page and in `pricing.html`, computed entirely in the browser, with a list of recent calculations kept in session memory.
- Contact form with Netlify Forms attributes (`data-netlify`, `netlify-honeypot="bot-field"`), client-side validation, and redirection to `thankyou.html`; the contact page also embeds a Google map in an `iframe`.
- Site terms acceptance modal (`assets/js/site-consent.js`) with a focus trap and the decision stored in `localStorage`.
- Light/dark theme toggle with an early initialization script in `<head>`, persisted in `localStorage`.
- Service worker with page precache, offline fallback, and asset caching, plus a web app manifest with icons, shortcuts, and screenshots.

### Tech Stack

Runtime:

- HTML
- CSS with the modular entrypoint `assets/css/style.css`
- Vanilla JavaScript as ES modules
- Service Worker API
- Web App Manifest
- local `woff2` fonts (Manrope, Space Grotesk)

Build:

- Node.js and npm
- PostCSS with `postcss-cli`
- cssnano
- local PostCSS plugins in `scripts/postcss-plugins/`
- custom Node scripts in `scripts/`

Testing and quality assurance:

- `html-validate`
- `pa11y-ci`
- Playwright (`chromium` project)
- Lighthouse CI (`@lhci/cli@0.14.0` run through `npx`)
- `http-server` and `start-server-and-test`

Images:

- `sharp` (used by `scripts/optimize-images.js`)

Hosting:

- static hosting configuration in the Netlify format (`_headers`, `_redirects`, Netlify Forms)

### Architecture

The source layer and the generated layer are kept separate. Sources are the HTML pages in the project root, `partials/`, `assets/css/modules/`, `assets/js/`, `assets/data/`, and `scripts/`. Generated artifacts are `assets/css/style.min.css`, `assets/js/main.min.js`, and the `dist/` directory.

CSS: `assets/css/style.css` contains only an `@import` list and defines module order (`settings`, `base`, `layout`, `header`, `footer`, `components`, `utilities`, `pages`). `postcss.config.js` loads local plugins from `scripts/postcss-plugins/`: a custom `postcss-import` implementation and `autoprefixer-local-noop`, which adds no prefixes. Minification is done by cssnano.

JavaScript: `assets/js/theme-init.js` and `assets/js/boot.js` are loaded as classic scripts in `<head>` and set the theme and the `js` class before render. `assets/js/main.js` is the module entrypoint: it first runs `await initPartials()`, then initializes the remaining modules, and finally registers the service worker (only for `https:` or `localhost`).

Partials: in source pages the header and footer are fetched from `partials/`, so source pages require an HTTP server. In the build, `scripts/build-dist.js` inlines partial content directly into the HTML files in `dist/` and rewrites references to the minified assets.

Service worker: `sw.js` uses the `translogix-static-v3` cache, applies network-first for navigation and stale-while-revalidate for `/assets/`, and when the network is unavailable returns `offline.html`, then `404.html`. On activation it removes caches with other names.

### Project Structure

```text
.
├── index.html                  # source pages in the project root
├── services.html
├── service.html
├── fleet.html
├── pricing.html
├── contact.html
├── thankyou.html
├── privacy.html
├── terms.html
├── cookies.html
├── 404.html
├── offline.html
├── assets/
│   ├── css/
│   │   ├── style.css           # source entrypoint with the @import list
│   │   ├── style.min.css       # generated production file
│   │   └── modules/            # settings, base, layout, header, footer, components, utilities, pages
│   ├── data/
│   │   └── services.json       # services data
│   ├── fonts/                  # local woff2 fonts
│   ├── icons/                  # favicons, app icons, and site.webmanifest
│   ├── img/                    # page images, OG images, screenshots, and SVG
│   └── js/                     # ES modules; main.js is the entrypoint, main.min.js is generated
├── partials/                   # header.html and footer.html used by runtime and build
├── scripts/                    # build, validation, and verification scripts
│   └── postcss-plugins/        # local PostCSS plugins
├── tests/e2e/                  # Playwright tests
├── _headers                    # static hosting headers
├── _redirects                  # redirects and extensionless routes
├── robots.txt
├── sitemap.xml
├── sw.js
├── postcss.config.js
├── playwright.config.js
├── lighthouserc.json
├── .pa11yci.json
├── perf-budgets.json
├── .htmlvalidate.json
├── start-local-server.bat
├── CHANGELOG.md
├── LICENSE
└── package.json
```

### Installation

```bash
npm install
```

Development dependencies are declared in `package.json` and locked in `package-lock.json`. The repository does not declare a required Node.js version.

### Local Development

The project has no `dev` script. Source pages fetch their partials, so they must be served over HTTP — opening a file directly from disk will not work.

Source preview on Windows:

```bash
start-local-server.bat
```

The script runs `python -m http.server 8181` in the project directory.

Preview of the built `dist/` directory:

```bash
npm run preview:dist
```

The command runs `http-server dist -p 8182 -c-1`.

### Available Scripts

- `npm run build` – alias for `build:dist`.
- `npm run build:dist` – runs `build:assets`, then `scripts/build-dist.js`.
- `npm run build:assets` – runs `build:css` and `build:js`.
- `npm run build:css` – runs `postcss assets/css/style.css -o assets/css/style.min.css` according to `postcss.config.js`.
- `npm run build:js` – runs `scripts/build-js.js`, which strips comments and blank lines from `assets/js/main.js` and writes the result to `assets/js/main.min.js`.
- `npm run clean` – removes the `dist/` directory.
- `npm run preview:dist` – serves `dist/` on port 8182.
- `npm run assets:verify` – checks that assets referenced in HTML and in `PRECACHE_URLS` in `sw.js` exist.
- `npm run assets:optimize` – converts JPG and PNG files from `assets/img/src_img` to WebP and AVIF in `assets/img/opt_img`; the source directory is not part of the repository, so without it the script exits without converting anything.
- `npm run qa:html` – validates the root pages and the HTML files in `partials/` with `html-validate`.
- `npm run qa:jsonld` – parses the JSON-LD blocks embedded in the pages and checks for `@context`, `@type`, or `@graph`.
- `npm run qa:links` – checks local `href` and `src` references in the root pages.
- `npm run qa:a11y` – serves the project with `http-server . -p 8080` and runs `pa11y-ci` according to `.pa11yci.json`.
- `npm run qa:budget` – checks the gzip budgets from `perf-budgets.json`.
- `npm run qa:lighthouse` – runs Lighthouse CI according to `lighthouserc.json`.
- `npm run qa` – runs `qa:html`, `qa:jsonld`, `qa:links`, and `qa:a11y`.
- `npm run test:e2e` – runs the Playwright tests; the `pretest:e2e` hook runs `qa:links` first.
- `npm run test:e2e:ui` and `npm run test:e2e:report` – Playwright UI mode and report viewer.
- `npm run release-check` – runs `qa`, `assets:verify`, `qa:budget`, and `test:e2e`.

### Production Build

```bash
npm run build
```

Sequence:

1. `build:css` generates `assets/css/style.min.css` from `assets/css/style.css` (`@import` expansion and cssnano minification).
2. `build:js` generates `assets/js/main.min.js` from `assets/js/main.js`.
3. `scripts/build-dist.js` removes and recreates `dist/`, copies the root HTML pages, `robots.txt`, `sitemap.xml`, `sw.js`, `_headers`, `_redirects`, and the whole `assets/` directory, inlines the partials in place of `<div data-partial="header"></div>` and `<div data-partial="footer"></div>` (the `{{> header}}` and `{{> footer}}` markers are supported as well), and rewrites references to `style.css` and `main.js` to the `.min` versions.

`dist/` is ignored by Git; `assets/css/style.min.css` and `assets/js/main.min.js` are tracked in the repository.

### Testing and Validation

End-to-end tests run in Playwright with the `chromium` project. The `playwright.config.js` configuration starts its own server with `npm run build && npx http-server dist -p 8080 -c-1` and uses the `baseURL` `http://127.0.0.1:8080`, so the tests run against the built `dist/`.

Test files in `tests/e2e/`: `contact.spec.js`, `fleet-lightbox.spec.js`, `mobile-nav.spec.js`, `offline.spec.js`, `service-worker-offline.spec.js`, `services.spec.js`.

Configured static checks:

- `.htmlvalidate.json` extends `html-validate:recommended` and enforces the doctype style and void element style.
- `.pa11yci.json` uses the `WCAG2AA` standard and covers twelve URLs served from the project directory.
- `perf-budgets.json` sets gzip limits: 12000 B for `assets/css/style.min.css` and 18000 B for the `assets/js/main.min.js` module graph.
- `lighthouserc.json` uses the mobile preset, `.` as the static directory, and five URLs (`/`, `/services.html`, `/contact.html`, `/fleet.html`, `/pricing.html`); the category thresholds are defined as warnings.

These descriptions come from the repository configuration. The commands were not executed while this documentation was prepared, so they do not confirm any run results.

### Deployment

The repository contains static hosting configuration in the Netlify format:

- `_headers` with Content-Security-Policy, `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, cross-origin headers, and per-type `Cache-Control` policies.
- `_redirects` with rewrite rules for `/services`, `/fleet`, `/pricing`, and `/contact`, plus a 301 redirect from `/index.html` to `/`.
- A contact form prepared for Netlify Forms.

The publish directory is `dist/`, produced by `npm run build` — `_headers` and `_redirects` are copied there. The repository contains no `netlify.toml`, so build and publish settings are configured on the hosting side.

### Accessibility

The codebase implements, among others:

- a skip link to `#main` on the source pages;
- semantic landmarks, headings, and labelled navigation regions;
- ARIA state synchronization in the mobile menu, tabs, FAQ accordion, lightbox, and filters;
- a site terms modal with `role="dialog"`, `aria-modal`, a focus trap, and focus restoration on close;
- form validation with `aria-invalid`, `aria-describedby`, and error messages;
- `:focus-visible` styles in `base.css` and in the component, header, footer, and page modules;
- `prefers-reduced-motion` handling in CSS (`components.css`, `header.css`, `pages.css`) and in the `reveal.js`, `stats.js`, and `site-consent.js` modules;
- a `pa11y-ci` configuration using the `WCAG2AA` standard.

The repository contains no report confirming WCAG conformance.

### SEO

The sources include:

- page titles and meta descriptions;
- `link rel="canonical"` on public pages;
- Open Graph and Twitter Card metadata with images in `assets/img/og-img/`;
- JSON-LD blocks embedded directly in the pages;
- an indexing policy: `index,follow` on public pages and `noindex,follow` in `404.html`, `offline.html`, and `thankyou.html`;
- `robots.txt` pointing to `sitemap.xml`;
- `sitemap.xml` with nine public URLs.

The JSON-LD blocks embedded directly in the pages are the only maintained structured-data source.

### PWA and Offline Support

- `assets/icons/site.webmanifest` declares the `start_url` `/`, `standalone` display, theme colors, 192 and 512 px icons (`any maskable`), three shortcuts, and two screenshots.
- `sw.js` precaches pages, icons, `robots.txt`, and `sitemap.xml`, and fetches CSS with a `style.min.css` → `style.css` fallback.
- Navigation uses a network-first strategy with a fallback to `offline.html`, then `404.html`; resources under `/assets/` use stale-while-revalidate.
- Cache versioning is handled by the `CACHE_NAME` constant (`translogix-static-v3`); other caches are removed on activation.
- The service worker is registered only for `https:` or `localhost`.
- Offline behavior and the fallback are covered by `offline.spec.js` and `service-worker-offline.spec.js`.

### Performance

Mechanisms present in the repository:

- CSS and JS minification in the build pipeline;
- gzip budgets verified by `npm run qa:budget`;
- local `woff2` fonts loaded through `@font-face` with `font-display: swap` and `local()` variants;
- images in AVIF, WebP, JPG, PNG, and SVG, including resolution variants for the hero image;
- `image-set()` in CSS and `<picture>` elements in the pages;
- `loading="lazy"` and explicit image dimensions;
- service worker precache and runtime caching;
- `Cache-Control` policies in `_headers` (long-lived cache for assets, revalidation for HTML and `sw.js`).

The repository contains no stored performance measurement results.

### Data and State Persistence

- Services data is static and comes from `assets/data/services.json`.
- `localStorage` holds two keys: `translogix-theme` (selected theme) and `kpc_site_terms_accepted_v1` (site terms acceptance).
- The calculator history is kept in page memory and is lost on reload.
- Cache Storage holds resources in the `translogix-static-v3` cache.
- The contact form POSTs to Netlify Forms handling; the repository contains no application backend, user accounts, or database.

### Project Maintenance

- Edit source files; do not modify `dist/`, `assets/css/style.min.css`, or `assets/js/main.min.js` by hand.
- Keep style changes in `assets/css/modules/`; import order is defined by `assets/css/style.css`.
- Keep interaction changes in the `assets/js/` modules and their initialization in `assets/js/main.js`.
- Edit the header and footer only in `partials/` — it is the sole maintained source used by the runtime and by `scripts/build-dist.js`.
- `scripts/build-css.js` contains an alternative CSS build implementation and is not wired to any npm script — `build:css` uses `postcss-cli` and `postcss.config.js`.
- After changing routes or assets, update `PRECACHE_URLS` and bump `CACHE_NAME` in `sw.js`, then run `npm run assets:verify`.
- Reflect page URL changes in `sitemap.xml` and `_redirects`.
- Document significant changes in `CHANGELOG.md`.

### License

The project is proprietary. `package.json` declares `UNLICENSED`, and the [`LICENSE`](LICENSE) file (in Polish and English) reserves all rights and permits only limited use for portfolio, reference, and code review purposes, without granting a license to copy, deploy, or use the project commercially. The license does not cover third-party materials, including dependencies, fonts, and icons, which are subject to their own terms.
