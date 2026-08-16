const CONSENT_STORAGE_KEY = "kpc_site_terms_accepted_v1";

async function grantSiteConsent(page) {
  await page.addInitScript((key) => {
    window.localStorage.setItem(key, "true");
  }, CONSENT_STORAGE_KEY);
}

async function acceptVisibleSiteConsent(page) {
  const acceptButton = page.locator("[data-consent-accept]");

  if (await acceptButton.isVisible().catch(() => false)) {
    await acceptButton.click();
  }
}

module.exports = {
  acceptVisibleSiteConsent,
  grantSiteConsent,
};
