const STORAGE_KEY = "translogix-theme";

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

function applyTheme(theme) {
  const root = document.documentElement;
  const shouldBeDark = theme === "dark";
  const isDark = root.classList.contains("theme-dark");
  if (isDark === shouldBeDark) return;
  root.classList.toggle("theme-dark", shouldBeDark);
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
