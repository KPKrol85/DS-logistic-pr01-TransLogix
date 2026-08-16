const CACHE_NAME = "translogix-static-v3";

const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/services.html",
  "/service.html",
  "/fleet.html",
  "/pricing.html",
  "/contact.html",
  "/privacy.html",
  "/terms.html",
  "/cookies.html",
  "/404.html",
  "/thankyou.html",
  "/offline.html",

  "/assets/js/main.js",

  "/assets/icons/favicon.ico",
  "/assets/icons/favicon-96x96.png",
  "/assets/icons/favicon.svg",
  "/assets/icons/apple-touch-icon.png",
  "/assets/icons/site.webmanifest",

  "/robots.txt",
  "/sitemap.xml",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);

        for (const url of PRECACHE_URLS) {
          try {
            const response = await fetch(url);
            if (response && response.ok) {
              await cache.put(url, response.clone());
            }
          } catch (assetError) {
            console.warn("Skipping precache asset", url, assetError);
          }
        }

        const cssCandidates = ["/assets/css/style.min.css", "/assets/css/style.css"];
        for (const cssUrl of cssCandidates) {
          try {
            const cssResponse = await fetch(cssUrl);
            if (cssResponse && cssResponse.ok) {
              await cache.put(cssUrl, cssResponse.clone());
              break;
            }
          } catch (cssError) {
            console.warn("CSS precache fallback failed for", cssUrl, cssError);
          }
        }
      } catch (error) {
        console.error("Service worker install failed", error);
      }
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
          return undefined;
        }),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  const url = new URL(request.url);

  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (url.pathname === "/robots.txt" || url.pathname === "/sitemap.xml" || url.pathname === "/site.webmanifest" || url.pathname === "/404.html") {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
});

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) return cachedResponse;

    const offlinePage = await cache.match("/offline.html");
    if (offlinePage) return offlinePage;

    const notFound = await cache.match("/404.html");
    if (notFound) return notFound;

    return Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);

  if (cachedResponse) return cachedResponse;

  const networkResponse = await networkPromise;
  return networkResponse || Response.error();
}
