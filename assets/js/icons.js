/*
 * Shared SVG icon registry.
 *
 * Every icon lives here once and is rendered into the maintained HTML through
 * `[data-icon]` placeholders, so no page or partial has to repeat SVG path
 * data. Extending the set means adding one entry below - the markup pattern
 * and the rendering stay the same.
 *
 * Icon geometry: Font Awesome Free v7.3.1 by @fontawesome
 * https://fontawesome.com - License https://fontawesome.com/license/free
 * Copyright 2026 Fonticons, Inc.
 */

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

const ICONS = {
  phone: {
    viewBox: "0 0 640 640",
    paths: [
      "M224.2 89C216.3 70.1 195.7 60.1 176.1 65.4L170.6 66.9C106 84.5 50.8 147.1 66.9 223.3C104 398.3 241.7 536 416.7 573.1C493 589.3 555.5 534 573.1 469.4L574.6 463.9C580 444.2 569.9 423.6 551.1 415.8L453.8 375.3C437.3 368.4 418.2 373.2 406.8 387.1L368.2 434.3C297.9 399.4 241.3 341 208.8 269.3L253 233.3C266.9 222 271.6 202.9 264.8 186.3L224.2 89z",
    ],
  },
  email: {
    viewBox: "0 0 640 640",
    paths: [
      "M112 128C85.5 128 64 149.5 64 176C64 191.1 71.1 205.3 83.2 214.4L291.2 370.4C308.3 383.2 331.7 383.2 348.8 370.4L556.8 214.4C568.9 205.3 576 191.1 576 176C576 149.5 554.5 128 528 128L112 128zM64 260L64 448C64 483.3 92.7 512 128 512L512 512C547.3 512 576 483.3 576 448L576 260L377.6 408.8C343.5 434.4 296.5 434.4 262.4 408.8L64 260z",
    ],
  },
};

function createIconElement(icon) {
  const svg = document.createElementNS(SVG_NAMESPACE, "svg");

  svg.setAttribute("viewBox", icon.viewBox);
  svg.setAttribute("fill", "currentColor");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");

  icon.paths.forEach((pathData) => {
    const path = document.createElementNS(SVG_NAMESPACE, "path");
    path.setAttribute("d", pathData);
    svg.appendChild(path);
  });

  return svg;
}

function renderIcon(placeholder) {
  const icon = ICONS[placeholder.dataset.icon];
  if (!icon) return;

  placeholder.replaceChildren(createIconElement(icon));
}

export function initIcons(root = document) {
  const placeholders = root.querySelectorAll("[data-icon]");
  if (!placeholders.length) return;

  placeholders.forEach(renderIcon);
}
