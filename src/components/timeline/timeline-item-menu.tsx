'use client';

// An item's context menu: the host's entries for that item, opened from the item by a secondary
// click, a long touch, Shift+F10 or the Context Menu key (specs/TIMELINE.md, UIC-TIMELINE-2.5).

import { useEffect, useRef, type KeyboardEvent, type Ref } from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import {
  ContextMenu,
  useContextMenuTarget,
  useMenuController,
} from '../context-menu/context-menu.js';
import { Menu, type MenuEntry } from '../menu/menu.js';
import type { TimelineItem } from './timeline-geometry.js';

/** The entries of an item's menu, or a function of the item that returns them. */
export type TimelineItemMenu =
  readonly MenuEntry[] | ((item: TimelineItem) => readonly MenuEntry[]);

/** The item menu options a timeline hands its items. */
export interface TimelineItemMenuOptions {
  entries: TimelineItemMenu | undefined;
  onAction: ((key: Key, item: TimelineItem) => void) | undefined;
}

/**
 * The context menu of one item: its target props, which keep the item's own key handler and ref,
 * and the menu element, or none while the item has no entries.
 */
export function useItemMenu(
  item: TimelineItem,
  options: TimelineItemMenuOptions,
  own: {
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
    ref?: Ref<HTMLElement> | undefined;
  },
) {
  const strings = useUiStrings();
  const controller = useMenuController();
  const targetRef = useRef<HTMLElement | null>(null);
  const { entries, onAction } = options;
  const listed = typeof entries === 'function' ? entries(item) : (entries ?? []);
  const isDisabled = listed.length === 0;
  const targetProps = useContextMenuTarget({ controller, isDisabled, own, targetRef });
  useEffect(() => {
    if (isDisabled) controller.close();
  }, [isDisabled, controller]);
  const menu = isDisabled ? null : (
    <ContextMenu
      controller={controller}
      triggerRef={targetRef}
      aria-label={strings.timelineItemActions(item.label)}
    >
      <Menu items={listed} onAction={(key) => onAction?.(key, item)} />
    </ContextMenu>
  );
  return { targetProps, menu };
}
