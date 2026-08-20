const { test, expect } = require("@playwright/test");

async function installAndControlServiceWorker(page) {
  return page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) {
      throw new Error(
        "Service workers are not available in this browser context.",
      );
    }

    const registration = await navigator.serviceWorker.register("/sw.js");
    const worker =
      registration.installing || registration.waiting || registration.active;

    if (!worker) {
      throw new Error("Service worker registration did not expose a worker.");
    }

    if (worker.state !== "activated") {
      await new Promise((resolve, reject) => {
        worker.addEventListener("statechange", () => {
          if (worker.state === "activated") resolve();
          if (worker.state === "redundant")
            reject(new Error("Service worker became redundant."));
        });
      });
    }

    await navigator.serviceWorker.ready;

    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) => {
        navigator.serviceWorker.addEventListener("controllerchange", resolve, {
          once: true,
        });
      });
    }

    return {
      controllerScript: navigator.serviceWorker.controller?.scriptURL || "",
      scope: registration.scope,
    };
  });
}

test("service worker activation removes only obsolete TransLogix caches", async ({
  page,
}) => {
  const testCaches = {
    current: "translogix-static-v4",
    obsolete: ["translogix-static-v2", "translogix-static-v3"],
    unrelated: "unrelated-app-cache",
  };
  const allTestCacheNames = [
    testCaches.current,
    ...testCaches.obsolete,
    testCaches.unrelated,
  ];

  await page.goto("/robots.txt");

  try {
    const seededCacheNames = await page.evaluate(async (cacheNames) => {
      await Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName)),
      );

      await Promise.all(
        cacheNames.map(async (cacheName) => {
          const cache = await caches.open(cacheName);
          const sentinelUrl = new URL(
            `/__cache-ownership-test__/${cacheName}`,
            location.origin,
          ).href;
          await cache.put(sentinelUrl, new Response(cacheName));
        }),
      );

      return caches.keys();
    }, allTestCacheNames);

    expect(seededCacheNames).toEqual(expect.arrayContaining(allTestCacheNames));

    await installAndControlServiceWorker(page);

    const activationResult = await page.evaluate(
      async ({ current, obsolete, unrelated }) => {
        const cacheNames = await caches.keys();
        const currentCache = await caches.open(current);
        const currentSentinelUrl = new URL(
          `/__cache-ownership-test__/${current}`,
          location.origin,
        ).href;

        return {
          cacheNames,
          currentSentinelPreserved: Boolean(
            await currentCache.match(currentSentinelUrl),
          ),
          obsoleteCachesExist: obsolete.map((cacheName) =>
            cacheNames.includes(cacheName),
          ),
          unrelatedCacheExists: cacheNames.includes(unrelated),
        };
      },
      testCaches,
    );

    expect(activationResult.obsoleteCachesExist).toEqual([false, false]);
    expect(activationResult.cacheNames).toContain(testCaches.current);
    expect(activationResult.currentSentinelPreserved).toBe(true);
    expect(activationResult.unrelatedCacheExists).toBe(true);
  } finally {
    await page.evaluate(async (cacheNames) => {
      await Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName)),
      );
    }, allTestCacheNames);
  }
});

test("service worker serves precached pages and offline navigation fallback", async ({
  context,
  page,
}) => {
  await page.goto("/index.html");

  const registration = await installAndControlServiceWorker(page);
  expect(registration.controllerScript).toContain("/sw.js");

  await context.route("**/*", (route) => route.abort("internetdisconnected"));
  await context.setOffline(true);

  const cachedResponse = await page.goto("/services.html", {
    waitUntil: "domcontentloaded",
  });
  expect(cachedResponse?.ok()).toBe(true);
  await expect(page).toHaveURL(/\/services\.html$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.goto("/offline-smoke-unknown-route.html", {
    waitUntil: "domcontentloaded",
  });
  await expect(page).toHaveURL(/\/offline-smoke-unknown-route\.html$/);
  await expect(
    page.getByRole("heading", { name: "Brak połączenia z internetem" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Spróbuj ponownie" }),
  ).toBeVisible();
});
