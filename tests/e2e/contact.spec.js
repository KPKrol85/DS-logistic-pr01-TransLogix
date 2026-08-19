const { test, expect } = require('@playwright/test');
const { grantSiteConsent } = require('./helpers/site-consent');

const GOOGLE_MAP_URL = 'https://www.google.com/maps?q=ul.+Marynarki+Wojennej+12%2F31,+33-100+Tarn%C3%B3w,+Polska&output=embed';

test('loads Google Maps only after dedicated keyboard activation', async ({ page }) => {
  const googleMapRequests = [];

  page.on('request', (request) => {
    if (request.url().startsWith('https://www.google.com/maps')) {
      googleMapRequests.push(request.url());
    }
  });

  await page.route('https://www.google.com/maps**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><title>Stub Google Maps</title>',
    });
  });

  await grantSiteConsent(page);
  await page.goto('/contact.html');

  const mapComponent = page.locator('[data-deferred-map]');
  const activateButton = page.getByRole('button', { name: 'Wyświetl mapę Google' });

  await expect(page.getByRole('heading', { name: 'Dane operatora projektu' })).toBeVisible();
  await expect(page.locator('main').getByRole('link', { name: '+48 533 537 091' })).toHaveAttribute('href', 'tel:+48533537091');
  await expect(page.locator('main').getByRole('link', { name: 'kontakt@kp-code.pl' })).toHaveAttribute('href', 'mailto:kontakt@kp-code.pl');
  await expect(mapComponent.locator('iframe')).toHaveCount(0);
  await expect(activateButton).toBeVisible();
  await expect(activateButton).toBeEnabled();
  expect(googleMapRequests).toHaveLength(0);
  const placeholderHeight = await mapComponent.evaluate((element) => element.getBoundingClientRect().height);

  const mapRequest = page.waitForRequest((request) => request.url() === GOOGLE_MAP_URL);
  await activateButton.focus();
  await expect(activateButton).toBeFocused();
  await activateButton.press('Enter');

  const requestedMap = await mapRequest;
  expect(requestedMap.url()).toBe(GOOGLE_MAP_URL);
  const mapFrame = mapComponent.locator('iframe');
  await expect(mapFrame).toHaveAttribute('src', GOOGLE_MAP_URL);
  await expect(mapFrame).toHaveAttribute('title', 'Mapa lokalizacji operatora projektu: ul. Marynarki Wojennej 12/31, 33-100 Tarnów');
  await expect(mapFrame).toHaveAttribute('loading', 'lazy');
  await expect(mapFrame).toHaveAttribute('referrerpolicy', 'no-referrer-when-downgrade');
  await expect(mapFrame).not.toBeFocused();
  await expect.poll(() => googleMapRequests.length).toBe(1);

  const loadedHeight = await mapComponent.evaluate((element) => element.getBoundingClientRect().height);
  expect(Math.abs(loadedHeight - placeholderHeight)).toBeLessThanOrEqual(1);
});

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
    await page.getByLabel('Potwierdzam, że świadomie przekazuję dane w celu obsługi mojego zapytania i przygotowania odpowiedzi.').check();

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
