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

export async function initServiceDetail() {
  const wrapper = document.getElementById("service-detail");
  if (!wrapper) return;

  const titleEl = document.querySelector('[data-role="service-title"]') || document.getElementById("service-title");
  const breadcrumbCurrentEl = document.getElementById("service-breadcrumb-current");
  const descriptionEl = document.getElementById("service-description");
  const routeEl = document.getElementById("service-route");
  const weightLimitEl = document.getElementById("service-weight-limit");
  const etaEl = document.getElementById("service-eta");
  const priceEl = document.getElementById("service-price");
  const loadTypesEl = document.getElementById("service-load-types");
  const securityEl = document.getElementById("service-security");
  const documentsEl = document.getElementById("service-documents");
  const extrasEl = document.getElementById("service-extras");
  const tagsEl = document.getElementById("service-tags");
  const audienceEl = document.getElementById("service-audience");

  const params = new URLSearchParams(window.location.search);
  const slugParam = params.get("service");
  const idParamRaw = params.get("id");
  const idParam = idParamRaw ? Number(idParamRaw) : null;

  if (!slugParam && !idParamRaw) return;

  try {
    const services = await fetchJson("assets/data/services.json");
    const service = services.find((item) => {
      if (slugParam) return item.slug === slugParam;
      return Number.isFinite(idParam) && item.id === idParam;
    });

    if (!service) return;

    document.title = `${service.name} | TransLogix`;

    if (titleEl) titleEl.textContent = service.name;
    if (breadcrumbCurrentEl) breadcrumbCurrentEl.textContent = service.name;
    if (descriptionEl) descriptionEl.textContent = service.description;
    if (routeEl) routeEl.textContent = service.route;
    if (weightLimitEl) weightLimitEl.textContent = service.weightLimit || "na zapytanie";
    if (etaEl) etaEl.textContent = service.eta || `${service.time} h`;
    if (priceEl) priceEl.textContent = `od ${service.price} zł netto`;
    if (loadTypesEl) loadTypesEl.textContent = service.loadTypes || "Palety, LTL/FTL";
    if (securityEl) securityEl.textContent = service.security || "Monitoring GPS, plomby, check-call";
    if (documentsEl) documentsEl.textContent = service.documents || "CMR, potwierdzenie dostawy";
    if (extrasEl) extrasEl.textContent = service.extras || "Express, ubezpieczenie, ADR/chłodnia";

    if (tagsEl && Array.isArray(service.tags)) {
      tagsEl.replaceChildren();
      service.tags.forEach((tag) => {
        const tagEl = document.createElement("span");
        tagEl.className = "tag";
        tagEl.textContent = tag;
        tagsEl.appendChild(tagEl);
      });
    }

    if (audienceEl && Array.isArray(service.audience) && service.audience.length) {
      audienceEl.replaceChildren();
      service.audience.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        audienceEl.appendChild(li);
      });
    }
  } catch (error) {
    console.error("Failed to enhance service detail.", error);

    if (!wrapper.querySelector("[data-service-error]")) {
      const errorEl = document.createElement("p");
      errorEl.className = "text-muted";
      errorEl.dataset.serviceError = "true";
      errorEl.textContent = "Nie udało się wczytać szczegółów usługi. Wyświetlamy treść zastępczą.";
      wrapper.appendChild(errorEl);
    }
  }
}
