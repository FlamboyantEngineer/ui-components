'use client';

import { type RefObject, useLayoutEffect, useRef } from 'react';

/**
 * Keeps the point at the viewport's centre in place when the drawn image grows or shrinks, from a
 * zoom or a resized viewport, so zooming does not lose the reader's place.
 */
export function useCentredZoom(viewportRef: RefObject<HTMLElement | null>, drawnWidth: number) {
  const previous = useRef(drawnWidth);
  useLayoutEffect(() => {
    const from = previous.current;
    previous.current = drawnWidth;
    const viewport = viewportRef.current;
    if (!viewport || from <= 0 || from === drawnWidth) return;
    const ratio = drawnWidth / from;
    const halfWidth = viewport.clientWidth / 2;
    const halfHeight = viewport.clientHeight / 2;
    viewport.scrollLeft = (viewport.scrollLeft + halfWidth) * ratio - halfWidth;
    viewport.scrollTop = (viewport.scrollTop + halfHeight) * ratio - halfHeight;
  }, [viewportRef, drawnWidth]);
}
