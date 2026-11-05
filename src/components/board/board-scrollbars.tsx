'use client';

import { type ReactNode, type RefObject, useEffect } from 'react';
import {
  OverlayScrollbars,
  useOverlayMetrics,
  useSharedViewportObserver,
} from '../scroll-region/scroll-region.js';
import { boardHooks as hooks } from './board-hooks.js';

/**
 * The shared overlay scrollbars over a virtualized cell's card list, which scrolls natively: a
 * vertical thumb drawn only while the cards overflow the list's height, over the list rather than
 * beside it, so it takes no layout room. The wheel, touch, keys and drag auto-scroll keep scrolling
 * the list itself.
 */
function BoardListScrollbars({
  listRef,
  listId,
}: {
  listRef: RefObject<HTMLDivElement | null>;
  listId: string | undefined;
}) {
  const observer = useSharedViewportObserver(listRef);
  const measurement = useOverlayMetrics({
    viewport: listRef,
    observer,
    enabled: true,
    headerInset: false,
  });
  const { schedule, metrics } = measurement;
  useEffect(() => {
    const list = listRef.current;
    if (!list) return undefined;
    list.addEventListener('scroll', schedule);
    schedule();
    return () => list.removeEventListener('scroll', schedule);
  }, [listRef, schedule]);
  return (
    <OverlayScrollbars
      tabIndex={-1}
      viewport={listRef}
      viewportId={listId}
      measurement={measurement}
      drawX={false}
      drawY={metrics.contentHeight > metrics.height + 1}
      isVisible
    />
  );
}

/**
 * A cell's grid list in its `ui-board__list` frame, which the overlay scrollbars of a virtualized
 * list lie over. The frame stays in both modes, so turning virtualization off or on keeps the list
 * and its cards mounted.
 */
export function BoardListFrame({
  isVirtualized,
  listRef,
  listId,
  children,
}: {
  isVirtualized: boolean;
  listRef: RefObject<HTMLDivElement | null>;
  listId: string | undefined;
  children: ReactNode;
}) {
  return (
    <div {...hooks.slot('list', { virtualized: isVirtualized })}>
      {children}
      {isVirtualized ? <BoardListScrollbars listRef={listRef} listId={listId} /> : null}
    </div>
  );
}
