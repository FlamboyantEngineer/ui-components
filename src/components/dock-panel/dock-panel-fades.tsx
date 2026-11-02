'use client';

import { useLayoutEffect, type RefObject } from 'react';
import type { Orientation } from '../../core/props.js';
import {
  useScrollStripOverflow,
  type ScrollStripOverflow,
} from '../../utils/use-scroll-strip-overflow.js';
import { dockPanelHooks as hooks } from './dock-panel-hooks.js';

/**
 * Which edges of a scrolling list hide content, measured once a frame as it scrolls, resizes or
 * changes. A horizontal launcher list also takes the vertical wheel; the tab list takes it itself.
 */
export function useDockPanelFades(
  listRef: RefObject<HTMLElement | null>,
  orientation: Orientation,
  { wheel = true }: { wheel?: boolean } = {},
): { overflow: ScrollStripOverflow; sync: () => void } {
  const { overflow, syncOverflow } = useScrollStripOverflow(listRef, { orientation, wheel });
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return undefined;
    list.addEventListener('scroll', syncOverflow, { passive: true });
    return () => list.removeEventListener('scroll', syncOverflow);
  }, [listRef, syncOverflow]);
  return { overflow, sync: syncOverflow };
}

/** Decorative fades over each edge of a scrolling list that hides content there. */
export function DockPanelFades({
  edges,
  orientation,
}: {
  edges: ScrollStripOverflow;
  orientation: Orientation;
}) {
  return (
    <>
      <span
        {...hooks.slot('fade', { edge: 'start', orientation })}
        hidden={!edges.start}
        aria-hidden="true"
      />
      <span
        {...hooks.slot('fade', { edge: 'end', orientation })}
        hidden={!edges.end}
        aria-hidden="true"
      />
    </>
  );
}
