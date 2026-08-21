const { test, expect } = require("@playwright/test");
const { grantSiteConsent } = require("./helpers/site-consent");

const SOCIAL_IMAGE_NAMES = ["fb-", "insta-", "linkedin-", "github-"];

async function setStoredTheme(page, theme) {
  await page.addInitScript((storedTheme) => {
    window.localStorage.setItem("translogix-theme", storedTheme);
  }, theme);
}

function requestedAsset(requestUrls, assetName) {
  return requestUrls.some((url) => url.includes(assetName));
}

test("light theme loads only active shared theme images and renders footer social icons inline", async ({
  page,
}) => {
  const requestUrls = [];
  page.on("request", (request) => requestUrls.push(request.url()));

  await grantSiteConsent(page);
  await setStoredTheme(page, "light");
  await page.goto("/services.html");
  await page.waitForLoadState("networkidle");

  const headerLogo = page.locator("header .brand__logo");
  const themeToggle = page.locator(".theme-toggle");
  const themeIcon = themeToggle.locator('[data-theme-image="toggle"]');

  await expect(headerLogo).toHaveAttribute("src", /logo-translogix-light/);
  await expect(themeIcon).toHaveAttribute("src", /sun-/);
  await expect(themeToggle).toHaveAttribute("aria-pressed", "false");
  await expect(themeToggle).toHaveAttribute(
    "aria-label",
    "Przełącz na tryb ciemny",
  );

  expect(requestedAsset(requestUrls, "logo-translogix-light-")).toBe(true);
  expect(requestedAsset(requestUrls, "sun-")).toBe(true);
  expect(requestedAsset(requestUrls, "logo-translogix-dark-")).toBe(false);
  expect(requestedAsset(requestUrls, "moon-")).toBe(false);

  const socialLinks = page.locator(".footer__social-row .social-link");
  await expect(socialLinks).toHaveCount(4);
  await expect(socialLinks.nth(0)).toHaveAccessibleName("Facebook");
  await expect(socialLinks.nth(1)).toHaveAccessibleName("Instagram");
  await expect(socialLinks.nth(2)).toHaveAccessibleName("LinkedIn");
  await expect(socialLinks.nth(3)).toHaveAccessibleName("GitHub");
  const socialIcons = socialLinks.locator(".social-link__icon > svg");
  await expect(socialIcons).toHaveCount(4);
  await expect(socialIcons.first()).toHaveAttribute("aria-hidden", "true");
  await expect(socialIcons.first()).toHaveAttribute("focusable", "false");

  await page.locator(".footer__social").scrollIntoViewIfNeeded();
  for (const assetName of SOCIAL_IMAGE_NAMES) {
    expect(requestedAsset(requestUrls, assetName)).toBe(false);
  }

  await themeToggle.click();
  await expect(page.locator("html")).toHaveClass(/theme-dark/);
  await expect(headerLogo).toHaveAttribute("src", /logo-translogix-dark/);
  await expect(themeIcon).toHaveAttribute("src", /moon-/);
  await expect(themeToggle).toHaveAttribute("aria-pressed", "true");
  await expect(themeToggle).toHaveAttribute(
    "aria-label",
    "Przełącz na tryb jasny",
  );
  await expect
    .poll(() => requestedAsset(requestUrls, "logo-translogix-dark-"))
    .toBe(true);
  await expect.poll(() => requestedAsset(requestUrls, "moon-")).toBe(true);
});

test("stored dark theme loads only dark shared theme images initially", async ({
  page,
}) => {
  const requestUrls = [];
  page.on("request", (request) => requestUrls.push(request.url()));

  await grantSiteConsent(page);
  await setStoredTheme(page, "dark");
  await page.goto("/services.html");
  await page.waitForLoadState("networkidle");

  await expect(page.locator("html")).toHaveClass(/theme-dark/);
  await expect(page.locator("header .brand__logo")).toHaveAttribute(
    "src",
    /logo-translogix-dark/,
  );
  await expect(page.locator('[data-theme-image="toggle"]')).toHaveAttribute(
    "src",
    /moon-/,
  );
  expect(requestedAsset(requestUrls, "logo-translogix-dark-")).toBe(true);
  expect(requestedAsset(requestUrls, "moon-")).toBe(true);
  expect(requestedAsset(requestUrls, "logo-translogix-light-")).toBe(false);
  expect(requestedAsset(requestUrls, "sun-")).toBe(false);
});

test("system dark preference is used when no theme is stored", async ({
  page,
}) => {
  await grantSiteConsent(page);
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/services.html");

  await expect(page.locator("html")).toHaveClass(/theme-dark/);
  await expect(page.locator("header .brand__logo")).toHaveAttribute(
    "src",
    /logo-translogix-dark/,
  );
  await expect(page.locator('[data-theme-image="toggle"]')).toHaveAttribute(
    "src",
    /moon-/,
  );
  await expect(page.locator(".theme-toggle")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(
    await page.evaluate(() => window.localStorage.getItem("translogix-theme")),
  ).toBeNull();
});

test("built shared header and footer retain their no-JavaScript image baseline", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto("/services.html");

  await expect(page.locator("html")).toHaveClass(/no-js/);
  await expect(page.locator("header .brand noscript img")).toHaveAttribute(
    "src",
    /logo-translogix-light/,
  );
  await expect(page.locator(".theme-toggle noscript img")).toHaveAttribute(
    "src",
    /sun-/,
  );
  await expect(page.locator(".brand--footer noscript img")).toHaveAttribute(
    "src",
    /logo-translogix-light/,
  );
  const scriptedImages = page.locator("[data-theme-image]");
  for (let index = 0; index < (await scriptedImages.count()); index += 1) {
    await expect(scriptedImages.nth(index)).toBeHidden();
  }
  await expect(page.locator(".footer__social-row .social-link")).toHaveCount(4);
  const socialLabels = page.locator(".footer__social-row .social-link__label");
  await expect(socialLabels).toHaveCount(4);
  for (let index = 0; index < 4; index += 1) {
    await expect(socialLabels.nth(index)).toBeVisible();
  }

  await context.close();
});
