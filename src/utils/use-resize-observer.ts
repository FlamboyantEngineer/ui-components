import { useLayoutEffect, useRef, type RefObject } from 'react';

/** An element to observe: the element itself, a ref to it, or the element with the box to watch. */
export type ResizeObserverTarget =
  | Element
  | RefObject<Element | null>
  | {
      readonly element: Element | null | undefined;
      readonly box?: ResizeObserverBoxOptions | undefined;
    }
  | null
  | undefined;

/** The targets, or a function returning them that is called after every commit. */
export type ResizeObserverTargets =
  | readonly ResizeObserverTarget[]
  | (() => readonly ResizeObserverTarget[]);

type OwnerWindow = Window & typeof globalThis;

interface Observation {
  observer: ResizeObserver;
  elements: Set<Element>;
  active: boolean;
}

type Wanted = Map<OwnerWindow, Map<ResizeObserverBoxOptions, Set<Element>>>;

function resolveTarget(
  target: NonNullable<ResizeObserverTarget>,
): [Element | null | undefined, ResizeObserverBoxOptions] {
  if ('current' in target) return [target.current, 'content-box'];
  if ('element' in target) return [target.element, target.box ?? 'content-box'];
  return [target, 'content-box'];
}

function collect(targets: ResizeObserverTargets): Wanted {
  const wanted: Wanted = new Map();
  for (const target of typeof targets === 'function' ? targets() : targets) {
    if (!target) continue;
    const [element, box] = resolveTarget(target);
    const view = element?.ownerDocument.defaultView as OwnerWindow | null | undefined;
    if (!element || !view || typeof view.ResizeObserver !== 'function') continue;
    let boxes = wanted.get(view);
    if (!boxes) wanted.set(view, (boxes = new Map()));
    let elements = boxes.get(box);
    if (!elements) boxes.set(box, (elements = new Set()));
    elements.add(element);
  }
  return wanted;
}

/**
 * Observes the size of committed elements with a `ResizeObserver` from each element's own window,
 * so content inside an iframe is observed there. Targets are resolved after every commit; a fresh
 * array or a new callback does not restart observations of unchanged elements. One observer is
 * shared per window and box, and an element can be watched in two boxes at once.
 */
export function useResizeObserver(
  targets: ResizeObserverTargets,
  onResize: ResizeObserverCallback,
): void {
  const callback = useRef(onResize);
  const observations = useRef(new Map<OwnerWindow, Map<ResizeObserverBoxOptions, Observation>>());

  useLayoutEffect(() => {
    callback.current = onResize;
  }, [onResize]);

  useLayoutEffect(() => {
    const wanted = collect(targets);
    const current = observations.current;

    for (const [view, boxes] of current) {
      for (const [box, observation] of boxes) {
        const elements = wanted.get(view)?.get(box);
        if (!elements) {
          observation.active = false;
          observation.observer.disconnect();
          boxes.delete(box);
          continue;
        }
        for (const element of observation.elements) {
          if (elements.has(element)) continue;
          observation.observer.unobserve(element);
          observation.elements.delete(element);
        }
      }
      if (boxes.size === 0) current.delete(view);
    }

    for (const [view, boxes] of wanted) {
      let byBox = current.get(view);
      if (!byBox) current.set(view, (byBox = new Map()));
      for (const [box, elements] of boxes) {
        let observation = byBox.get(box);
        if (!observation) {
          const created: Observation = {
            observer: new view.ResizeObserver((entries, observer) => {
              if (created.active) callback.current(entries, observer);
            }),
            elements: new Set(),
            active: true,
          };
          byBox.set(box, (observation = created));
        }
        for (const element of elements) {
          if (observation.elements.has(element)) continue;
          observation.elements.add(element);
          observation.observer.observe(element, { box });
        }
      }
    }
  });

  useLayoutEffect(() => {
    const current = observations.current;
    return () => {
      for (const boxes of current.values()) {
        for (const observation of boxes.values()) {
          observation.active = false;
          observation.observer.disconnect();
        }
      }
      current.clear();
    };
  }, []);
}
