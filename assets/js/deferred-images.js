const DEFERRED_IMAGE_URLS = {
  facebook: new URL("../img/svg/fb.svg", import.meta.url).href,
  instagram: new URL("../img/svg/insta.svg", import.meta.url).href,
  linkedin: new URL("../img/svg/linkedin.svg", import.meta.url).href,
  github: new URL("../img/svg/github.svg", import.meta.url).href,
};

function loadDeferredImage(image) {
  const imageUrl = DEFERRED_IMAGE_URLS[image.dataset.deferredImage];
  if (imageUrl) {
    image.src = imageUrl;
  }
}

export function initDeferredImages() {
  const images = [...document.querySelectorAll("[data-deferred-image]")];
  if (!images.length) return;

  if (!("IntersectionObserver" in window)) {
    images.forEach(loadDeferredImage);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        loadDeferredImage(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px", threshold: 0.01 },
  );

  images.forEach((image) => observer.observe(image));
}
