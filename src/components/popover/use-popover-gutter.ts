'use client';

import { useLayoutEffect, useState } from 'react';
import { useResizeObserver } from '../../utils/use-resize-observer.js';

/** Root scrollbar space survives scroll locking while clientWidth expands to the viewport. */
function measurePopoverGutter(panel: HTMLElement | null): number {
  if (!panel) return 0;
  const { documentElement, body } = panel.ownerDocument;
  const parent = panel.offsetParent;
  if (parent && parent !== body && parent !== documentElement) return 0;
  const right =
    documentElement.getBoundingClientRect().right + (panel.ownerDocument.defaultView?.scrollX ?? 0);
  return Math.max(0, documentElement.clientWidth - right);
}

/** Correct right-based coordinates against the actual containing block, including reserved gutters. */
export function usePopoverGutter(panel: HTMLElement | null): number {
  const [gutter, setGutter] = useState(0);
  const measure = () => setGutter(measurePopoverGutter(panel));
  useResizeObserver([panel, panel?.ownerDocument.documentElement], measure);
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- The gutter is measured from the committed panel's containing block.
    setGutter(measurePopoverGutter(panel));
  }, [panel]);
  return gutter;
}
