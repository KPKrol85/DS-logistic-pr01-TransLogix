const { test, expect } = require('@playwright/test');

async function installAndControlServiceWorker(page) {
  return page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers are not available in this browser context.');
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    const worker = registration.installing || registration.waiting || registration.active;

    if (!worker) {
      throw new Error('Service worker registration did not expose a worker.');
    }

    if (worker.state !== 'activated') {
      await new Promise((resolve, reject) => {
        worker.addEventListener('statechange', () => {
          if (worker.state === 'activated') resolve();
          if (worker.state === 'redundant') reject(new Error('Service worker became redundant.'));
        });
      });
    }

    await navigator.serviceWorker.ready;

    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) => {
        navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
      });
    }

    return {
      controllerScript: navigator.serviceWorker.controller?.scriptURL || '',
      scope: registration.scope,
    };
  });
}

test('service worker serves precached pages and offline navigation fallback', async ({ context, page }) => {
  await page.goto('/index.html');

  const registration = await installAndControlServiceWorker(page);
  expect(registration.controllerScript).toContain('/sw.js');

  await context.route('**/*', (route) => route.abort('internetdisconnected'));
  await context.setOffline(true);

  const cachedResponse = await page.goto('/services.html', { waitUntil: 'domcontentloaded' });
  expect(cachedResponse?.ok()).toBe(true);
  await expect(page).toHaveURL(/\/services\.html$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  await page.goto('/offline-smoke-unknown-route.html', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/offline-smoke-unknown-route\.html$/);
  await expect(page.getByRole('heading', { name: 'Brak połączenia z internetem' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Spróbuj ponownie' })).toBeVisible();
});
