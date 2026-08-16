const { test, expect } = require('@playwright/test');
const { grantSiteConsent } = require('./helpers/site-consent');

test.describe('Contact form smoke', () => {
  test('shows validation feedback for required fields on empty submit', async ({ page }) => {
    await grantSiteConsent(page);
    await page.goto('/contact.html');

    await page.getByRole('button', { name: 'Wyślij zapytanie' }).click();

    const invalidFields = page.locator('#contact-form [aria-invalid="true"]');
    await expect(invalidFields).toHaveCount(6);

    await expect(page.locator('#name-error')).not.toHaveText('');
    await expect(page.locator('#email-error')).not.toHaveText('');
    await expect(page.locator('#phone-error')).not.toHaveText('');
    await expect(page.locator('#serviceType-error')).not.toHaveText('');
    await expect(page.locator('#route-error')).not.toHaveText('');
    await expect(page.locator('#rodo-error')).not.toHaveText('');
  });

  test('submits valid contact form through the static form contract', async ({ page }) => {
    await page.addInitScript(() => {
      window.__contactFormSubmits = [];
      HTMLFormElement.prototype.submit = function submit() {
        window.__contactFormSubmits.push({
          id: this.id,
          name: this.getAttribute('name'),
          method: this.getAttribute('method'),
          action: this.getAttribute('action'),
          dataNetlify: this.getAttribute('data-netlify'),
          honeypot: this.getAttribute('netlify-honeypot'),
          fields: Array.from(new FormData(this).entries()),
        });
      };
    });

    await grantSiteConsent(page);
    await page.goto('/contact.html');

    const form = page.locator('#contact-form');
    await expect(form).toHaveAttribute('method', /post/i);
    await expect(form).toHaveAttribute('action', '/thankyou.html');
    await expect(form).toHaveAttribute('data-netlify', 'true');
    await expect(form).toHaveAttribute('netlify-honeypot', 'bot-field');
    await expect(form).toHaveAttribute('name', 'contact');
    await expect(form.locator('input[type="hidden"][name="form-name"]')).toHaveValue('contact');
    await expect(form.locator('#bot-field[name="bot-field"]')).toHaveValue('');

    await page.getByLabel('Imię i nazwisko').fill('Jan Testowy');
    await page.getByLabel('Email').fill('jan.testowy@example.com');
    await page.getByLabel('Telefon').fill('+48123456789');
    await page.getByLabel('Typ usługi').selectOption('express');
    await page.getByLabel('Trasa (miejsce załadunku → dostawy)').fill('Kraków → Berlin');
    await page.getByLabel('Opis ładunku').fill('Palety z elektroniką.');
    await page.getByLabel('Zgadzam się na przetwarzanie danych w celu przygotowania oferty.').check();

    await expect(page.locator('#contact-form [aria-invalid="true"]')).toHaveCount(0);

    await page.getByRole('button', { name: 'Wyślij zapytanie' }).click();

    await expect
      .poll(() => page.evaluate(() => window.__contactFormSubmits?.length || 0))
      .toBe(1);

    const submit = await page.evaluate(() => window.__contactFormSubmits[0]);
    expect(submit).toMatchObject({
      id: 'contact-form',
      name: 'contact',
      method: 'POST',
      action: '/thankyou.html',
      dataNetlify: 'true',
      honeypot: 'bot-field',
    });

    expect(submit.fields).toEqual(
      expect.arrayContaining([
        ['form-name', 'contact'],
        ['bot-field', ''],
        ['name', 'Jan Testowy'],
        ['email', 'jan.testowy@example.com'],
        ['phone', '+48123456789'],
        ['serviceType', 'express'],
        ['route', 'Kraków → Berlin'],
        ['message', 'Palety z elektroniką.'],
        ['rodo', 'on'],
      ]),
    );
  });
});
