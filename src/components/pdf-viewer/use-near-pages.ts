'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
  type RefObject,
} from 'react';

export interface NearPages {
  /** Every registered page element, by page index. */
  elements: RefObject<Map<number, HTMLElement>>;
  /** Pages within a screen of the view; `null` when the platform cannot tell, so every page renders. */
  nearPages: ReadonlySet<number> | null;
  registerPage(pageIndex: number, element: HTMLElement | null): void;
}

interface PageObservation {
  elements: RefObject<Map<number, HTMLElement>>;
  indexes: RefObject<WeakMap<Element, number>>;
  observer: RefObject<IntersectionObserver | null>;
  setNearPages: Dispatch<SetStateAction<ReadonlySet<number> | null>>;
}

/** The near pages after a batch of intersection changes. */
function updateNearPages(
  previous: ReadonlySet<number> | null,
  entries: readonly IntersectionObserverEntry[],
  indexes: WeakMap<Element, number>,
): ReadonlySet<number> | null {
  let next: Set<number> | null = null;
  for (const entry of entries) {
    const pageIndex = indexes.get(entry.target);
    if (pageIndex === undefined) continue;
    if (((next ?? previous)?.has(pageIndex) ?? false) === entry.isIntersecting) continue;
    next ??= new Set(previous);
    if (entry.isIntersecting) next.add(pageIndex);
    else next.delete(pageIndex);
  }
  return next ?? previous;
}

/** Observes pages within one scroller height, rebuilding the observer when that height changes. */
function observeNearPages(
  root: HTMLElement | null,
  { elements, indexes, observer, setNearPages }: PageObservation,
) {
  const Observer = root?.ownerDocument.defaultView?.IntersectionObserver;
  if (!root || typeof Observer !== 'function') {
    setNearPages(null);
    return undefined;
  }
  const view = root.ownerDocument.defaultView;
  let height = -1;
  let isActive = true;
  const observe = () => {
    if (!isActive || height === root.clientHeight) return;
    height = root.clientHeight;
    observer.current?.disconnect();
    const created = new Observer(
      (entries) => {
        if (observer.current !== created) return;
        setNearPages((previous) =>
          observer.current === created
            ? updateNearPages(previous, entries, indexes.current)
            : previous,
        );
      },
      { root, rootMargin: `${height}px 0px` },
    );
    observer.current = created;
    for (const element of elements.current.values()) created.observe(element);
  };
  setNearPages(new Set());
  observe();
  const resize = view?.ResizeObserver ? new view.ResizeObserver(observe) : null;
  resize?.observe(root);
  view?.addEventListener('resize', observe);
  return () => {
    isActive = false;
    observer.current?.disconnect();
    observer.current = null;
    resize?.disconnect();
    view?.removeEventListener('resize', observe);
  };
}

/** Tracks which pages are near the view with an `IntersectionObserver` rooted at the scroller. */
export function useNearPages(scrollerRef: RefObject<HTMLElement | null>): NearPages {
  const elements = useRef(new Map<number, HTMLElement>());
  const indexes = useRef(new WeakMap<Element, number>());
  const observer = useRef<IntersectionObserver | null>(null);
  const [nearPages, setNearPages] = useState<ReadonlySet<number> | null>(() => new Set());

  useEffect(
    () => observeNearPages(scrollerRef.current, { elements, indexes, observer, setNearPages }),
    [scrollerRef],
  );

  const registerPage = useCallback((pageIndex: number, element: HTMLElement | null) => {
    const previous = elements.current.get(pageIndex) ?? null;
    if (previous === element) return;
    if (previous) {
      observer.current?.unobserve(previous);
      indexes.current.delete(previous);
      setNearPages((current) => {
        if (!current?.has(pageIndex)) return current;
        const next = new Set(current);
        next.delete(pageIndex);
        return next;
      });
    }
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
