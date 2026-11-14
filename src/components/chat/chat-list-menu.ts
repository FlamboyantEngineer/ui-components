'use client';

import { type KeyboardEvent, type RefCallback, useCallback, useMemo, useRef } from 'react';
import { containsFocus } from '../../utils/composed-focus.js';
import { isEditableTarget } from '../../utils/is-editable-target.js';
import { isElement } from '../../utils/is-element.js';
import {
  type ContextMenuTargetProps,
  type MenuController,
  useContextMenuTarget,
} from '../context-menu/context-menu.js';

/** The list's one context menu, which each row opens for its own conversation. */
export interface ChatListMenu {
  controller: MenuController;
  /** Called just before the menu opens for the conversation `id`. */
  onOpen: (id: string) => void;
  /** Opens the menu below a row, by the row's element, for each row that has a menu. */
  rows: Map<Element, () => void>;
}

interface ConversationMenuOptions {
  /** The list's menu; `undefined` leaves the browser's own menu on the row. */
  menu: ChatListMenu | undefined;
  /** The row's conversation. */
  id: string;
}

/** Stands in while a row has no menu; a disabled target never opens it. */
const closedController: MenuController = {
  open() {},
  move() {},
  setItems() {},
  close() {},
  isOpen: () => false,
  getSnapshot: () => ({ isOpen: false, anchor: null, items: undefined }),
  subscribe: () => () => {},
};

function isKeyboardContextMenu(event: KeyboardEvent) {
  return event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10');
}

/**
 * Makes a row the target of the list's context menu, for its own conversation: a secondary click
 * or long touch opens it at the pointer after moving focus to the row, so focus returns to the row
 * when it closes. The row registers itself for the keys, which the list handles (`openRowMenu`).
 */
export function useConversationMenuTarget({
  menu,
  id,
}: ConversationMenuOptions): ContextMenuTargetProps & { ref: RefCallback<HTMLElement> } {
  const rowRef = useRef<HTMLElement | null>(null);
  const controller = useMemo<MenuController>(() => {
    if (!menu) return closedController;
    const { controller: shared, onOpen } = menu;
    return {
      ...shared,
      open(anchor, options) {
        const row = rowRef.current;
        // A pointer leaves focus where it was; the row takes it, so it returns there on close.
        if (row && !isElement(anchor) && !containsFocus(row)) row.focus({ preventScroll: true });
        onOpen(id);
        shared.open(anchor, options);
      },
    };
  }, [menu, id]);
  const register = useCallback(
    (row: HTMLElement | null) => {
      if (!row || !menu) return undefined;
      menu.rows.set(row, () => controller.open(row));
      return () => {
        menu.rows.delete(row);
      };
    },
    [menu, controller],
  );
  return useContextMenuTarget({
    controller,
    isDisabled: !menu,
    own: { ref: register },
    targetRef: rowRef,
  });
}

/**
 * The Context Menu key or Shift+F10 in a row with a menu, outside a text control, opens the menu
 * below the row. The list handles the keys for its rows, which take no key handlers of their own.
 */
export function openRowMenu(menu: ChatListMenu, event: KeyboardEvent<HTMLElement>): void {
  if (event.defaultPrevented || !isKeyboardContextMenu(event)) return;
  if (isEditableTarget(event.target)) return;
  let node = isElement(event.target) ? event.target : null;
  while (node && node !== event.currentTarget) {
    const open = menu.rows.get(node);
    if (open) {
      event.preventDefault();
      event.stopPropagation();
      open();
      return;
    }
    node = node.parentElement;
  }
}
