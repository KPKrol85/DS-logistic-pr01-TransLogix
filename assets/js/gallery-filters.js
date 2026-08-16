
export function initGalleryFilters() {
  const chips = document.querySelectorAll("[data-filter]");
  const items = document.querySelectorAll("#fleet-grid [data-type]");
  const grid = document.getElementById("fleet-grid");
  if (!chips.length || !items.length || !grid) return;

  const updateFleetSingleState = () => {
    const visible = [...items].filter((item) => item.style.display !== "none");
    grid.classList.toggle("is-single", visible.length === 1);
  };

  const applyFilters = (filter) => {
    items.forEach((item) => {
      const match = filter === "all" || item.dataset.type === filter || item.dataset.purpose === filter;

      item.style.display = match ? "" : "none";
    });

    updateFleetSingleState();
  };

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      chip.setAttribute("aria-pressed", "true");
      chips.forEach((c) => c !== chip && c.setAttribute("aria-pressed", "false"));
      applyFilters(chip.dataset.filter);
    });
    if (chip.dataset.filter === "all") chip.classList.add("is-active");
    chip.setAttribute("aria-pressed", chip.classList.contains("is-active"));
  });

  applyFilters("all");
}
