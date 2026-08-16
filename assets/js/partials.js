const PARTIALS = {
  header: "partials/header.html",
  footer: "partials/footer.html",
};

const loadPartial = async (host) => {
  const partialName = host.dataset.partial;
  const partialPath = PARTIALS[partialName];

  if (!partialPath) return;

  const response = await fetch(partialPath);

  if (!response.ok) {
    throw new Error(`Failed to load partial: ${partialPath}`);
  }

  host.innerHTML = await response.text();
  host.dataset.partialLoaded = "true";
};

export const initPartials = async () => {
  const partialHosts = document.querySelectorAll("[data-partial]");

  if (!partialHosts.length) return;

  await Promise.all([...partialHosts].map(loadPartial));
};
