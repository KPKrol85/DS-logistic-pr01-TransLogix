export function initCompactHeader() {
  const header = document.querySelector("header");
  if (!header) return;

  const COMPACT_ENTER_THRESHOLD = 96;
  const COMPACT_EXIT_THRESHOLD = 48;
  let isCompact = false;
  let ticking = false;

  const getScrollY = () => window.scrollY || window.pageYOffset || 0;

  const setCompact = (shouldCompact) => {
    if (shouldCompact === isCompact) return;

    isCompact = shouldCompact;
    header.classList.toggle("header--compact", shouldCompact);
  };

  const updateHeaderState = () => {
    const scrollY = getScrollY();

    if (!isCompact && scrollY > COMPACT_ENTER_THRESHOLD) {
      setCompact(true);
    } else if (isCompact && scrollY < COMPACT_EXIT_THRESHOLD) {
      setCompact(false);
    }
  };

  const scheduleUpdate = () => {
    if (ticking) return;

    ticking = true;
    window.requestAnimationFrame(() => {
      updateHeaderState();
      ticking = false;
    });
  };

  updateHeaderState();

  window.addEventListener("scroll", scheduleUpdate, { passive: true });
}
