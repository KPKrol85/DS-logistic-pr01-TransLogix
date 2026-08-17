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

  test('keeps Mega AVIF, WebP, and JPG sources synchronized', async ({ page }) => {
    await grantSiteConsent(page);
    await page.goto('/fleet.html');

    const megaGallery = page.locator('.fleet-card__gallery').filter({
      has: page.locator('[data-gallery="set"]'),
    });

    await megaGallery.getByRole('button', { name: 'Pokaż zdjęcie 2: Zestaw Mega' }).click();

    await expect(megaGallery.locator('[data-fleet-main-source="avif"]')).toHaveAttribute('srcset', 'assets/img/fleet/mega/2.avif');
    await expect(megaGallery.locator('[data-fleet-main-source="webp"]')).toHaveAttribute('srcset', 'assets/img/fleet/mega/2.webp');
    await expect(megaGallery.locator('[data-fleet-main-image]')).toHaveAttribute('src', 'assets/img/fleet/mega/2.jpg');
  });
});
