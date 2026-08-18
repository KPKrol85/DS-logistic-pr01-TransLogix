export function initDeferredMap() {
  const mapComponents = document.querySelectorAll("[data-deferred-map]");

  mapComponents.forEach((component) => {
    if (component.dataset.mapInitialized === "true") return;

    const activateButton = component.querySelector("[data-map-activate]");
    const placeholder = component.querySelector("[data-map-placeholder]");
    const target = component.querySelector("[data-map-target]");
    const mapSrc = component.dataset.mapSrc;
    const mapTitle = component.dataset.mapTitle;

    if (!activateButton || !placeholder || !target || !mapSrc || !mapTitle) return;

    component.dataset.mapInitialized = "true";
    activateButton.hidden = false;

    activateButton.addEventListener(
      "click",
      () => {
        if (target.querySelector("iframe")) return;

        const iframe = document.createElement("iframe");
        iframe.title = mapTitle;
        iframe.loading = "lazy";
        iframe.referrerPolicy = "no-referrer-when-downgrade";
        iframe.src = mapSrc;

        target.append(iframe);
        placeholder.remove();
      },
      { once: true },
    );
  });
}
