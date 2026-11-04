'use client';

import { type RefObject, useLayoutEffect } from 'react';
import type { Key } from '../../core/props.js';
import { findOverlayScrollContainer } from '../../utils/overlay-geometry.js';
import { getElementByIdFrom, getElementByIdWithin } from '../../utils/owner-window.js';
import { measureInScroller } from '../../utils/scroll-geometry.js';
import { getCompletionOptionId } from './completion-option-id.js';

/** Reveals an active option within its own list without scrolling the editor or the document. */
export function useActiveCompletion(
  listId: string,
  activeKey: Key | null,
  options: { isOpen: boolean; anchorRef: RefObject<Element | null> },
) {
  const { isOpen, anchorRef } = options;
  useLayoutEffect(() => {
    if (!isOpen || activeKey === null) return;
    const anchor = anchorRef.current;
    const view = anchor?.ownerDocument.defaultView;
    if (!anchor || !view) return;
    let isCurrent = true;
    const frame = view.requestAnimationFrame(() => {
      if (!isCurrent) return;
      const list = getElementByIdFrom(anchor, listId);
      const option = getElementByIdWithin(list, getCompletionOptionId(listId, activeKey));
      if (!list || !option) return;
      const container = findOverlayScrollContainer(option, {
        skip: (ancestor) => ancestor.scrollHeight <= ancestor.clientHeight,
      });
      if (!container || !list.closest('.ui-completion-list')?.contains(container)) return;
      const item = measureInScroller(option, container);
      const { scrollTop, clientHeight } = container;
      if (item.top < scrollTop) container.scrollTop = item.top;
      else if (item.top + item.height > scrollTop + clientHeight) {
        container.scrollTop = item.top + item.height - clientHeight;
      }
    });
    return () => {
      isCurrent = false;
      view.cancelAnimationFrame(frame);
    };
  }, [listId, activeKey, isOpen, anchorRef]);
}
