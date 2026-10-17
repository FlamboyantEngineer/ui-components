// Re-solving an overlay a component positions itself when its anchor or the page moves under it.

export interface OverlayAutoUpdateOptions {
  /** The element the overlay is anchored to. */
  anchor: Element;
  /** The overlay itself, whose size changes also call for a new solution. */
  overlay: Element;
  /** Solves and applies the overlay's placement again. */
  update: () => void;
  /** Also compare the anchor's box every animation frame, for anchors that move on their own. */
  everyFrame?: boolean | undefined;
}

interface BoxSnapshot {
  left: number;
  top: number;
  width: number;
  height: number;
}

function snapshot(element: Element): BoxSnapshot {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { left, top, width, height };
}

function isSameBox(a: BoxSnapshot, b: BoxSnapshot): boolean {
  return a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height;
}

/**
 * Calls `update` at once, then again, at most once per animation frame, whenever any scroll
 * container in the anchor's document scrolls, its window resizes, or the anchor or overlay changes
 * size; with `everyFrame`, also whenever the anchor's box moves. Returns the function that stops.
 */
export function autoUpdateOverlay({
  anchor,
  overlay,
  update,
  everyFrame = false,
}: OverlayAutoUpdateOptions): () => void {
  const view = anchor.ownerDocument.defaultView ?? window;
  let frame: number | null = null;
  const schedule = () => {
    frame ??= view.requestAnimationFrame(() => {
      frame = null;
      update();
    });
  };
  const listening = { capture: true, passive: true } as const;
  view.addEventListener('scroll', schedule, listening);
  view.addEventListener('resize', schedule, { passive: true });
  const observer =
    typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(schedule) : null;
  observer?.observe(anchor);
  observer?.observe(overlay);

  let watch: number | null = null;
  if (everyFrame) {
    let last = snapshot(anchor);
    const compare = () => {
      const next = snapshot(anchor);
      if (!isSameBox(last, next)) update();
      last = next;
      watch = view.requestAnimationFrame(compare);
    };
    watch = view.requestAnimationFrame(compare);
  }
  update();

  return () => {
    view.removeEventListener('scroll', schedule, listening);
    view.removeEventListener('resize', schedule);
    observer?.disconnect();
    if (frame !== null) view.cancelAnimationFrame(frame);
    if (watch !== null) view.cancelAnimationFrame(watch);
  };
}
