// Layout observation shared by the overlay scrollbars and the overview: one measurement per
// animation frame whenever the viewport, its children or other watched elements resize, or its
// content changes.

export interface ViewportObserverOptions {
  /** Reads the layout; called at most once per animation frame. */
  measure: () => void;
  /** Elements watched besides the viewport and its children, read again on every content change. */
  getExtraTargets?: (() => Iterable<Element | null>) | undefined;
  /** Watch content changes anywhere inside the viewport, not only its children. */
  subtree?: boolean | undefined;
}

export interface ViewportObserver {
  /** Schedules a measurement for the next animation frame. */
  schedule: () => void;
  /** Watches the current set of elements again and schedules a measurement. */
  observe: () => void;
  disconnect: () => void;
}

/**
 * Observes `element` with the observers of its window `view`. Without `ResizeObserver`, content
 * changes and explicit `schedule` calls still remeasure.
 */
export function observeViewport(
  element: HTMLElement,
  view: Window & typeof globalThis,
  { measure, getExtraTargets, subtree = false }: ViewportObserverOptions,
): ViewportObserver {
  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame = view.requestAnimationFrame(() => {
      frame = 0;
      measure();
    });
  };
  const resize =
    typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(schedule) : null;
  const observe = () => {
    if (resize) {
      resize.disconnect();
      for (const target of [element, ...element.children, ...(getExtraTargets?.() ?? [])]) {
        if (target) resize.observe(target);
      }
    }
    schedule();
  };
  const mutations = new view.MutationObserver(observe);
  mutations.observe(element, { childList: true, subtree });
  observe();
  return {
    schedule,
    observe,
    disconnect() {
      resize?.disconnect();
      mutations.disconnect();
      view.cancelAnimationFrame(frame);
    },
  };
}
