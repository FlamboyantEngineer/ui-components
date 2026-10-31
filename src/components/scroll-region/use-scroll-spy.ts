'use client';

import { useEffect, useState, type RefObject } from 'react';

export interface ScrollSpyOptions {
  /** The ids of the sections to follow, in document order. */
  ids: readonly string[];
  /** How far below the viewport's top a section's top must reach to become current, in pixels. */
  offset?: number | undefined;
}

/**
 * The current section of a scrolled viewport: the last of `ids` whose top has reached `offset` below
 * the viewport's top, the first before any has, and the last once the viewport is scrolled to its
 * end. Ids without an element are skipped.
 */
export function resolveScrollSpy(
  viewport: HTMLElement,
  { ids, offset = 0 }: ScrollSpyOptions,
): string | undefined {
  const document = viewport.ownerDocument;
  const sections = ids.flatMap((id) => {
    const element = document.getElementById(id);
    return element ? [{ id, element }] : [];
  });
  const atEnd = viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop <= 1;
  if (atEnd && viewport.scrollTop > 0) return sections.at(-1)?.id;
  const line = viewport.getBoundingClientRect().top + offset + 1;
  const reached = sections.filter(({ element }) => element.getBoundingClientRect().top <= line);
  return (reached.at(-1) ?? sections[0])?.id;
}

/**
 * Follows which of the sections `ids` is current in a scrolling viewport, such as a `ScrollRegion`'s
 * (its `ref`), for a table of contents to mark. It updates once per animation frame as the viewport
 * scrolls or resizes, and at once when the ids change.
 */
export function useScrollSpy(
  viewport: RefObject<HTMLElement | null>,
  { ids, offset = 0 }: ScrollSpyOptions,
): string | undefined {
  const [active, setActive] = useState<string | undefined>(undefined);
  const key = ids.join('\n');

  useEffect(() => {
    const element = viewport.current;
    const view = element?.ownerDocument.defaultView;
    if (!element || !view) return undefined;
    const sectionIds = key ? key.split('\n') : [];
    let frame: number | null = null;
    const read = () => {
      frame = null;
      setActive(resolveScrollSpy(element, { ids: sectionIds, offset }));
    };
    // Scrolls and resizes read the sections' positions once per animation frame.
    const update = () => {
      frame ??= view.requestAnimationFrame(read);
    };
    const resize =
      typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(update) : null;
    resize?.observe(element);
    element.addEventListener('scroll', update, { passive: true });
    read();
    return () => {
      resize?.disconnect();
      element.removeEventListener('scroll', update);
      if (frame !== null) view.cancelAnimationFrame(frame);
    };
  }, [key, offset, viewport]);

  return active;
}
