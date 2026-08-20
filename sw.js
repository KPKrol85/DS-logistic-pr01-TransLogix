const CACHE_PREFIX = "translogix-static-";
const CACHE_NAME = "translogix-static-v4";

const VITE_ASSET_URLS = [];

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

  "/assets/icons/favicon.ico",
  "/assets/icons/favicon-96x96.png",
  "/assets/icons/favicon.svg",
  "/assets/icons/apple-touch-icon.png",
  "/assets/icons/site.webmanifest",

  "/robots.txt",
  "/sitemap.xml",

  ...VITE_ASSET_URLS,
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
          if (cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME) {
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

  if (
    url.pathname === "/robots.txt" ||
    url.pathname === "/sitemap.xml" ||
    url.pathname === "/site.webmanifest" ||
    url.pathname === "/404.html"
  ) {
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
