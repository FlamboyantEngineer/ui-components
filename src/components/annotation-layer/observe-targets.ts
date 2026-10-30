// Keeps measured anchors current: one measurement per animation frame after content inside the
// layer changes, scrolls or resizes (specs/ANNOTATION-LAYER.md).

interface TargetObserverOptions {
  /** Reads the anchors; called at most once per animation frame. */
  measure: () => void;
  /** The target elements to watch for size and position changes, read again after each change. */
  getTargets: () => Iterable<Element>;
  /** Whether a changed node is the layer's own output, such as its marks, and not content. */
  isOwnOutput: (node: Node) => boolean;
}

interface TargetObserver {
  /** Schedules a measurement for the next animation frame. */
  schedule: () => void;
  disconnect: () => void;
}

/** The target and each of its ancestors up to the layer, whose resizes can move the target. */
function* withAncestors(target: Element, layer: Element): Iterable<Element> {
  for (let node: Element | null = target; node && node !== layer; node = node.parentElement) {
    yield node;
  }
}

/**
 * Watches the layer's content for changes that can move a target without the layer rendering:
 * content added, removed or edited (a `MutationObserver` over the subtree), scrolling inside the
 * layer (a capturing `scroll` listener; the layer's own scroll moves nothing in its coordinates),
 * and resizes of the layer, the targets and their ancestors. A content change or scroll schedules
 * one measurement for the next frame; a resize, already reported once a frame, measures at once.
 */
export function observeTargets(
  layer: HTMLElement,
  { measure, getTargets, isOwnOutput }: TargetObserverOptions,
): TargetObserver {
  const view = layer.ownerDocument.defaultView;
  if (!view) return { schedule: measure, disconnect: () => {} };
  let active = true;
  let frame: number | null = null;
  const observed = new Set<Element>();
  // Resize observations already arrive once per frame, so they measure at once.
  const resize =
    typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(() => flush()) : null;
  const watchTargets = () => {
    if (!resize) return;
    const wanted = new Set<Element>([layer]);
    for (const target of getTargets())
      for (const node of withAncestors(target, layer)) wanted.add(node);
    for (const node of observed) {
      if (wanted.has(node)) continue;
      resize.unobserve(node);
      observed.delete(node);
    }
    for (const node of wanted) {
      if (observed.has(node)) continue;
      resize.observe(node);
      observed.add(node);
    }
  };
  const flush = () => {
    if (frame !== null) view.cancelAnimationFrame(frame);
    frame = null;
    if (!active) return;
    measure();
    watchTargets();
  };
  const schedule = () => {
    if (active && frame === null) frame = view.requestAnimationFrame(flush);
  };
  const mutations = new view.MutationObserver((records) => {
    if (records.some((record) => !isOwnOutput(record.target))) schedule();
  });
  mutations.observe(layer, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
  });
  const onScroll = (event: Event) => {
    if (event.target !== layer) schedule();
  };
  layer.addEventListener('scroll', onScroll, { capture: true, passive: true });
  watchTargets();
  return {
    schedule,
    disconnect() {
      active = false;
      resize?.disconnect();
      observed.clear();
      mutations.disconnect();
      layer.removeEventListener('scroll', onScroll, { capture: true });
      if (frame !== null) view.cancelAnimationFrame(frame);
      frame = null;
    },
  };
}
