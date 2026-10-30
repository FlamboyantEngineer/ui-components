import { isShallowEqual } from './is-shallow-equal.js';
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
  let active = true;
  let frame: number | null = null;
  let needsUpdate = false;
  let last = everyFrame ? snapshot(anchor) : null;
  const request = () => {
    if (active) frame ??= view.requestAnimationFrame(compare);
  };
  const compare = () => {
    frame = null;
    if (!active) return;
    if (last) {
      const next = snapshot(anchor);
      needsUpdate ||= !isShallowEqual(last, next);
      last = next;
    }
    if (needsUpdate) {
      needsUpdate = false;
      update();
    }
    if (everyFrame) request();
  };
  const schedule = () => {
    needsUpdate = true;
    request();
  };
  const listening = { capture: true, passive: true } as const;
  view.addEventListener('scroll', schedule, listening);
  view.addEventListener('resize', schedule, { passive: true });
  const observer =
    typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(schedule) : null;
  observer?.observe(anchor);
  observer?.observe(overlay);

  update();
  if (everyFrame) request();

  return () => {
    active = false;
    view.removeEventListener('scroll', schedule, listening);
    view.removeEventListener('resize', schedule);
    observer?.disconnect();
    if (frame !== null) view.cancelAnimationFrame(frame);
  };
}
