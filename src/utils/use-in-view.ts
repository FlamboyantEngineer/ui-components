import { useEffect, useState, type RefObject } from 'react';
import { findOverlayScrollContainer } from './overlay-geometry.js';

/** An element, or a ref whose element is stable. Hold late-mounting elements in state instead. */
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

function resolveElement(target: InViewTarget): Element | null {
  if (!target) return null;
  return 'current' in target ? target.current : target;
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
 * the element's own window.
 */
export function useInView(
  target: InViewTarget,
  { enabled = true, scrollOffset }: InViewOptions = {},
): boolean {
  const [isInView, setInView] = useState(false);

  useEffect(() => {
    const element = resolveElement(target);
    const Observer = element?.ownerDocument.defaultView?.IntersectionObserver;
    if (!enabled || !element || typeof Observer !== 'function') return undefined;
    const observer = new Observer(
      (entries) => {
        const entry = entries.findLast((candidate) => candidate.target === element);
        if (entry) setInView(entry.isIntersecting);
      },
      toObserverInit(element, scrollOffset),
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      setInView(false);
    };
  }, [enabled, target, scrollOffset]);

  return enabled && isInView;
}
