// Smart prefetch - respects saveData and slow connections
document.addEventListener("astro:page-load", () => {
  const conn = (navigator as any).connection;

  // Disable prefetch entirely if user has save-data enabled
  if (conn?.saveData) {
    document
      .querySelectorAll("link[rel='prefetch']")
      .forEach(el => el.remove());
    return;
  }

  // On slow connections (2g/slow-2g), disable prefetch
  if (conn?.effectiveType && ["slow-2g", "2g"].includes(conn.effectiveType)) {
    document
      .querySelectorAll("link[rel='prefetch']")
      .forEach(el => el.remove());
    return;
  }

  // On 3g, only prefetch on hover (not viewport)
  if (conn?.effectiveType === "3g") {
    // Astro's viewport observer already handles this,
    // but we intercept and remove viewport-triggered prefetches
    const observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node instanceof HTMLLinkElement && node.rel === "prefetch") {
            // Only keep hover-triggered prefetches (they have data-astro-prefetch-hover or are hovered)
            // Astro adds data-astro-prefetch or links via viewport/hover.
            // If it is viewport prefetch, we remove it.
            // Note: Astro's client prefetch script has internal logic. If we remove the link tag,
            // the browser stops prefetching.
            if (!node.hasAttribute("data-astro-prefetch-hover")) {
              node.remove();
            }
          }
        }
      }
    });
    observer.observe(document.head, { childList: true });
  }
});
