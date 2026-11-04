import { listenFontsLoaded } from './listen-fonts-loaded.js';

// Layout observation shared by a region's overlay scrollbars, edges and overview: one measurement
// per animation frame whenever the viewport, its children or other watched elements resize, or its
// content changes.

/**
 * The content changes that can change the scrollable extent without resizing the viewport or its
 * children: nodes, text and attributes (such as a class or style) anywhere inside it.
 */
const contentChanges: MutationObserverInit = {
  childList: true,
  subtree: true,
  attributes: true,
  characterData: true,
};

/** Whether a batch of mutations added or removed nodes, so the watched children may differ. */
function hasNodeChanges(records: readonly MutationRecord[]): boolean {
  return records.some((record) => record.type === 'childList');
}

interface ViewportObserverOptions {
  /** Reads the layout; called at most once per animation frame. */
  measure: () => void;
  /** Elements watched besides the viewport and its children, read again on every content change. */
  getExtraTargets?: (() => Iterable<Element | null>) | undefined;
  /**
   * Watch content changes anywhere inside the viewport (`contentChanges`) and images loading in it,
   * not only its children.
   */
  subtree?: boolean | undefined;
  /**
   * Measure at once, without waiting for a frame, when a watched element resizes or a child of the
   * viewport comes or goes; deeper content changes still wait for a frame.
   */
  immediate?: boolean | undefined;
  /** Also measure when the document's fonts finish loading, which re-wraps text in place. */
  fonts?: boolean | undefined;
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
  { measure, getExtraTargets, subtree = false, immediate = false, fonts }: ViewportObserverOptions,
): ViewportObserver {
  let active = true;
  let frame: number | null = null;
  const observed = new Set<Element>();
  const schedule = () => {
    if (!active || frame !== null) return;
    frame = view.requestAnimationFrame(() => {
      frame = null;
      if (active) measure();
    });
  };
  const measureNow = () => {
    if (!active) return;
    if (frame !== null) view.cancelAnimationFrame(frame);
    frame = null;
    measure();
  };
  const resize =
    typeof view.ResizeObserver === 'function'
      ? new view.ResizeObserver(immediate ? measureNow : schedule)
      : null;
  const watch = () => {
    if (!active || !resize) return;
    const wanted = new Set([element, ...element.children, ...(getExtraTargets?.() ?? [])]);
    for (const target of observed) {
      if (wanted.has(target)) continue;
      resize.unobserve(target);
      observed.delete(target);
    }
    for (const target of wanted) {
      if (!target || observed.has(target)) continue;
      resize.observe(target);
      observed.add(target);
    }
  };
  const observe = () => {
    watch();
    schedule();
  };
  // Only added or removed nodes can change the watched children; other changes just remeasure.
  const mutations = new view.MutationObserver((records) => {
    if (!hasNodeChanges(records)) return schedule();
    watch();
    const isChildChange = records.some(
      (record) => record.type === 'childList' && record.target === element,
    );
    return immediate && isChildChange ? measureNow() : schedule();
  });
  mutations.observe(element, subtree ? contentChanges : { childList: true });
  if (subtree) element.addEventListener('load', schedule, true);
  const stopFonts = fonts ? listenFontsLoaded(element, schedule) : null;
  // An immediate observer's owner measures as it starts, so only a deferred one schedules here.
  if (immediate) watch();
  else observe();
  return {
    schedule,
    observe,
    disconnect() {
      active = false;
      resize?.disconnect();
      observed.clear();
      mutations.disconnect();
      element.removeEventListener('load', schedule, true);
      stopFonts?.();
      if (frame !== null) view.cancelAnimationFrame(frame);
      frame = null;
    },
  };
}
