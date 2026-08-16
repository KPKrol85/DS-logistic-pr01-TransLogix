export function applyAriaCurrent() {
  const links = Array.from(document.querySelectorAll(".nav__links a[href], .footer__list a[href]"));
  if (!links.length) return;

  const fullPath = window.location.pathname;
  let fileName = fullPath.split("/").pop();

  if (!fileName) {
    fileName = "index.html";
  }

  const matches = links.filter((link) => {
    const href = link.getAttribute("href");
    const isHomeLink = href === "/" || href === "./" || href === "index.html";
    return href === fileName || href === fullPath || (isHomeLink && (fullPath === "/" || fileName === "index.html"));
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
