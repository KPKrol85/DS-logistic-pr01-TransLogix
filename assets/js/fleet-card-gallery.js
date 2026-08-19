export function initFleetCardGalleries() {
  const cardWidths = [320, 640];
  const fullImageWidth = 800;

  const getResponsivePath = (src, width) => {
    const match = src?.match(/^(assets\/img\/fleet\/)(.+)(\.[^.]+)$/);
    if (!match) return src || "";
    return `${match[1]}responsive/${match[2]}-${width}${match[3]}`;
  };

  const getCardSrcset = (src) => {
    if (!src) return "";
    return [...cardWidths.map((width) => `${getResponsivePath(src, width)} ${width}w`), `${src} ${fullImageWidth}w`].join(", ");
  };

  const galleries = document.querySelectorAll(".fleet-card__gallery");
  if (!galleries.length) return;

  galleries.forEach((gallery) => {
    const mainTrigger = gallery.querySelector(".fleet-card__main.lightbox-trigger[data-gallery]");
    const mainAvifSource = gallery.querySelector("[data-fleet-main-source='avif']");
    const mainWebpSource = gallery.querySelector("[data-fleet-main-source='webp']");
    const mainImage = gallery.querySelector("[data-fleet-main-image]");
    const thumbs = gallery.querySelectorAll("[data-fleet-thumb]");
    if (!mainImage || !thumbs.length) return;

    if (mainTrigger) mainTrigger.dataset.lightboxIndex = "0";

    thumbs.forEach((thumb, index) => {
      thumb.dataset.lightboxIndex = String(index);

      thumb.addEventListener("click", () => {
        const { mainAvif, mainWebp, mainJpg, mainAlt } = thumb.dataset;
        if (!mainJpg) return;

        if (mainAvifSource && mainAvif) mainAvifSource.srcset = getCardSrcset(mainAvif);
        if (mainWebpSource && mainWebp) mainWebpSource.srcset = getCardSrcset(mainWebp);
        mainImage.srcset = getCardSrcset(mainJpg);
        mainImage.src = getResponsivePath(mainJpg, cardWidths[0]);
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
