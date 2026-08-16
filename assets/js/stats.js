export function initFooterStats() {
  const statHeaders = document.querySelectorAll(".footer__stats .stat [data-stat]");
  if (!statHeaders.length) return;
  const prefersReducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  let deliveriesEl = null;
  let vehiclesEl = null;
  let countriesEl = null;
  statHeaders.forEach((el) => {
    const type = el.dataset.stat;

    if (type === "deliveries") deliveriesEl = el;
    if (type === "vehicles") vehiclesEl = el;
    if (type === "countries") countriesEl = el;
  });

  if (deliveriesEl) {
    const raw = deliveriesEl.dataset.value || deliveriesEl.textContent.trim().replace(/[^\d]/g, "");
    const deliveriesValue = parseInt(raw, 10);
    if (!Number.isNaN(deliveriesValue)) {
      deliveriesEl.textContent = deliveriesValue.toLocaleString("pl-PL") + "+";
    }
  }

  if (countriesEl) {
    const raw = countriesEl.dataset.value || countriesEl.textContent.trim().replace(/[^\d]/g, "");
    const countriesValue = parseInt(raw, 10);
    const valueToShow = Number.isNaN(countriesValue) ? 27 : countriesValue;
    countriesEl.textContent = valueToShow.toString();
  }
  if (prefersReducedMotion) return;

  if (!vehiclesEl) return;

  const rawVehicles = vehiclesEl.dataset.value || vehiclesEl.textContent.trim().replace(/[^\d]/g, "");
  const initialVehicles = parseInt(rawVehicles, 10);

  if (Number.isNaN(initialVehicles)) return;

  const config = {
    el: vehiclesEl,
    base: initialVehicles,
    current: initialVehicles,
  };

  function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function scheduleNext() {
    const delay = randomBetween(5000, 10000);
    const spread = 9;
    const min = Math.max(0, config.base - spread);
    const max = config.base + spread;
    const nextTarget = randomBetween(min, max);

    setTimeout(() => {
      animateTo(nextTarget);
    }, delay);
  }

  function animateTo(target) {
    const duration = randomBetween(600, 1200);
    const startValue = config.current;
    const difference = target - startValue;
    const startTime = performance.now();

    function frame(now) {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = startValue + difference * eased;

      config.current = value;
      config.el.textContent = Math.round(value).toString();

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        config.current = target;
        scheduleNext();
      }
    }
    requestAnimationFrame(frame);
  }
  scheduleNext();
}
