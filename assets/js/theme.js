const STORAGE_KEY = "translogix-theme";
const THEME_IMAGE_URLS = {
  light: {
    logo: new URL("../img/logo/logo-translogix-light.svg", import.meta.url).href,
    toggle: new URL("../img/svg/sun.svg", import.meta.url).href,
  },
  dark: {
    logo: new URL("../img/logo/logo-translogix-dark.svg", import.meta.url).href,
    toggle: new URL("../img/svg/moon.svg", import.meta.url).href,
  },
};

function getStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "dark" || stored === "light" ? stored : null;
  } catch (error) {
    return null;
  }
}

function getPreferredTheme() {
  const stored = getStoredTheme();
  if (stored) return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function updateThemeImages(theme) {
  const imageUrls = THEME_IMAGE_URLS[theme];

  document.querySelectorAll("[data-theme-image]").forEach((image) => {
    const imageUrl = imageUrls[image.dataset.themeImage];
    if (imageUrl && image.src !== imageUrl) {
      image.src = imageUrl;
    }
  });
}

function applyTheme(theme) {
  const root = document.documentElement;
  const shouldBeDark = theme === "dark";
  const isDark = root.classList.contains("theme-dark");
  if (isDark !== shouldBeDark) {
    root.classList.toggle("theme-dark", shouldBeDark);
  }

  updateThemeImages(theme);
}

function updateToggleA11y(toggle, theme) {
  const isDark = theme === "dark";
  toggle.setAttribute("aria-pressed", isDark);
  toggle.setAttribute("aria-label", isDark ? "Przełącz na tryb jasny" : "Przełącz na tryb ciemny");
}

export function initThemeToggle() {
  const toggle = document.querySelector(".theme-toggle");
  if (!toggle) return;

  let current = getPreferredTheme();
  applyTheme(current);

  updateToggleA11y(toggle, current);

  toggle.addEventListener("click", () => {
    current = current === "dark" ? "light" : "dark";
    applyTheme(current);
    try {
      localStorage.setItem(STORAGE_KEY, current);
    } catch (error) {}

    updateToggleA11y(toggle, current);
  });
}
