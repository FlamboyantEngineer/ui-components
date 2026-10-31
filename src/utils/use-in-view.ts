'use client';

import { useEffect, useState, type RefObject } from 'react';
import { findOverlayScrollContainer } from './overlay-geometry.js';
import { useTargetElement } from './use-target-element.js';

/** An element, or a ref to one, followed to the element it holds after every commit. */
export type InViewTarget = Element | RefObject<Element | null> | null | undefined;

export interface InViewOptions {
  /** False stops observing and returns false. Defaults to true. */
  readonly enabled?: boolean | undefined;
  /**
   * Also count the target as in view within this many heights (or widths) of its scrolling
   * container past the visible area's end, as React Aria's `scrollOffset` (1 is one full height).
   * Omit to report only actual visibility.
   */
  readonly scrollOffset?: number | undefined;
}

/** Observer options that extend the nearest scrolling container's view by `scrollOffset`, or none. */
function toObserverInit(element: Element, scrollOffset: number | undefined) {
  if (scrollOffset === undefined || !Number.isFinite(scrollOffset)) return undefined;
  const margin = `${Math.max(0, scrollOffset) * 100}%`;
  return {
    root: findOverlayScrollContainer(element),
    rootMargin: `0px ${margin} ${margin} ${margin}`,
  };
}

/**
 * Whether any part of `target` is visible in the viewport, after clipping by the scrolling
 * ancestors it sits in, for loading more content or rendering it lazily. False until the first
 * report, while disabled, and in a window without `IntersectionObserver`; the observer comes from
 * the element's own window. A ref is followed to the element it holds after every commit.
 */
export function useInView(
  target: InViewTarget,
  { enabled = true, scrollOffset }: InViewOptions = {},
): boolean {
  const [isInView, setInView] = useState(false);
  const element = useTargetElement(target);

  useEffect(() => {
    const Observer = element?.ownerDocument.defaultView?.IntersectionObserver;
    if (!enabled || !element || typeof Observer !== 'function') return undefined;
    let active = true;
    const observer = new Observer(
      (entries) => {
        if (!active) return;
        const entry = entries.findLast((candidate) => candidate.target === element);
        if (entry) setInView(entry.isIntersecting);
      },
      toObserverInit(element, scrollOffset),
    );
    observer.observe(element);
    return () => {
      active = false;
      observer.disconnect();
      setInView(false);
    };
  }, [element, enabled, scrollOffset]);

  return enabled && isInView;
}
