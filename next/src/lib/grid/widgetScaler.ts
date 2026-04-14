export function widgetScaler(node: HTMLElement) {
  const apply = (width: number, height: number) => {
    if (width <= 0 || height <= 0) return;
    const smaller = Math.min(width, height);
    const ratio = Math.max(width, height) / smaller;
    let base = smaller * 0.35;
    if (ratio > 2) {
      base += Math.min(width * 0.05, smaller * 0.2);
    }
    base = Math.max(12, Math.min(150, base));
    node.style.setProperty("--widget-unit", `${base / 100}px`);
  };

  const ro = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      apply(width, height);
    }
  });
  ro.observe(node);

  const rect = node.getBoundingClientRect();
  apply(rect.width, rect.height);

  return {
    destroy() {
      ro.disconnect();
      node.style.removeProperty("--widget-unit");
    },
  };
}
