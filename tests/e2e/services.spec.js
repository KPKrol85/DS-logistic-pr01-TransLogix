const { test, expect } = require('@playwright/test');
const { grantSiteConsent } = require('./helpers/site-consent');

function extractDisplayedCount(text) {
  const match = text.match(/(\d+)\/(\d+)/);
  return match ? Number(match[1]) : null;
}

test('services present a usable offer baseline without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto('/services.html');

  const servicesList = page.locator('#services-list');
  await expect(servicesList.getByRole('heading', { name: 'Dostępne usługi' })).toBeVisible();
  await expect(servicesList.getByRole('listitem')).toHaveCount(8);
  await expect(servicesList.getByRole('link', { name: 'Zapytaj o transport' })).toBeVisible();

  await context.close();
});

test('services filters update visible results', async ({ page }) => {
  await grantSiteConsent(page);
  await page.goto('/services.html');

  const resultsCount = page.locator('#results-count');
  await expect(resultsCount).toContainText('Wyświetlono');

  const initialCount = extractDisplayedCount(await resultsCount.innerText());
  expect(initialCount).not.toBeNull();

  await page.getByRole('button', { name: 'ADR' }).click();

  await expect(resultsCount).toContainText('Wyświetlono');
  const filteredCount = extractDisplayedCount(await resultsCount.innerText());
  expect(filteredCount).not.toBeNull();
  expect(filteredCount).toBeLessThan(initialCount);

  const cards = page.locator('#services-list article');
  await expect(cards).toHaveCount(filteredCount);
  await expect(page.getByRole('heading', { name: 'ADR Polska' })).toBeVisible();
});

test('services price label follows restored and changed range values', async ({ page }) => {
  await grantSiteConsent(page);
  await page.addInitScript(() => {
    window.sessionStorage.setItem(
      'translogix-services-filters',
      JSON.stringify({ filter: 'all', price: 4500, sort: 'none' }),
    );
  });
  await page.goto('/services.html');

  const priceRange = page.locator('#priceRange');
  const priceValue = page.locator('#priceValue');

  await expect(priceRange).toHaveValue('4500');
  await expect(priceValue).toHaveText('4500');

  await priceRange.fill('6500');

  await expect(priceValue).toHaveText('6500');
});
