const { test, expect } = require('@playwright/test');
const { grantSiteConsent } = require('./helpers/site-consent');

function extractDisplayedCount(text) {
  const match = text.match(/(\d+)\/(\d+)/);
  return match ? Number(match[1]) : null;
}

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
