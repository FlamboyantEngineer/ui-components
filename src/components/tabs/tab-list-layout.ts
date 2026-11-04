'use client';

import { type RefCallback, type RefObject, useMemo } from 'react';
import type { Key, Orientation } from '../../core/props.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { useToolbarScroll } from '../toolbar-scroller/toolbar-scroller.js';
import { useTabActionScroll } from './tab-action-room.js';
import type { TabListModel } from './tab-actions.js';
import { useTabOverflow } from './tab-bar.js';
import { useCenterSelectedTab, useListOverflow } from './tab-list-overflow.js';
import type { TabListPartsModel } from './tab-list-parts.js';

interface ListLayoutOptions {
  state: TabListModel | null;
  editingKey: Key | null;
  parts: TabListPartsModel | null;
  orientation: Orientation;
  isMenu: boolean;
  isStrip: boolean;
  setListRef: RefCallback<HTMLDivElement>;
}

/** Share the native list ref across menu measurement, scrolling and the caller. */
export function useTabListLayout(
  listRef: RefObject<HTMLDivElement | null>,
  { state, editingKey, parts, orientation, isMenu, isStrip, setListRef }: ListLayoutOptions,
) {
  const selectedKey = state?.selectedKey ?? null;
  const scrollActions = useTabActionScroll(listRef, { model: parts, selectedKey, enabled: isMenu });
  const menuMode = isMenu && !scrollActions;
  const menu = useTabOverflow(state, menuMode, { editingKey, parts });
  // A menu list that falls back to scrolling is a scroll strip too, so it takes the wheel.
  const scroll = useToolbarScroll(isStrip || (isMenu && scrollActions));
  const scrollOverflowing = useListOverflow(listRef, orientation);
  useCenterSelectedTab(listRef, { orientation, selectedKey });
  const elementRef = useMemo(
    () => mergeRefs(setListRef, menu.itemContainerRef, scroll.stripRef),
    [setListRef, menu.itemContainerRef, scroll.stripRef],
  );
  return {
    menuMode,
    menu,
    scroll,
    elementRef,
    overflowing: menuMode ? menu.hiddenItems.length > 0 : scrollOverflowing,
  };
}
