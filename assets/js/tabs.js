
export function initTabs() {
  const tablists = document.querySelectorAll("[role='tablist']");
  tablists.forEach((tablist) => {
    const tabs = tablist.querySelectorAll("[role='tab']");
    const panels = Array.from(tabs).map((tab) => document.getElementById(tab.getAttribute("aria-controls")));

    const activateTab = (tab, { focus = true } = {}) => {
      tabs.forEach((t) => {
        const isActive = t === tab;
        t.setAttribute("aria-selected", isActive);
        t.tabIndex = isActive ? 0 : -1;
        const panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) {
          panel.hidden = !isActive;
        }
      });
      if (focus) {
        tab.focus();
      }
    };

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => activateTab(tab));
      tab.addEventListener("keydown", (e) => {
        const idx = Array.from(tabs).indexOf(tab);
        let nextIdx = idx;
        if (e.key === "ArrowRight") nextIdx = (idx + 1) % tabs.length;
        if (e.key === "ArrowLeft") nextIdx = (idx - 1 + tabs.length) % tabs.length;
        if (e.key === "Home") nextIdx = 0;
        if (e.key === "End") nextIdx = tabs.length - 1;
        if (nextIdx !== idx) {
          e.preventDefault();
          activateTab(tabs[nextIdx]);
        }
      });
    });

    const initial = Array.from(tabs).find((tab) => tab.getAttribute("aria-selected") === "true") || tabs[0];
    activateTab(initial, { focus: false });
  });
}
