import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

export interface NearPages {
  /** Every registered page element, by page index. */
  elements: RefObject<Map<number, HTMLElement>>;
  /** Pages within a screen of the view; `null` when the platform cannot tell, so every page renders. */
  nearPages: ReadonlySet<number> | null;
  registerPage(pageIndex: number, element: HTMLElement | null): void;
}

/** The near pages after a batch of intersection changes. */
function updateNearPages(
  previous: ReadonlySet<number> | null,
  entries: readonly IntersectionObserverEntry[],
  indexes: WeakMap<Element, number>,
): Set<number> {
  const next = new Set(previous);
  for (const entry of entries) {
    const pageIndex = indexes.get(entry.target);
    if (pageIndex === undefined) continue;
    if (entry.isIntersecting) next.add(pageIndex);
    else next.delete(pageIndex);
  }
  return next;
}

/** Tracks which pages are near the view with an `IntersectionObserver` rooted at the scroller. */
export function useNearPages(scrollerRef: RefObject<HTMLElement | null>): NearPages {
  const elements = useRef(new Map<number, HTMLElement>());
  const indexes = useRef(new WeakMap<Element, number>());
  const observer = useRef<IntersectionObserver | null>(null);
  const [nearPages, setNearPages] = useState<ReadonlySet<number> | null>(() =>
    typeof IntersectionObserver === 'undefined' ? null : new Set(),
  );

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return undefined;
    const created = new IntersectionObserver(
      (entries) => setNearPages((previous) => updateNearPages(previous, entries, indexes.current)),
      { root, rootMargin: '100% 0px' },
    );
    for (const element of elements.current.values()) created.observe(element);
    observer.current = created;
    return () => {
      created.disconnect();
      observer.current = null;
    };
  }, [scrollerRef]);

  const registerPage = useCallback((pageIndex: number, element: HTMLElement | null) => {
    const previous = elements.current.get(pageIndex);
    if (previous) observer.current?.unobserve(previous);
    if (element) {
      elements.current.set(pageIndex, element);
      indexes.current.set(element, pageIndex);
      observer.current?.observe(element);
    } else {
      elements.current.delete(pageIndex);
    }
  }, []);

  return { elements, nearPages, registerPage };
}
