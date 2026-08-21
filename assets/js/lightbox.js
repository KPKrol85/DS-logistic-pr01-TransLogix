import { initIcons } from "./icons.js";

/*
 * Fullscreen is owned by the browser, the open/closed gallery is owned by this
 * module. The two are related but separate: `document.fullscreenElement` is the
 * only source of truth for the first, and it is read back from
 * `fullscreenchange` rather than assumed from the click that requested it. That
 * way a fullscreen exit the page never initiated - Escape, the browser chrome,
 * the window manager - still leaves the normal lightbox intact and correct.
 */
const FULLSCREEN_STATES = {
  enter: { label: "Pełny ekran", icon: "expand" },
  exit: { label: "Zamknij pełny ekran", icon: "collapse" },
};

export function initLightbox() {
  const triggers = Array.from(
    document.querySelectorAll(".lightbox-trigger[data-gallery]"),
  );
  const lightbox = document.querySelector(".lightbox");
  const dialog = lightbox?.querySelector(".lightbox__dialog");
  const titleEl = lightbox?.querySelector(".lightbox__title");
  const heroImg = lightbox?.querySelector(".lightbox__hero");
  const heroPicture = heroImg?.closest("picture");
  const grid = lightbox?.querySelector(".lightbox__grid");
  const closeBtn = lightbox?.querySelector("[data-lightbox-close]");
  const prevBtn = lightbox?.querySelector("[data-lightbox-prev]");
  const nextBtn = lightbox?.querySelector("[data-lightbox-next]");
  const fullscreenBtn = lightbox?.querySelector("[data-lightbox-fullscreen]");
  const fullscreenIcon = fullscreenBtn?.querySelector("[data-icon]");
  if (
    !lightbox ||
    !dialog ||
    !titleEl ||
    !heroImg ||
    !heroPicture ||
    !grid ||
    !closeBtn ||
    !prevBtn ||
    !nextBtn ||
    !fullscreenBtn ||
    !fullscreenIcon ||
    !triggers.length
  ) {
    return;
  }

  const heroAvifSource = document.createElement("source");
  heroAvifSource.type = "image/avif";
  const heroWebpSource = document.createElement("source");
  heroWebpSource.type = "image/webp";
  heroPicture.insertBefore(heroAvifSource, heroImg);
  heroPicture.insertBefore(heroWebpSource, heroImg);

  const metaEl = document.createElement("p");
  metaEl.className = "lightbox__meta";
  metaEl.setAttribute("aria-live", "polite");
  titleEl.insertAdjacentElement("afterend", metaEl);

  const GALLERIES = {
    solo: [
      {
        avif: "assets/img/fleet/bus/1.avif",
        webp: "assets/img/fleet/bus/1.webp",
        jpg: "assets/img/fleet/bus/1.jpg",
        alt: "Bus dostawczy - zdjęcie 1",
      },
      {
        avif: "assets/img/fleet/bus/2.avif",
        webp: "assets/img/fleet/bus/2.webp",
        jpg: "assets/img/fleet/bus/2.jpg",
        alt: "Bus dostawczy - zdjęcie 2",
      },
      {
        avif: "assets/img/fleet/bus/3.avif",
        webp: "assets/img/fleet/bus/3.webp",
        jpg: "assets/img/fleet/bus/3.jpg",
        alt: "Bus dostawczy - zdjęcie 3",
      },
      {
        avif: "assets/img/fleet/bus/4.avif",
        webp: "assets/img/fleet/bus/4.webp",
        jpg: "assets/img/fleet/bus/4.jpg",
        alt: "Bus dostawczy - zdjęcie 4",
      },
      {
        avif: "assets/img/fleet/bus/5.avif",
        webp: "assets/img/fleet/bus/5.webp",
        jpg: "assets/img/fleet/bus/5.jpg",
        alt: "Bus dostawczy - zdjęcie 5",
      },
      {
        avif: "assets/img/fleet/bus/6.avif",
        webp: "assets/img/fleet/bus/6.webp",
        jpg: "assets/img/fleet/bus/6.jpg",
        alt: "Bus dostawczy - zdjęcie 6",
      },
    ],
    truck: [
      {
        avif: "assets/img/fleet/truck/truck-1.avif",
        webp: "assets/img/fleet/truck/truck-1.webp",
        jpg: "assets/img/fleet/truck/truck-1.jpg",
        alt: "Ciężarówka plandeka - zdjęcie 1",
      },
      {
        avif: "assets/img/fleet/truck/truck-2.avif",
        webp: "assets/img/fleet/truck/truck-2.webp",
        jpg: "assets/img/fleet/truck/truck-2.jpg",
        alt: "Ciężarówka plandeka - zdjęcie 2",
      },
      {
        avif: "assets/img/fleet/truck/truck-3.avif",
        webp: "assets/img/fleet/truck/truck-3.webp",
        jpg: "assets/img/fleet/truck/truck-3.jpg",
        alt: "Ciężarówka plandeka - zdjęcie 3",
      },
      {
        avif: "assets/img/fleet/truck/truck-4.avif",
        webp: "assets/img/fleet/truck/truck-4.webp",
        jpg: "assets/img/fleet/truck/truck-4.jpg",
        alt: "Ciężarówka plandeka - zdjęcie 4",
      },
      {
        avif: "assets/img/fleet/truck/truck-5.avif",
        webp: "assets/img/fleet/truck/truck-5.webp",
        jpg: "assets/img/fleet/truck/truck-5.jpg",
        alt: "Ciężarówka plandeka - zdjęcie 5",
      },
      {
        avif: "assets/img/fleet/truck/truck-6.avif",
        webp: "assets/img/fleet/truck/truck-6.webp",
        jpg: "assets/img/fleet/truck/truck-6.jpg",
        alt: "Ciężarówka plandeka - zdjęcie 6",
      },
    ],
    chlodnia: [
      {
        avif: "assets/img/fleet/chlodnia/1.avif",
        webp: "assets/img/fleet/chlodnia/1.webp",
        jpg: "assets/img/fleet/chlodnia/1.jpg",
        alt: "Ciężarówka chłodnia - zdjęcie 1",
      },
      {
        avif: "assets/img/fleet/chlodnia/2.avif",
        webp: "assets/img/fleet/chlodnia/2.webp",
        jpg: "assets/img/fleet/chlodnia/2.jpg",
        alt: "Ciężarówka chłodnia - zdjęcie 2",
      },
      {
        avif: "assets/img/fleet/chlodnia/3.avif",
        webp: "assets/img/fleet/chlodnia/3.webp",
        jpg: "assets/img/fleet/chlodnia/3.jpg",
        alt: "Ciężarówka chłodnia - zdjęcie 3",
      },
      {
        avif: "assets/img/fleet/chlodnia/4.avif",
        webp: "assets/img/fleet/chlodnia/4.webp",
        jpg: "assets/img/fleet/chlodnia/4.jpg",
        alt: "Ciężarówka chłodnia - zdjęcie 4",
      },
      {
        avif: "assets/img/fleet/chlodnia/5.avif",
        webp: "assets/img/fleet/chlodnia/5.webp",
        jpg: "assets/img/fleet/chlodnia/5.jpg",
        alt: "Ciężarówka chłodnia - zdjęcie 5",
      },
      {
        avif: "assets/img/fleet/chlodnia/6.avif",
        webp: "assets/img/fleet/chlodnia/6.webp",
        jpg: "assets/img/fleet/chlodnia/6.jpg",
        alt: "Ciężarówka chłodnia - zdjęcie 6",
      },
    ],
    set: [
      {
        avif: "assets/img/fleet/mega/1.avif",
        webp: "assets/img/fleet/mega/1.webp",
        jpg: "assets/img/fleet/mega/1.jpg",
        alt: "Zestaw Mega - zdjęcie 1",
      },
      {
        avif: "assets/img/fleet/mega/2.avif",
        webp: "assets/img/fleet/mega/2.webp",
        jpg: "assets/img/fleet/mega/2.jpg",
        alt: "Zestaw Mega - zdjęcie 2",
      },
      {
        avif: "assets/img/fleet/mega/3.avif",
        webp: "assets/img/fleet/mega/3.webp",
        jpg: "assets/img/fleet/mega/3.jpg",
        alt: "Zestaw Mega - zdjęcie 3",
      },
      {
        avif: "assets/img/fleet/mega/4.avif",
        webp: "assets/img/fleet/mega/4.webp",
        jpg: "assets/img/fleet/mega/4.jpg",
        alt: "Zestaw Mega - zdjęcie 4",
      },
      {
        avif: "assets/img/fleet/mega/5.avif",
        webp: "assets/img/fleet/mega/5.webp",
        jpg: "assets/img/fleet/mega/5.jpg",
        alt: "Zestaw Mega - zdjęcie 5",
      },
      {
        avif: "assets/img/fleet/mega/6.avif",
        webp: "assets/img/fleet/mega/6.webp",
        jpg: "assets/img/fleet/mega/6.jpg",
        alt: "Zestaw Mega - zdjęcie 6",
      },
    ],
  };

  const supportsFullscreen =
    typeof lightbox.requestFullscreen === "function" &&
    typeof document.exitFullscreen === "function" &&
    document.fullscreenEnabled !== false;

  let currentGalleryKey = "";
  let currentImageIndex = 0;
  let lastTrigger = null;
  let scrollY = 0;
  let lastTapTime = 0;
  /*
   * When fullscreen ends, the timestamp of the event that ended it. Keyboard
   * and fullscreen events share one clock, so an Escape stamped at or before
   * this belongs to the gesture that left fullscreen and must not also close
   * the gallery, while any later Escape is a fresh press.
   */
  let fullscreenExitStamp = -1;

  const clampIndex = (index, length) => {
    if (!length || !Number.isFinite(index)) return 0;
    return Math.min(Math.max(index, 0), length - 1);
  };

  const getItemFallbackSrc = (item) =>
    item?.jpg || item?.webp || item?.avif || item?.src || "";

  const setPictureSource = (source, value) => {
    if (value) {
      source.srcset = value;
    } else {
      source.removeAttribute("srcset");
    }
  };

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

  const getDialogFocusable = () =>
    Array.from(dialog.querySelectorAll("button")).filter(
      (node) => !node.closest("[hidden]"),
    );

  const setCurrentImage = (index) => {
    const items = GALLERIES[currentGalleryKey] || [];
    if (!items.length) return;
    currentImageIndex = clampIndex(index, items.length);
    const item = items[currentImageIndex];
    setPictureSource(heroAvifSource, item.avif);
    setPictureSource(heroWebpSource, item.webp);
    heroImg.src = getItemFallbackSrc(item);
    heroImg.alt = item.alt || "";
    metaEl.textContent = `Zdjęcie ${currentImageIndex + 1} z ${items.length}`;
  };

  const isFullscreen = () => document.fullscreenElement === lightbox;

  const syncHeroHint = () => {
    if (!supportsFullscreen) {
      heroImg.removeAttribute("title");
      return;
    }
    if (!isFullscreen()) {
      heroImg.title = "Otwórz pełny ekran";
      return;
    }
    heroImg.title = lightbox.classList.contains("is-zoomed")
      ? "Kliknij, aby dopasować zdjęcie"
      : "Kliknij, aby wypełnić ekran";
  };

  const syncFullscreenUi = () => {
    const state = isFullscreen()
      ? FULLSCREEN_STATES.exit
      : FULLSCREEN_STATES.enter;
    fullscreenBtn.setAttribute("aria-label", state.label);
    fullscreenBtn.title = state.label;
    if (fullscreenIcon.dataset.icon !== state.icon) {
      fullscreenIcon.dataset.icon = state.icon;
      initIcons(fullscreenBtn);
    }
    syncHeroHint();
  };

  const enterFullscreen = () => {
    if (!supportsFullscreen || document.fullscreenElement) return;
    lightbox.requestFullscreen().catch(() => {});
  };

  const exitFullscreen = () => {
    if (!isFullscreen()) return Promise.resolve();
    return document.exitFullscreen().catch(() => {});
  };

  const toggleFullscreen = () => {
    if (isFullscreen()) exitFullscreen();
    else enterFullscreen();
  };

  const applyTriggerState = (triggerEl) => {
    const key = triggerEl.dataset.gallery;
    const items = GALLERIES[key] || [];
    if (!key || !items.length) return false;
    currentGalleryKey = key;
    currentImageIndex = clampIndex(
      Number.parseInt(triggerEl.dataset.lightboxIndex || "0", 10),
      items.length,
    );
    titleEl.textContent = triggerEl.dataset.title || "Galeria pojazdu";
    grid.hidden = true;
    grid.innerHTML = "";
    setCurrentImage(currentImageIndex);
    return true;
  };

  const open = (triggerEl) => {
    if (!applyTriggerState(triggerEl)) return;
    lastTrigger = triggerEl;
    lightbox.classList.remove("is-zoomed");
    lightbox.hidden = false;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    lockScroll();
    syncFullscreenUi();
    closeBtn.focus();
  };

  const close = () => {
    const wasFullscreen = isFullscreen();
    const leftFullscreen = exitFullscreen();
    lightbox.classList.remove("is-open", "is-zoomed");
    lightbox.setAttribute("aria-hidden", "true");
    lightbox.hidden = true;
    unlockScroll();
    if (wasFullscreen) {
      /* The browser moves focus while it leaves fullscreen, so hand the
       * thumbnail its focus back only once that has settled. */
      leftFullscreen.then(() => lastTrigger?.focus());
      return;
    }
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

  lightbox.classList.toggle("has-fullscreen", supportsFullscreen);
  fullscreenBtn.hidden = !supportsFullscreen;
  syncFullscreenUi();

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => open(trigger));
  });

  closeBtn.addEventListener("click", close);
  nextBtn.addEventListener("click", nextImage);
  prevBtn.addEventListener("click", prevImage);
  fullscreenBtn.addEventListener("click", toggleFullscreen);
  heroImg.addEventListener("click", () => {
    if (!isFullscreen()) return;
    lightbox.classList.toggle("is-zoomed");
    syncHeroHint();
  });
  heroImg.addEventListener("dblclick", (e) => {
    e.preventDefault();
    if (!isFullscreen()) enterFullscreen();
  });
  heroImg.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse") return;
    const now = Date.now();
    const isDoubleTap = now - lastTapTime <= 300;
    lastTapTime = now;
    if (!isDoubleTap) return;
    e.preventDefault();
    lastTapTime = 0;
    if (!isFullscreen()) enterFullscreen();
  });
  lightbox.addEventListener(
    "touchmove",
    (e) => {
      if (!lightbox.hidden) e.preventDefault();
    },
    { passive: false },
  );

  document.addEventListener("fullscreenchange", (e) => {
    if (!isFullscreen()) {
      fullscreenExitStamp = e.timeStamp;
      /* Fill-the-screen framing is a fullscreen-only mode, never inherited. */
      lightbox.classList.remove("is-zoomed");
    }
    syncFullscreenUi();
    if (lightbox.hidden) return;
    if (!dialog.contains(document.activeElement)) {
      (fullscreenBtn.hidden ? closeBtn : fullscreenBtn).focus();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (lightbox.hidden) return;
    if (e.key === "Escape") {
      /*
       * While fullscreen is on, Escape means "leave fullscreen", never "close
       * the gallery". Ask the Fullscreen API rather than trusting the browser
       * to consume the key: Chromium and Firefox do, embedded and automated
       * browsers do not, and a redundant exit request is harmless. Whichever
       * exit wins, `fullscreenchange` is what restores the normal layout.
       */
      if (isFullscreen()) {
        exitFullscreen();
        return;
      }
      /*
       * Engines that deliver the key only after `fullscreenchange` would
       * otherwise close the gallery on the same press that left fullscreen.
       */
      if (e.timeStamp <= fullscreenExitStamp) return;
      close();
      return;
    }
    if (e.key === "ArrowRight") nextImage();
    if (e.key === "ArrowLeft") prevImage();
    if (e.key === "Tab") trapFocus(e, getDialogFocusable());
  });
}
