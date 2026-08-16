
export function initAccordion() {
  const accordions = document.querySelectorAll(".accordion__item");
  if (!accordions.length) return;

  const closeItem = (item) => {
    const btn = item.querySelector(".accordion__button");
    const panel = item.querySelector(".accordion__panel");
    if (!btn || !panel) return;
    if (btn.getAttribute("aria-expanded") === "false") return;

    btn.setAttribute("aria-expanded", "false");
    item.classList.remove("is-open");
    panel.style.maxHeight = `${panel.scrollHeight}px`;
    panel.offsetHeight;
    panel.style.maxHeight = "0px";

    const onCloseEnd = () => {
      panel.setAttribute("hidden", "true");
      panel.style.maxHeight = "";
      panel.removeEventListener("transitionend", onCloseEnd);
    };
    panel.addEventListener("transitionend", onCloseEnd);
  };

  const closeAll = (except) => {
    accordions.forEach((item) => {
      if (item === except) return;
      closeItem(item);
    });
  };

  const openItem = (item) => {
    const btn = item.querySelector(".accordion__button");
    const panel = item.querySelector(".accordion__panel");
    if (!btn || !panel) return;

    btn.setAttribute("aria-expanded", "true");
    item.classList.add("is-open");
    panel.removeAttribute("hidden");
    panel.style.maxHeight = "0px";
    panel.offsetHeight; 
    panel.style.maxHeight = `${panel.scrollHeight}px`;

    const onOpenEnd = () => {
      if (item.classList.contains("is-open")) {
        panel.style.maxHeight = "none";
      }
      panel.removeEventListener("transitionend", onOpenEnd);
    };
    panel.addEventListener("transitionend", onOpenEnd);
  };

  accordions.forEach((item) => {
    const btn = item.querySelector(".accordion__button");
    const panel = item.querySelector(".accordion__panel");
    if (!btn || !panel) return;

    btn.addEventListener("click", () => {
      const isOpen = btn.getAttribute("aria-expanded") === "true";
      closeAll(item);
      if (isOpen) {
        closeItem(item);
        return;
      }
      openItem(item);
    });
  });
}
