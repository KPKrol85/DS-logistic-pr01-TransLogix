const root = document.documentElement;
const storageKey = "translogix-theme";

let theme = null;

try {
  const storedTheme = localStorage.getItem(storageKey);
  if (storedTheme === "dark" || storedTheme === "light") {
    theme = storedTheme;
  }
} catch (error) {}

if (!theme) {
  theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

root.classList.toggle("theme-dark", theme === "dark");
