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
  const root = findOverlayScrollContainer(element);
  const view = element.ownerDocument.defaultView;
  const offset = Math.max(0, scrollOffset);
  // IntersectionObserver resolves every percentage against width, including vertical margins.
  const width = (root?.clientWidth ?? view?.innerWidth ?? 0) * offset;
  const height = (root?.clientHeight ?? view?.innerHeight ?? 0) * offset;
  return {
    root,
    rootMargin: `0px ${width}px ${height}px ${width}px`,
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
    const view = element?.ownerDocument.defaultView;
    const Observer = view?.IntersectionObserver;
    if (!enabled || !element || typeof Observer !== 'function') return undefined;
    let active = true;
    let observer: IntersectionObserver | null = null;
    let previous: ReturnType<typeof toObserverInit>;
    const observe = () => {
      if (!active) return;
      const init = toObserverInit(element, scrollOffset);
      if (observer && init?.root === previous?.root && init?.rootMargin === previous?.rootMargin)
        return;
      observer?.disconnect();
      previous = init;
      const next: IntersectionObserver = new Observer((entries) => {
        if (observer !== next) return;
        const entry = entries.findLast((candidate) => candidate.target === element);
        if (entry) setInView(entry.isIntersecting);
      }, init);
      observer = next;
      observer.observe(element);
    };
    observe();
    const hasOffset = scrollOffset !== undefined && Number.isFinite(scrollOffset);
    const resize = hasOffset && view?.ResizeObserver ? new view.ResizeObserver(observe) : null;
    if (resize) resize.observe(previous?.root ?? element.ownerDocument.documentElement);
    if (hasOffset) view?.addEventListener('resize', observe);
    return () => {
      active = false;
      observer?.disconnect();
      observer = null;
      resize?.disconnect();
      if (hasOffset) view?.removeEventListener('resize', observe);
      setInView(false);
    };
  }, [element, enabled, scrollOffset]);

  return enabled && isInView;
}
