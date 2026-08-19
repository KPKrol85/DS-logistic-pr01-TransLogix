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

  test('keeps responsive Mega sources synchronized and opens the selected full image on demand', async ({ page }) => {
    await grantSiteConsent(page);
    await page.goto('/fleet.html');

    const fullFleetRequestsBeforeOpen = await page.evaluate(() =>
      performance
        .getEntriesByType('resource')
        .map((entry) => new URL(entry.name).pathname)
        .filter((pathname) => pathname.startsWith('/assets/img/fleet/')),
    );
    expect(fullFleetRequestsBeforeOpen).toEqual([]);

    const megaGallery = page.locator('.fleet-card__gallery').filter({
      has: page.locator('[data-gallery="set"]'),
    });

    await megaGallery.getByRole('button', { name: 'Pokaż zdjęcie 2: Zestaw Mega' }).click();

    await expect(megaGallery.locator('[data-fleet-main-source="avif"]')).toHaveAttribute(
      'srcset',
      'assets/img/fleet/responsive/mega/2-320.avif 320w, assets/img/fleet/responsive/mega/2-640.avif 640w, assets/img/fleet/mega/2.avif 800w',
    );
    await expect(megaGallery.locator('[data-fleet-main-source="webp"]')).toHaveAttribute(
      'srcset',
      'assets/img/fleet/responsive/mega/2-320.webp 320w, assets/img/fleet/responsive/mega/2-640.webp 640w, assets/img/fleet/mega/2.webp 800w',
    );
    await expect(megaGallery.locator('[data-fleet-main-image]')).toHaveAttribute('src', 'assets/img/fleet/responsive/mega/2-320.jpg');
    await expect(megaGallery.locator('[data-fleet-main-image]')).toHaveAttribute(
      'srcset',
      'assets/img/fleet/responsive/mega/2-320.jpg 320w, assets/img/fleet/responsive/mega/2-640.jpg 640w, assets/img/fleet/mega/2.jpg 800w',
    );
    await expect(megaGallery.getByRole('button', { name: 'Pokaż zdjęcie 2: Zestaw Mega' })).toHaveAttribute('aria-current', 'true');
    await expect(megaGallery.locator('[data-gallery="set"]')).toHaveAttribute('data-lightbox-index', '1');

    await megaGallery.locator('[data-gallery="set"]').click();

    const dialog = page.locator('.lightbox');
    const hero = dialog.locator('.lightbox__hero');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('source[type="image/avif"]')).toHaveAttribute('srcset', 'assets/img/fleet/mega/2.avif');
    await expect(dialog.locator('source[type="image/webp"]')).toHaveAttribute('srcset', 'assets/img/fleet/mega/2.webp');
    await expect.poll(() => hero.evaluate((image) => new URL(image.currentSrc || image.src, document.baseURI).pathname)).toBe('/assets/img/fleet/mega/2.avif');

    await dialog.getByRole('button', { name: 'Następne' }).click();
    await expect.poll(() => hero.evaluate((image) => new URL(image.currentSrc || image.src, document.baseURI).pathname)).toBe('/assets/img/fleet/mega/3.avif');
  });
});
