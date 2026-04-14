/**
 * Svelte action that scales an element's `font-size` so its rendered text
 * exactly fits its parent container. Re-runs whenever:
 *   - The parent container resizes (ResizeObserver on parent)
 *   - The element's own size changes (ResizeObserver on element)
 *   - The text content mutates (MutationObserver on element)
 *
 * Use on a single-line text element (e.g. `<span class="time">`) inside a
 * positioned wrapper that defines the available box. The element should
 * have `white-space: nowrap` so its `scrollWidth` reflects the natural
 * single-line width.
 */
export function fitText(node: HTMLElement) {
  let raf = 0;
  let applying = false;

  const measure = () => {
    raf = 0;
    if (applying) return;

    const parent = node.parentElement;
    if (!parent) return;

    const cw = parent.clientWidth;
    const ch = parent.clientHeight;
    if (cw <= 0 || ch <= 0) return;

    const currentSize = parseFloat(getComputedStyle(node).fontSize) || 16;
    // scrollWidth/scrollHeight reflect the unconstrained natural size of
    // the text (assuming white-space: nowrap), even when the element is
    // currently overflowing or visually clipped.
    const tw = node.scrollWidth;
    const th = node.scrollHeight;
    if (tw <= 0 || th <= 0) return;

    const scale = Math.min(cw / tw, ch / th);
    const newSize = Math.max(6, Math.min(500, currentSize * scale));

    // Skip negligible adjustments — also breaks any potential observer loop
    // since setting the same font-size won't trigger a new layout pass.
    if (Math.abs(newSize - currentSize) < 0.5) return;

    applying = true;
    node.style.fontSize = `${newSize}px`;
    // Release the guard on the next frame so observer callbacks can run again.
    requestAnimationFrame(() => {
      applying = false;
    });
  };

  const schedule = () => {
    if (raf) return;
    raf = requestAnimationFrame(measure);
  };

  const ro = new ResizeObserver(schedule);
  if (node.parentElement) ro.observe(node.parentElement);
  ro.observe(node);

  const mo = new MutationObserver(schedule);
  mo.observe(node, {
    characterData: true,
    childList: true,
    subtree: true,
  });

  schedule();

  return {
    destroy() {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
    },
  };
}
