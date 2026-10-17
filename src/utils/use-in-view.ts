import { useEffect, useState, type RefObject } from 'react';

/** An element, or a ref whose element is stable. Hold late-mounting elements in state instead. */
export type InViewTarget = Element | RefObject<Element | null> | null | undefined;

export interface InViewOptions {
  /** False stops observing and returns false. Defaults to true. */
  readonly enabled?: boolean | undefined;
}

function resolveElement(target: InViewTarget): Element | null {
  if (!target) return null;
  return 'current' in target ? target.current : target;
}

/**
 * Whether any part of `target` is visible in the viewport, after clipping by the scrolling
 * ancestors it sits in, for loading more content or rendering it lazily. False until the first
 * report, while disabled, and in a window without `IntersectionObserver`; the observer comes from
 * the element's own window.
 */
export function useInView(target: InViewTarget, { enabled = true }: InViewOptions = {}): boolean {
  const [isInView, setInView] = useState(false);

  useEffect(() => {
    const element = resolveElement(target);
    const Observer = element?.ownerDocument.defaultView?.IntersectionObserver;
    if (!enabled || !element || typeof Observer !== 'function') return undefined;
    const observer = new Observer((entries) => {
      const entry = entries.findLast((candidate) => candidate.target === element);
      if (entry) setInView(entry.isIntersecting);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      setInView(false);
    };
  }, [enabled, target]);

  return enabled && isInView;
}
