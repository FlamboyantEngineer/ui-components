'use client';

import { type RefObject, useState } from 'react';
import { observeViewport, type ViewportObserver } from '../../utils/observe-viewport.js';

type Targets = () => Iterable<Element | null>;

/** One viewport observer that a region's overlay metrics, edges and overview share. */
export interface SharedViewportObserver {
  /**
   * Calls `measure` now, and again whenever the viewport's layout may have changed. The viewport is
   * observed while anything is subscribed. Returns the unsubscription.
   */
  subscribe: (measure: () => void) => () => void;
  /** Also watches the elements `targets` returns for resizes. Returns the unwatching. */
  watch: (targets: Targets) => () => void;
  /** Schedules a measurement for the next animation frame. */
  schedule: () => void;
  /** Watches the current set of elements again and schedules a measurement. */
  observe: () => void;
}

function createSharedViewportObserver(
  getElement: () => HTMLElement | null,
): SharedViewportObserver {
  const listeners = new Set<() => void>();
  const watched = new Set<Targets>();
  let observer: ViewportObserver | null = null;
  const measure = () => {
    for (const listener of [...listeners]) listener();
  };
  const getExtraTargets = () => [...watched].flatMap((targets) => [...targets()]);
  const start = () => {
    const element = getElement();
    const view = element?.ownerDocument.defaultView;
    if (!element || !view) return null;
    return observeViewport(element, view, {
      measure,
      getExtraTargets,
      subtree: true,
      immediate: true,
    });
  };
  return {
    subscribe(listener) {
      listeners.add(listener);
      observer ??= start();
      listener();
      return () => {
        listeners.delete(listener);
        if (listeners.size > 0) return;
        observer?.disconnect();
        observer = null;
      };
    },
    watch(targets) {
      watched.add(targets);
      observer?.observe();
      return () => {
        watched.delete(targets);
        observer?.observe();
      };
    },
    schedule: () => observer?.schedule(),
    observe: () => observer?.observe(),
  };
}

/**
 * The observer of `viewport` shared by the hooks that measure it, so a region runs one resize
 * observer, one mutation observer and one frame of reads however many of them are on.
 */
export function useSharedViewportObserver(
  viewport: RefObject<HTMLElement | null>,
): SharedViewportObserver {
  const [shared] = useState(() => createSharedViewportObserver(() => viewport.current));
  return shared;
}
