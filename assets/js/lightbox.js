export function initLightbox() {
  const triggers = Array.from(document.querySelectorAll(".lightbox-trigger[data-gallery]"));
  const lightbox = document.querySelector(".lightbox");
  const dialog = lightbox?.querySelector(".lightbox__dialog");
  const titleEl = lightbox?.querySelector(".lightbox__title");
  const heroImg = lightbox?.querySelector(".lightbox__hero");
  const grid = lightbox?.querySelector(".lightbox__grid");
  const closeBtn = lightbox?.querySelector("[data-lightbox-close]");
  const prevBtn = lightbox?.querySelector("[data-lightbox-prev]");
  const nextBtn = lightbox?.querySelector("[data-lightbox-next]");
  const zoom = lightbox?.querySelector(".lightbox__zoom");
  const zoomImg = lightbox?.querySelector(".lightbox__zoom-img");
  const zoomClose = lightbox?.querySelector(".lightbox__zoom-close");
  if (!lightbox || !dialog || !titleEl || !heroImg || !grid || !closeBtn || !prevBtn || !nextBtn || !zoom || !zoomImg || !zoomClose || !triggers.length) {
    return;
  }

  const metaEl = document.createElement("p");
  metaEl.className = "lightbox__meta";
  metaEl.setAttribute("aria-live", "polite");
  titleEl.insertAdjacentElement("afterend", metaEl);
  heroImg.title = "Otwórz pełny ekran";

  const GALLERIES = {
    solo: [
      { avif: "assets/img/fleet/bus/1.avif", webp: "assets/img/fleet/bus/1.webp", jpg: "assets/img/fleet/bus/1.jpg", alt: "Bus dostawczy - zdjęcie 1" },
      { avif: "assets/img/fleet/bus/2.avif", webp: "assets/img/fleet/bus/2.webp", jpg: "assets/img/fleet/bus/2.jpg", alt: "Bus dostawczy - zdjęcie 2" },
      { avif: "assets/img/fleet/bus/3.avif", webp: "assets/img/fleet/bus/3.webp", jpg: "assets/img/fleet/bus/3.jpg", alt: "Bus dostawczy - zdjęcie 3" },
      { avif: "assets/img/fleet/bus/4.avif", webp: "assets/img/fleet/bus/4.webp", jpg: "assets/img/fleet/bus/4.jpg", alt: "Bus dostawczy - zdjęcie 4" },
      { avif: "assets/img/fleet/bus/5.avif", webp: "assets/img/fleet/bus/5.webp", jpg: "assets/img/fleet/bus/5.jpg", alt: "Bus dostawczy - zdjęcie 5" },
      { avif: "assets/img/fleet/bus/6.avif", webp: "assets/img/fleet/bus/6.webp", jpg: "assets/img/fleet/bus/6.jpg", alt: "Bus dostawczy - zdjęcie 6" },
    ],
    truck: [
      { avif: "assets/img/fleet/truck/truck-1.avif", webp: "assets/img/fleet/truck/truck-1.webp", jpg: "assets/img/fleet/truck/truck-1.jpg", alt: "Ciężarówka plandeka - zdjęcie 1" },
      { avif: "assets/img/fleet/truck/truck-2.avif", webp: "assets/img/fleet/truck/truck-2.webp", jpg: "assets/img/fleet/truck/truck-2.jpg", alt: "Ciężarówka plandeka - zdjęcie 2" },
      { avif: "assets/img/fleet/truck/truck-3.avif", webp: "assets/img/fleet/truck/truck-3.webp", jpg: "assets/img/fleet/truck/truck-3.jpg", alt: "Ciężarówka plandeka - zdjęcie 3" },
      { avif: "assets/img/fleet/truck/truck-4.avif", webp: "assets/img/fleet/truck/truck-4.webp", jpg: "assets/img/fleet/truck/truck-4.jpg", alt: "Ciężarówka plandeka - zdjęcie 4" },
      { avif: "assets/img/fleet/truck/truck-5.avif", webp: "assets/img/fleet/truck/truck-5.webp", jpg: "assets/img/fleet/truck/truck-5.jpg", alt: "Ciężarówka plandeka - zdjęcie 5" },
      { avif: "assets/img/fleet/truck/truck-6.avif", webp: "assets/img/fleet/truck/truck-6.webp", jpg: "assets/img/fleet/truck/truck-6.jpg", alt: "Ciężarówka plandeka - zdjęcie 6" },
    ],
    chlodnia: [
      { avif: "assets/img/fleet/chlodnia/1.avif", webp: "assets/img/fleet/chlodnia/1.webp", jpg: "assets/img/fleet/chlodnia/1.jpg", alt: "Ciężarówka chłodnia - zdjęcie 1" },
      { avif: "assets/img/fleet/chlodnia/2.avif", webp: "assets/img/fleet/chlodnia/2.webp", jpg: "assets/img/fleet/chlodnia/2.jpg", alt: "Ciężarówka chłodnia - zdjęcie 2" },
      { avif: "assets/img/fleet/chlodnia/3.avif", webp: "assets/img/fleet/chlodnia/3.webp", jpg: "assets/img/fleet/chlodnia/3.jpg", alt: "Ciężarówka chłodnia - zdjęcie 3" },
      { avif: "assets/img/fleet/chlodnia/4.avif", webp: "assets/img/fleet/chlodnia/4.webp", jpg: "assets/img/fleet/chlodnia/4.jpg", alt: "Ciężarówka chłodnia - zdjęcie 4" },
      { avif: "assets/img/fleet/chlodnia/5.avif", webp: "assets/img/fleet/chlodnia/5.webp", jpg: "assets/img/fleet/chlodnia/5.jpg", alt: "Ciężarówka chłodnia - zdjęcie 5" },
      { avif: "assets/img/fleet/chlodnia/6.avif", webp: "assets/img/fleet/chlodnia/6.webp", jpg: "assets/img/fleet/chlodnia/6.jpg", alt: "Ciężarówka chłodnia - zdjęcie 6" },
    ],
    set: [
      { avif: "assets/img/fleet/mega/1.avif", jpg: "assets/img/fleet/mega/1.jpg", alt: "Zestaw Mega - zdjęcie 1" },
      { avif: "assets/img/fleet/mega/2.avif", webp: "assets/img/fleet/mega/2.webp", jpg: "assets/img/fleet/mega/2.jpg", alt: "Zestaw Mega - zdjęcie 2" },
      { avif: "assets/img/fleet/mega/3.avif", webp: "assets/img/fleet/mega/3.webp", jpg: "assets/img/fleet/mega/3.jpg", alt: "Zestaw Mega - zdjęcie 3" },
      { avif: "assets/img/fleet/mega/4.avif", webp: "assets/img/fleet/mega/4.webp", jpg: "assets/img/fleet/mega/4.jpg", alt: "Zestaw Mega - zdjęcie 4" },
      { avif: "assets/img/fleet/mega/5.avif", webp: "assets/img/fleet/mega/5.webp", jpg: "assets/img/fleet/mega/5.jpg", alt: "Zestaw Mega - zdjęcie 5" },
      { avif: "assets/img/fleet/mega/6.avif", webp: "assets/img/fleet/mega/6.webp", jpg: "assets/img/fleet/mega/6.jpg", alt: "Zestaw Mega - zdjęcie 6" },
    ],
  };

  let currentGalleryKey = "";
  let currentImageIndex = 0;
  let lastTrigger = null;
  let scrollY = 0;
  let zoomOpen = false;
  let lastZoomTriggerEl = null;
  let lastTapTime = 0;

  const clampIndex = (index, length) => {
    if (!length || !Number.isFinite(index)) return 0;
    return Math.min(Math.max(index, 0), length - 1);
  };

  const getItemSrc = (item) => item?.jpg || item?.webp || item?.avif || item?.src || "";

  const lockScroll = () => {
    scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.classList.add("no-scroll");
  };

  const unlockScroll = () => {
    document.body.classList.remove("no-scroll");
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    window.scrollTo(0, scrollY);
  };

  const getDialogFocusable = () => Array.from(dialog.querySelectorAll("button")).filter((node) => !node.closest("[hidden]"));
  const getZoomFocusable = () => Array.from(zoom.querySelectorAll("button,[href],[tabindex]:not([tabindex='-1'])"));

  const setCurrentImage = (index) => {
    const items = GALLERIES[currentGalleryKey] || [];
    if (!items.length) return;
    currentImageIndex = clampIndex(index, items.length);
    const item = items[currentImageIndex];
    heroImg.src = getItemSrc(item);
    heroImg.alt = item.alt || "";
    metaEl.textContent = `Zdjęcie ${currentImageIndex + 1} z ${items.length}`;
  };

  const requestZoomFullscreen = () => {
    if (document.fullscreenElement || typeof zoom.requestFullscreen !== "function") return;
    zoom.requestFullscreen().catch(() => {});
  };

  const exitZoomFullscreen = () => {
    if (document.fullscreenElement !== zoom || typeof document.exitFullscreen !== "function") return;
    document.exitFullscreen().catch(() => {});
  };

  const openZoom = ({ fullscreen = false } = {}) => {
    const src = heroImg.currentSrc || heroImg.src || "";
    if (!src) return;
    lastZoomTriggerEl = document.activeElement;
    zoom.classList.remove("is-zoomed");
    zoomImg.src = src;
    zoomImg.alt = heroImg.alt || "";
    zoomImg.title = "Kliknij, aby wypełnić ekran";
    zoom.hidden = false;
    zoom.setAttribute("aria-hidden", "false");
    dialog.setAttribute("aria-hidden", "true");
    zoomOpen = true;
    zoomClose.focus();
    if (fullscreen) requestZoomFullscreen();
  };

  const closeZoom = () => {
    exitZoomFullscreen();
    zoom.classList.remove("is-zoomed");
    zoom.hidden = true;
    zoom.setAttribute("aria-hidden", "true");
    zoomImg.src = "";
    zoomImg.alt = "";
    zoomOpen = false;
    dialog.removeAttribute("aria-hidden");
    if (lastZoomTriggerEl && typeof lastZoomTriggerEl.focus === "function") lastZoomTriggerEl.focus();
    lastZoomTriggerEl = null;
  };

  const applyTriggerState = (triggerEl) => {
    const key = triggerEl.dataset.gallery;
    const items = GALLERIES[key] || [];
    if (!key || !items.length) return false;
    currentGalleryKey = key;
    currentImageIndex = clampIndex(Number.parseInt(triggerEl.dataset.lightboxIndex || "0", 10), items.length);
    titleEl.textContent = triggerEl.dataset.title || "Galeria pojazdu";
    grid.hidden = true;
    grid.innerHTML = "";
    setCurrentImage(currentImageIndex);
    return true;
  };

  const open = (triggerEl) => {
    if (!applyTriggerState(triggerEl)) return;
    lastTrigger = triggerEl;
    lightbox.hidden = false;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    lockScroll();
    closeBtn.focus();
  };

  const close = () => {
    if (zoomOpen) closeZoom();
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    lightbox.hidden = true;
    unlockScroll();
    lastTrigger?.focus();
  };

  const nextImage = () => {
    const items = GALLERIES[currentGalleryKey] || [];
    if (!items.length) return;
    setCurrentImage((currentImageIndex + 1) % items.length);
  };

  const prevImage = () => {
    const items = GALLERIES[currentGalleryKey] || [];
    if (!items.length) return;
    setCurrentImage((currentImageIndex - 1 + items.length) % items.length);
  };

  const trapFocus = (e, nodes) => {
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => open(trigger));
  });

  closeBtn.addEventListener("click", close);
  nextBtn.addEventListener("click", nextImage);
  prevBtn.addEventListener("click", prevImage);
  heroImg.addEventListener("dblclick", (e) => {
    e.preventDefault();
    openZoom({ fullscreen: true });
  });
  heroImg.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse") return;
    const now = Date.now();
    const isDoubleTap = now - lastTapTime <= 300;
    lastTapTime = now;
    if (!isDoubleTap) return;
    e.preventDefault();
    lastTapTime = 0;
    openZoom({ fullscreen: true });
  });
  zoomClose.addEventListener("click", closeZoom);
  zoom.addEventListener("click", (e) => {
    if (e.target === zoom) closeZoom();
  });
  zoomImg.addEventListener("click", (e) => {
    e.stopPropagation();
    const isZoomed = zoom.classList.toggle("is-zoomed");
    zoomImg.title = isZoomed ? "Kliknij, aby dopasować zdjęcie" : "Kliknij, aby wypełnić ekran";
  });
  lightbox.addEventListener(
    "touchmove",
    (e) => {
      if (!lightbox.hidden && !zoomOpen) e.preventDefault();
    },
    { passive: false },
  );

  document.addEventListener("keydown", (e) => {
    if (lightbox.hidden) return;
    if (zoomOpen) {
      if (e.key === "Escape") closeZoom();
      if (e.key === "Tab") trapFocus(e, getZoomFocusable());
      return;
    }
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") nextImage();
    if (e.key === "ArrowLeft") prevImage();
    if (e.key === "Tab") trapFocus(e, getDialogFocusable());
  });
}
