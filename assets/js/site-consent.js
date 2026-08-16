const CONSENT_KEY = "kpc_site_terms_accepted_v1";
const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const canUseLocalStorage = () => {
  try {
    const probeKey = "__site_consent_probe__";
    localStorage.setItem(probeKey, "1");
    localStorage.removeItem(probeKey);
    return true;
  } catch (error) {
    return false;
  }
};

const buildConsentMarkup = () => {
  const overlay = document.createElement("div");
  overlay.className = "site-consent";
  overlay.setAttribute("data-consent-overlay", "true");

  overlay.innerHTML = `
    <div class="site-consent__dialog" role="dialog" aria-modal="true" aria-labelledby="site-consent-title" aria-describedby="site-consent-desc" tabindex="-1">
      <div class="site-consent__badge">Warunki korzystania z serwisu</div>
      <h2 class="site-consent__title" id="site-consent-title">Warunki korzystania z serwisu</h2>
      <p class="site-consent__text" id="site-consent-desc">
        Przed rozpoczęciem korzystania z serwisu zapoznaj się z regulaminem, polityką prywatności oraz polityką cookies.
      </p>
      <p class="site-consent__note">Przed korzystaniem z serwisu zaakceptuj Regulamin.</p>
      <div class="site-consent__actions">
        <button class="btn site-consent__primary" type="button" data-consent-accept>Akceptuję i przechodzę</button>
        <a class="btn site-consent__secondary" href="terms.html">Przeczytaj regulamin</a>
      </div>
      <div class="site-consent__links" aria-label="Dokumenty dodatkowe">
        <a href="privacy.html">Polityka prywatności</a>
        <span aria-hidden="true">•</span>
        <a href="cookies.html">Cookies</a>
      </div>
    </div>
  `;

  return overlay;
};

export function initSiteConsent() {
  if (!document.body) return;

  const storageAvailable = canUseLocalStorage();
  const hasConsent = storageAvailable && localStorage.getItem(CONSENT_KEY) === "true";
  if (hasConsent) return;

  const overlay = buildConsentMarkup();
  const dialog = overlay.querySelector(".site-consent__dialog");
  const acceptButton = overlay.querySelector("[data-consent-accept]");
  if (!dialog || !acceptButton) return;
  const focusableItems = Array.from(dialog.querySelectorAll(focusableSelector));
  if (!focusableItems.length) return;
  const firstFocusable = focusableItems[0];
  const lastFocusable = focusableItems[focusableItems.length - 1];
  const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

  const trapFocus = (event) => {
    if (event.key !== "Tab" || !focusableItems.length) return;
    const activeElement = document.activeElement;
    if (event.shiftKey) {
      if (activeElement === firstFocusable || !dialog.contains(activeElement)) {
        event.preventDefault();
        lastFocusable.focus();
      }
      return;
    }
    if (activeElement === lastFocusable || !dialog.contains(activeElement)) {
      event.preventDefault();
      firstFocusable.focus();
    }
  };

  const preventEscapeClose = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
    }
  };

  const closeConsent = () => {
    if (storageAvailable) {
      localStorage.setItem(CONSENT_KEY, "true");
    }
    dialog.removeEventListener("keydown", trapFocus);
    dialog.removeEventListener("keydown", preventEscapeClose);
    overlay.classList.remove("is-visible");
    document.body.classList.remove("no-scroll");

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = prefersReducedMotion ? 0 : 220;
    window.setTimeout(() => overlay.remove(), delay);

    if (previouslyFocused) {
      previouslyFocused.focus({ preventScroll: true });
    }
  };

  acceptButton.addEventListener("click", closeConsent);
  dialog.addEventListener("keydown", trapFocus);
  dialog.addEventListener("keydown", preventEscapeClose);

  document.body.classList.add("no-scroll");
  document.body.insertBefore(overlay, document.body.firstChild);

  requestAnimationFrame(() => {
    overlay.classList.add("is-visible");
    acceptButton.focus({ preventScroll: true });
  });
}
