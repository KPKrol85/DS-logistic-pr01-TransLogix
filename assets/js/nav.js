export function initNav() {
  const nav = document.querySelector(".nav");
  const toggle = nav?.querySelector(".nav__toggle");
  const panel = nav?.querySelector(".nav__panel");
  const headerActions = document.querySelector(".header-actions");
  const cta = headerActions?.querySelector(".nav__cta");
  const linksGroup = panel?.querySelector(".nav__links");
  if (!nav || !toggle || !panel) return;

  const mq = window.matchMedia("(min-width: 900px)");
  const isMobile = () => !mq.matches;

  const panelId = panel.id || "nav-panel";
  panel.id = panelId;
  toggle.setAttribute("aria-controls", panelId);
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-label", "Otwórz menu");
  panel.hidden = false;
  panel.setAttribute("role", panel.getAttribute("role") || "navigation");
  panel.setAttribute("aria-label", panel.getAttribute("aria-label") || "Główne menu");
  panel.setAttribute("aria-hidden", "true");

  const closeMenu = () => {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Otwórz menu");
    panel.classList.remove("nav__panel--open", "is-open");
    panel.setAttribute("aria-hidden", "true");
    if (isMobile()) {
      document.body.classList.remove("no-scroll");
    }
  };

  const openMenu = () => {
    panel.classList.add("nav__panel--open", "is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Zamknij menu");
    panel.setAttribute("aria-hidden", "false");
    if (isMobile()) {
      document.body.classList.add("no-scroll");
      const [firstFocusable] = getPanelFocusable();
      firstFocusable?.focus();
    }
  };

  const getPanelFocusable = () => Array.from(panel.querySelectorAll("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])"));

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    isOpen ? closeMenu() : openMenu();
  });

  toggle.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    isOpen ? closeMenu() : openMenu();
  });

  panel.addEventListener("click", (event) => {
    const trigger = event.target.closest(".nav__links a, .nav__cta");
    if (!trigger) return;
    if (toggle.getAttribute("aria-expanded") === "true") {
      closeMenu();
    }
  });

  document.addEventListener("click", (event) => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    if (!isOpen) return;
    const target = event.target;
    if (!panel.contains(target) && !toggle.contains(target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    if (!isOpen) return;

    if (event.key === "Escape") {
      closeMenu();
      toggle.focus();
      return;
    }

    if (event.key === "Tab" && isMobile()) {
      const focusables = getPanelFocusable();
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  const placeCtaInPanel = () => {
    if (!cta || !linksGroup || panel.contains(cta)) return;
    linksGroup.insertAdjacentElement("afterend", cta);
  };

  const placeCtaInHeader = () => {
    if (!cta || !headerActions || headerActions.contains(cta)) return;
    headerActions.appendChild(cta);
  };

  const handleBreakpointChange = () => {
    if (mq.matches) {
      placeCtaInHeader();
      panel.classList.remove("nav__panel--open", "is-open");
      panel.setAttribute("aria-hidden", "false");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Otwórz menu");
      document.body.classList.remove("no-scroll");
      return;
    }
    placeCtaInPanel();
    panel.classList.remove("nav__panel--open", "is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Otwórz menu");
    panel.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
  };

  handleBreakpointChange();
  mq.addEventListener("change", handleBreakpointChange);
}
