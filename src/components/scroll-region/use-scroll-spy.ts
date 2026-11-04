'use client';

import { type RefObject, useEffect, useState } from 'react';
import { observeViewport } from '../../utils/observe-viewport.js';
import { getElementByIdFrom } from '../../utils/owner-window.js';
import { measureScale } from '../../utils/scroll-geometry.js';
import { useStableArray } from '../../utils/use-stable-array.js';
import { useTargetElement } from '../../utils/use-target-element.js';

export interface ScrollSpyOptions {
  /** The ids of the sections to follow, in document order. */
  ids: readonly string[];
  /** How far below the viewport's top a section's top must reach to become current, in pixels. */
  offset?: number | undefined;
}

/**
 * The current section of a scrolled viewport: the last of `ids` whose top has reached `offset` below
 * the viewport's top, the first before any has, and the last once the viewport is scrolled to its
 * end. Ids are looked up in the viewport's tree (its shadow root, else its document); ids without an
 * element there are skipped.
 */
export function resolveScrollSpy(
  viewport: HTMLElement,
  { ids, offset = 0 }: ScrollSpyOptions,
): string | undefined {
  const sections = ids.flatMap((id) => {
    const element = getElementByIdFrom(viewport, id);
    return element ? [{ id, element }] : [];
  });
  const atEnd = viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop <= 1;
  if (atEnd && viewport.scrollTop > 0) return sections.at(-1)?.id;
  // `offset` counts the viewport's own pixels; the sections' edges are read in viewport pixels.
  const line = viewport.getBoundingClientRect().top + (offset + 1) * measureScale(viewport).y;
  const reached = sections.filter(({ element }) => element.getBoundingClientRect().top <= line);
  return (reached.at(-1) ?? sections[0])?.id;
}

/**
 * Follows which of the sections `ids` is current in a scrolling viewport, such as a `ScrollRegion`'s
 * (its `ref`), for a table of contents to mark. It updates once per animation frame as the viewport
 * scrolls, resizes or its content changes, and at once when the ids change. The ref is read after
 * every commit, so a viewport that mounts late or is replaced is followed.
 */
export function useScrollSpy(
  viewport: RefObject<HTMLElement | null>,
  { ids, offset = 0 }: ScrollSpyOptions,
): string | undefined {
  const [active, setActive] = useState<string | undefined>(undefined);
  const sectionIds = useStableArray(ids);
  const element = useTargetElement(viewport);

  useEffect(() => {
    const view = element?.ownerDocument.defaultView;
    if (!element || !view) return undefined;
    let frame: number | null = null;
    const read = () => {
      frame = null;
      setActive(resolveScrollSpy(element, { ids: sectionIds, offset }));
    };
    // Scrolls read the sections' positions once per animation frame; so do resizes of the viewport
    // or its children, content changes inside it (a section above that grows moves every heading
    // without a scroll) and fonts that finish loading.
    const update = () => {
      frame ??= view.requestAnimationFrame(read);
    };
    const layout = observeViewport(element, view, { measure: read, subtree: true, fonts: true });
    element.addEventListener('scroll', update, { passive: true });
    read();
    return () => {
      layout.disconnect();
      element.removeEventListener('scroll', update);
      if (frame !== null) view.cancelAnimationFrame(frame);
    };
  }, [element, sectionIds, offset]);

  return active;
}
