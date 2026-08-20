const { test, expect } = require("@playwright/test");

const routeCases = [
  { pathname: "/", sourcePath: "/index.html", expectedHref: "index.html" },
  {
    pathname: "/index.html",
    sourcePath: "/index.html",
    expectedHref: "index.html",
  },
  {
    pathname: "/services",
    sourcePath: "/services.html",
    expectedHref: "services.html",
  },
  {
    pathname: "/services.html",
    sourcePath: "/services.html",
    expectedHref: "services.html",
  },
  { pathname: "/fleet", sourcePath: "/fleet.html", expectedHref: "fleet.html" },
  {
    pathname: "/fleet.html",
    sourcePath: "/fleet.html",
    expectedHref: "fleet.html",
  },
  {
    pathname: "/pricing",
    sourcePath: "/pricing.html",
    expectedHref: "pricing.html",
  },
  {
    pathname: "/pricing.html",
    sourcePath: "/pricing.html",
    expectedHref: "pricing.html",
  },
  {
    pathname: "/contact",
    sourcePath: "/contact.html",
    expectedHref: "contact.html",
  },
  {
    pathname: "/contact.html",
    sourcePath: "/contact.html",
    expectedHref: "contact.html",
  },
];

test("marks exactly one page-level navigation link on extensionless and html routes", async ({
  context,
}) => {
  for (const { pathname, sourcePath, expectedHref } of routeCases) {
    const page = await context.newPage();
    await page.addInitScript((currentPathname) => {
      window.history.replaceState({}, "", currentPathname);
    }, pathname);
    await page.goto(sourcePath);

    const currentLinks = page.locator(
      '.nav__links a[aria-current="page"], .footer__list a[aria-current="page"]',
    );
    await expect(currentLinks).toHaveCount(1);
    await expect(currentLinks).toHaveAttribute("href", expectedHref);
    await expect(
      page.locator('.footer__list a[href*="#"][aria-current]'),
    ).toHaveCount(0);
    await page.close();
  }
});
