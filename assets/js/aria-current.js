const normalizeRouteKey = (pathname) => {
  const finalSegment = pathname.split("/").pop() || "index.html";
  return finalSegment.replace(/\.html$/, "");
};

export function applyAriaCurrent() {
  const links = Array.from(
    document.querySelectorAll(".nav__links a[href], .footer__list a[href]"),
  );
  if (!links.length) return;

  const currentRouteKey = normalizeRouteKey(window.location.pathname);

  const matches = links.filter((link) => {
    if (link.hash) return false;
    return normalizeRouteKey(link.pathname) === currentRouteKey;
  });

  const active = matches[0];

  links.forEach((link) => {
    if (link === active) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}
