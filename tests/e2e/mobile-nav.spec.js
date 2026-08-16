const { test, expect, devices } = require('@playwright/test');
const { grantSiteConsent } = require('./helpers/site-consent');

test.use({ ...devices['iPhone 12'] });

test('mobile navigation opens and navigates to services page', async ({ page }) => {
  await grantSiteConsent(page);
  await page.goto('/index.html');

  const menuToggle = page.locator('.nav__toggle');
  await expect(menuToggle).toHaveAttribute('aria-label', 'Otwórz menu');
  await menuToggle.click();

  await expect(menuToggle).toHaveAttribute('aria-expanded', 'true');
  await expect(menuToggle).toHaveAttribute('aria-label', 'Zamknij menu');

  const mainMenu = page.getByLabel('Główne menu');
  const servicesLink = mainMenu.getByRole('link', { name: 'Usługi' });
  await expect(servicesLink).toBeVisible();
  await servicesLink.click();

  await expect(page).toHaveURL(/\/services\.html$/);
});
