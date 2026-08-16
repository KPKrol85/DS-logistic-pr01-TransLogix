export function initFleetCardGalleries() {
  const galleries = document.querySelectorAll(".fleet-card__gallery");
  if (!galleries.length) return;

  galleries.forEach((gallery) => {
    const mainTrigger = gallery.querySelector(".fleet-card__main.lightbox-trigger[data-gallery]");
    const mainSource = gallery.querySelector("[data-fleet-main-source='avif']");
    const mainImage = gallery.querySelector("[data-fleet-main-image]");
    const thumbs = gallery.querySelectorAll("[data-fleet-thumb]");
    if (!mainImage || !thumbs.length) return;

    if (mainTrigger) mainTrigger.dataset.lightboxIndex = "0";

    thumbs.forEach((thumb, index) => {
      thumb.dataset.lightboxIndex = String(index);

      thumb.addEventListener("click", () => {
        const { mainAvif, mainJpg, mainAlt } = thumb.dataset;
        if (!mainJpg) return;

        if (mainSource && mainAvif) mainSource.srcset = mainAvif;
        mainImage.src = mainJpg;
        mainImage.alt = mainAlt || "";
        if (mainTrigger) mainTrigger.dataset.lightboxIndex = String(index);

        thumbs.forEach((item) => {
          const isCurrent = item === thumb;
          item.classList.toggle("is-active", isCurrent);
          item.setAttribute("aria-pressed", String(isCurrent));
          if (isCurrent) {
            item.setAttribute("aria-current", "true");
          } else {
            item.removeAttribute("aria-current");
          }
        });
      });
    });
  });
}
