'use client';

import { type RefObject, useLayoutEffect, useRef } from 'react';

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
  readonly ResizeObserverTarget[] | (() => readonly ResizeObserverTarget[]);

type OwnerWindow = Window & typeof globalThis;

interface Observation {
  observer: ResizeObserver;
  elements: Set<Element>;
  active: boolean;
}

type Wanted = Map<OwnerWindow, Map<ResizeObserverBoxOptions, Set<Element>>>;
type Observations = Map<OwnerWindow, Map<ResizeObserverBoxOptions, Observation>>;

function resolveTarget(
  target: NonNullable<ResizeObserverTarget>,
): [Element | null | undefined, ResizeObserverBoxOptions] {
  if ('current' in target) return [target.current, 'content-box'];
  if ('element' in target) return [target.element, target.box ?? 'content-box'];
  return [target, 'content-box'];
}

function getOrCreate<K, V>(map: Map<K, V>, key: K, create: () => V): V {
  let value = map.get(key);
  if (value === undefined) map.set(key, (value = create()));
  return value;
}

function collectTargets(targets: ResizeObserverTargets): Wanted {
  const wanted: Wanted = new Map();
  for (const target of typeof targets === 'function' ? targets() : targets) {
    if (!target) continue;
    const [element, box] = resolveTarget(target);
    const view = element?.ownerDocument.defaultView as OwnerWindow | null | undefined;
    if (!element || !view || typeof view.ResizeObserver !== 'function') continue;
    getOrCreate(
      getOrCreate(wanted, view, () => new Map()),
      box,
      () => new Set(),
    ).add(element);
  }
  return wanted;
}

function release(observation: Observation): void {
  observation.active = false;
  observation.observer.disconnect();
}

/** Stops watching elements that are no longer wanted, and drops observers left with none. */
function releaseUnwanted(current: Observations, wanted: Wanted): void {
  for (const [view, boxes] of current) {
    for (const [box, observation] of boxes) {
      const elements = wanted.get(view)?.get(box);
      if (elements) {
        unobserveMissing(observation, elements);
      } else {
        release(observation);
        boxes.delete(box);
      }
    }
    if (boxes.size === 0) current.delete(view);
  }
}

function unobserveMissing(observation: Observation, elements: Set<Element>): void {
  for (const element of observation.elements) {
    if (elements.has(element)) continue;
    observation.observer.unobserve(element);
    observation.elements.delete(element);
  }
}

function observeMissing(
  observation: Observation,
  elements: Set<Element>,
  box: ResizeObserverBoxOptions,
): void {
  for (const element of elements) {
    if (observation.elements.has(element)) continue;
    observation.elements.add(element);
    observation.observer.observe(element, { box });
  }
}

function createObservation(
  view: OwnerWindow,
  callback: RefObject<ResizeObserverCallback>,
): Observation {
  const observation: Observation = {
    observer: new view.ResizeObserver((entries, observer) => {
      if (observation.active) callback.current(entries, observer);
    }),
    elements: new Set(),
    active: true,
  };
  return observation;
}

/** Starts watching newly wanted elements, sharing one observer per window and box. */
function observeWanted(
  current: Observations,
  wanted: Wanted,
  callback: RefObject<ResizeObserverCallback>,
): void {
  for (const [view, boxes] of wanted) {
    const byBox = getOrCreate(current, view, () => new Map());
    for (const [box, elements] of boxes) {
      const observation = getOrCreate(byBox, box, () => createObservation(view, callback));
      observeMissing(observation, elements, box);
    }
  }
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
  const observations = useRef<Observations>(new Map());

  useLayoutEffect(() => {
    callback.current = onResize;
  }, [onResize]);

  useLayoutEffect(() => {
    const wanted = collectTargets(targets);
    releaseUnwanted(observations.current, wanted);
    observeWanted(observations.current, wanted, callback);
  });

  useLayoutEffect(() => {
    const current = observations.current;
    return () => {
      for (const boxes of current.values()) boxes.forEach(release);
      current.clear();
    };
  }, []);
}
