const { test, expect } = require('@playwright/test');

test('offline page exposes fallback content and retry action', async ({ page }) => {
  await page.goto('/offline.html');

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Spróbuj ponownie' })).toBeVisible();
});
