const STORAGE_KEY = "translogix-services-filters";

function loadState() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveState(state) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  try {
    return await response.json();
  } catch {
    throw new Error("Invalid JSON");
  }
}

function renderServices(services, container) {
  container.replaceChildren();
  services.forEach((service) => {
    const article = document.createElement("article");
    article.className = "card service-card";
    article.dataset.type = service.type;
    article.dataset.category = service.category;
    const route = service.route || "Trasa na zapytanie";
    const short = service.shortDescription || service.description;
    const icon = service.icon || service.image;
    const linkTarget = service.slug ? `service.html?service=${service.slug}` : `service.html?id=${service.id}`;

    const image = document.createElement("img");
    image.src = icon;
    image.alt = `${service.name} - ikona usługi`;

    const header = document.createElement("div");
    header.className = "service-card__header";

    const title = document.createElement("h3");
    title.textContent = service.name;

    const routeText = document.createElement("p");
    routeText.className = "text-muted";
    routeText.textContent = route;

    header.append(title, routeText);

    const shortDescription = document.createElement("p");
    shortDescription.textContent = short;

    const tags = document.createElement("div");
    tags.className = "filters";
    service.tags.forEach((tag) => {
      const tagEl = document.createElement("span");
      tagEl.className = "tag";
      tagEl.textContent = tag;
      tags.appendChild(tagEl);
    });

    const detailsLink = document.createElement("a");
    detailsLink.className = "btn";
    detailsLink.href = linkTarget;
    detailsLink.textContent = "Szczegóły";

    article.append(image, header, shortDescription, tags, detailsLink);
    container.appendChild(article);
  });
}

function filterServices(services, state) {
  let result = [...services];
  if (state.filter && state.filter !== "all") {
    result = result.filter((s) => s.type === state.filter || s.category === state.filter);
  }
  if (state.price) {
    result = result.filter((s) => s.price <= state.price);
  }
  if (state.sort === "price-asc") result.sort((a, b) => a.price - b.price);
  if (state.sort === "price-desc") result.sort((a, b) => b.price - a.price);
  if (state.sort === "time-asc") result.sort((a, b) => a.time - b.time);
  return result;
}

export async function initServicesFilters() {
  const container = document.getElementById("services-list");
  const chips = document.querySelectorAll(".filters .filter-chip");
  const priceRange = document.getElementById("priceRange");
  const sortSelect = document.getElementById("sort");
  const countEl = document.getElementById("results-count");
  if (!container || !chips.length) return;

  let allServices = [];
  try {
    allServices = await fetchJson("assets/data/services.json");
  } catch (error) {
    console.error("Failed to load services list.", error);
    const errorEl = document.createElement("p");
    errorEl.className = "text-muted";
    errorEl.textContent = "Nie udało się wczytać usług. Spróbuj ponownie.";
    container.replaceChildren(errorEl);
    if (countEl) countEl.textContent = "Nie udało się wczytać usług.";
    return;
  }
  const params = new URLSearchParams(window.location.search);
  const urlFilter = params.get("filter");
  let state = { filter: "all", price: Number(priceRange?.value) || 10000, sort: "none", ...loadState() };
  if (urlFilter) state.filter = urlFilter;

  const update = () => {
    const filtered = filterServices(allServices, state);
    renderServices(filtered, container);
    if (countEl) {
      countEl.textContent = filtered.length ? `Wyświetlono ${filtered.length}/${allServices.length}` : "Brak wyników dla wybranych filtrów.";
    }
    if (state.filter && state.filter !== "all") {
      params.set("filter", state.filter);
    } else {
      params.delete("filter");
    }
    const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", nextUrl);
    saveState(state);
  };

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      state.filter = chip.dataset.filter;
      chip.setAttribute("aria-pressed", "true");
      chips.forEach((c) => c !== chip && c.setAttribute("aria-pressed", "false"));
      update();
    });
    if (chip.dataset.filter === state.filter) chip.classList.add("is-active");
    chip.setAttribute("aria-pressed", chip.classList.contains("is-active"));
  });

  if (priceRange) {
    priceRange.value = state.price;
    priceRange.addEventListener("input", () => {
      state.price = Number(priceRange.value);
      update();
    });
  }

  if (sortSelect) {
    sortSelect.value = state.sort;
    sortSelect.addEventListener("change", () => {
      state.sort = sortSelect.value;
      update();
    });
  }

  update();
}

const priceRange = document.getElementById("priceRange");
const priceValue = document.getElementById("priceValue");

if (priceRange && priceValue) {
  priceValue.textContent = priceRange.value;

  priceRange.addEventListener("input", () => {
    priceValue.textContent = priceRange.value;
  });
}
