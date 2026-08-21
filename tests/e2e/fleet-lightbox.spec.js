const { test, expect } = require("@playwright/test");
const { grantSiteConsent } = require("./helpers/site-consent");

const heroPath = (hero) =>
  hero.evaluate(
    (image) =>
      new URL(image.currentSrc || image.src, document.baseURI).pathname,
  );

const isFullscreen = (page) =>
  page.evaluate(
    () =>
      document.fullscreenElement !== null &&
      document.fullscreenElement === document.querySelector(".lightbox"),
  );

const openFirstGallery = async (page) => {
  await grantSiteConsent(page);
  await page.goto("/fleet.html");
  await page
    .getByRole("button", { name: /otwórz galerię/i })
    .first()
    .click();
  const dialog = page.locator(".lightbox");
  await expect(dialog).toBeVisible();
  return dialog;
};

test.describe("Fleet lightbox smoke", () => {
  test("opens on click and closes with Escape", async ({ page }) => {
    await grantSiteConsent(page);
    await page.goto("/fleet.html");

    await page
      .getByRole("button", { name: /otwórz galerię/i })
      .first()
      .click();

    const dialog = page.locator(".lightbox");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: "Bus dostawczy" }),
    ).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("opens with keyboard Enter on gallery trigger", async ({ page }) => {
    await grantSiteConsent(page);
    await page.goto("/fleet.html");

    const firstTrigger = page
      .getByRole("button", { name: /otwórz galerię/i })
      .first();
    await firstTrigger.focus();
    await page.keyboard.press("Enter");

    await expect(page.locator(".lightbox")).toBeVisible();
  });

  test("keeps responsive Mega sources synchronized and opens the selected full image on demand", async ({
    page,
  }) => {
    await grantSiteConsent(page);
    await page.goto("/fleet.html");

    const fullFleetRequestsBeforeOpen = await page.evaluate(() =>
      performance
        .getEntriesByType("resource")
        .map((entry) => new URL(entry.name).pathname)
        .filter((pathname) => pathname.startsWith("/assets/img/fleet/")),
    );
    expect(fullFleetRequestsBeforeOpen).toEqual([]);

    const megaGallery = page.locator(".fleet-card__gallery").filter({
      has: page.locator('[data-gallery="set"]'),
    });

    await megaGallery
      .getByRole("button", { name: "Pokaż zdjęcie 2: Zestaw Mega" })
      .click();

    await expect(
      megaGallery.locator('[data-fleet-main-source="avif"]'),
    ).toHaveAttribute(
      "srcset",
      "assets/img/fleet/responsive/mega/2-320.avif 320w, assets/img/fleet/responsive/mega/2-640.avif 640w, assets/img/fleet/mega/2.avif 800w",
    );
    await expect(
      megaGallery.locator('[data-fleet-main-source="webp"]'),
    ).toHaveAttribute(
      "srcset",
      "assets/img/fleet/responsive/mega/2-320.webp 320w, assets/img/fleet/responsive/mega/2-640.webp 640w, assets/img/fleet/mega/2.webp 800w",
    );
    await expect(
      megaGallery.locator("[data-fleet-main-image]"),
    ).toHaveAttribute("src", "assets/img/fleet/responsive/mega/2-320.jpg");
    await expect(
      megaGallery.locator("[data-fleet-main-image]"),
    ).toHaveAttribute(
      "srcset",
      "assets/img/fleet/responsive/mega/2-320.jpg 320w, assets/img/fleet/responsive/mega/2-640.jpg 640w, assets/img/fleet/mega/2.jpg 800w",
    );
    await expect(
      megaGallery.getByRole("button", { name: "Pokaż zdjęcie 2: Zestaw Mega" }),
    ).toHaveAttribute("aria-current", "true");
    await expect(megaGallery.locator('[data-gallery="set"]')).toHaveAttribute(
      "data-lightbox-index",
      "1",
    );

    await megaGallery.locator('[data-gallery="set"]').click();

    const dialog = page.locator(".lightbox");
    const hero = dialog.locator(".lightbox__hero");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('source[type="image/avif"]')).toHaveAttribute(
      "srcset",
      "assets/img/fleet/mega/2.avif",
    );
    await expect(dialog.locator('source[type="image/webp"]')).toHaveAttribute(
      "srcset",
      "assets/img/fleet/mega/2.webp",
    );
    await expect
      .poll(() =>
        hero.evaluate(
          (image) =>
            new URL(image.currentSrc || image.src, document.baseURI).pathname,
        ),
      )
      .toBe("/assets/img/fleet/mega/2.avif");

    await dialog.getByRole("button", { name: "Następne zdjęcie" }).click();
    await expect
      .poll(() =>
        hero.evaluate(
          (image) =>
            new URL(image.currentSrc || image.src, document.baseURI).pathname,
        ),
      )
      .toBe("/assets/img/fleet/mega/3.avif");
  });

  test("exposes every gallery control with an accessible name", async ({
    page,
  }) => {
    const dialog = await openFirstGallery(page);

    for (const name of [
      "Zamknij",
      "Pełny ekran",
      "Poprzednie zdjęcie",
      "Następne zdjęcie",
    ]) {
      await expect(
        dialog.getByRole("button", { name, exact: true }),
      ).toBeVisible();
    }

    const icons = await dialog
      .locator(".lightbox__ctrl svg")
      .evaluateAll((nodes) =>
        nodes.map((node) => ({
          hidden: node.getAttribute("aria-hidden"),
          focusable: node.getAttribute("focusable"),
          stroke: node.getAttribute("stroke"),
        })),
      );
    expect(icons).toHaveLength(4);
    for (const icon of icons) {
      expect(icon).toEqual({
        hidden: "true",
        focusable: "false",
        stroke: "currentColor",
      });
    }
  });

  test("keeps close and navigation usable in fullscreen", async ({ page }) => {
    const dialog = await openFirstGallery(page);
    const hero = dialog.locator(".lightbox__hero");

    await dialog
      .getByRole("button", { name: "Pełny ekran", exact: true })
      .click();
    await expect.poll(() => isFullscreen(page)).toBe(true);

    for (const name of [
      "Zamknij",
      "Zamknij pełny ekran",
      "Poprzednie zdjęcie",
      "Następne zdjęcie",
    ]) {
      await expect(
        dialog.getByRole("button", { name, exact: true }),
      ).toBeVisible();
    }

    const first = await heroPath(hero);
    await dialog
      .getByRole("button", { name: "Następne zdjęcie", exact: true })
      .click();
    await expect.poll(() => heroPath(hero)).not.toBe(first);
    expect(await isFullscreen(page)).toBe(true);

    await page.keyboard.press("ArrowLeft");
    await expect.poll(() => heroPath(hero)).toBe(first);
    expect(await isFullscreen(page)).toBe(true);
  });

  test("Escape leaves fullscreen and restores the normal lightbox", async ({
    page,
  }) => {
    const dialog = await openFirstGallery(page);
    const panel = dialog.locator(".lightbox__dialog");
    const normalBox = await panel.boundingBox();

    await dialog
      .getByRole("button", { name: "Pełny ekran", exact: true })
      .click();
    await expect.poll(() => isFullscreen(page)).toBe(true);
    expect(await panel.boundingBox()).not.toEqual(normalBox);

    await page.keyboard.press("Escape");
    await expect.poll(() => isFullscreen(page)).toBe(false);
    await expect(dialog).toBeVisible();
    await expect.poll(() => panel.boundingBox()).toEqual(normalBox);
    await expect(
      dialog.getByRole("button", { name: "Pełny ekran", exact: true }),
    ).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(
      page.getByRole("button", { name: /otwórz galerię/i }).first(),
    ).toBeFocused();
  });

  test("restores the lightbox after a fullscreen exit the page did not start", async ({
    page,
  }) => {
    const dialog = await openFirstGallery(page);
    const panel = dialog.locator(".lightbox__dialog");
    const normalBox = await panel.boundingBox();

    await dialog
      .getByRole("button", { name: "Pełny ekran", exact: true })
      .click();
    await expect.poll(() => isFullscreen(page)).toBe(true);

    await page.evaluate(() => document.exitFullscreen());

    await expect.poll(() => isFullscreen(page)).toBe(false);
    await expect(dialog).toBeVisible();
    await expect.poll(() => panel.boundingBox()).toEqual(normalBox);
    await expect(panel).not.toHaveAttribute("aria-hidden", "true");
    await expect(dialog).not.toHaveClass(/is-zoomed/);
    expect(
      await dialog
        .locator(".lightbox__hero")
        .evaluate((image) => getComputedStyle(image).objectFit),
    ).toBe("contain");
  });

  test("closing from fullscreen leaves no fullscreen state behind", async ({
    page,
  }) => {
    const dialog = await openFirstGallery(page);

    await dialog
      .getByRole("button", { name: "Pełny ekran", exact: true })
      .click();
    await expect.poll(() => isFullscreen(page)).toBe(true);

    await dialog.getByRole("button", { name: "Zamknij", exact: true }).click();

    await expect(dialog).toBeHidden();
    await expect
      .poll(() => page.evaluate(() => document.fullscreenElement === null))
      .toBe(true);
    await expect(
      page.getByRole("button", { name: /otwórz galerię/i }).first(),
    ).toBeFocused();
    expect(
      await page.evaluate(() => ({
        position: document.body.style.position,
        noScroll: document.body.classList.contains("no-scroll"),
      })),
    ).toEqual({ position: "", noScroll: false });
  });

  test("re-opening the lightbox does not stack keyboard handlers", async ({
    page,
  }) => {
    const dialog = await openFirstGallery(page);
    const hero = dialog.locator(".lightbox__hero");

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    await page
      .getByRole("button", { name: /otwórz galerię/i })
      .first()
      .click();
    await expect(dialog).toBeVisible();

    const first = await heroPath(hero);
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => heroPath(hero)).not.toBe(first);
    await expect(dialog.locator(".lightbox__meta")).toHaveText("Zdjęcie 2 z 6");
  });
});
