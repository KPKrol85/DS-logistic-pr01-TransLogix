const { test, expect } = require('@playwright/test');
const { grantSiteConsent } = require('./helpers/site-consent');

test.describe('Fleet lightbox smoke', () => {
  test('opens on click and closes with Escape', async ({ page }) => {
    await grantSiteConsent(page);
    await page.goto('/fleet.html');

    await page.getByRole('button', { name: /otwórz galerię/i }).first().click();

    const dialog = page.locator('.lightbox');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Bus dostawczy' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('opens with keyboard Enter on gallery trigger', async ({ page }) => {
    await grantSiteConsent(page);
    await page.goto('/fleet.html');

    const firstTrigger = page.getByRole('button', { name: /otwórz galerię/i }).first();
    await firstTrigger.focus();
    await page.keyboard.press('Enter');

    await expect(page.locator('.lightbox')).toBeVisible();
  });
});
