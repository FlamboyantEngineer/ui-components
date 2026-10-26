// The menubar keys React Aria's menus leave to the bar (WAI-ARIA menubar pattern).

import type { Orientation } from '../../core/props.js';

/** Where a key press starts: on a top-level item, in its menu, or in a submenu of that menu. */
export type MenubarKeyPlace = 'bar' | 'menu' | 'submenu';

export interface MenubarKeyPress {
  key: string;
  orientation: Orientation;
  direction: 'ltr' | 'rtl';
  place: MenubarKeyPlace;
  /** The focused menu item opens a submenu, which React Aria opens on the forward arrow. */
  hasSubmenu: boolean;
}

/**
 * What the bar does with a key: move focus to another top-level item (opening its menu when the
 * press came from a menu), open the focused item's menu, or close the open menu.
 */
export type MenubarKeyAction =
  | { type: 'move'; to: 'previous' | 'next' | 'first' | 'last' }
  | { type: 'open' }
  | { type: 'close' };

interface BarArrows {
  orientation: Orientation;
  forward: string;
  backward: string;
}

function resolveBarKey(key: string, { orientation, forward, backward }: BarArrows) {
  const isRow = orientation === 'horizontal';
  if (key === (isRow ? forward : 'ArrowDown')) return { type: 'move', to: 'next' } as const;
  if (key === (isRow ? backward : 'ArrowUp')) return { type: 'move', to: 'previous' } as const;
  if (key === 'Home') return { type: 'move', to: 'first' } as const;
  if (key === 'End') return { type: 'move', to: 'last' } as const;
  if (!isRow && key === forward) return { type: 'open' } as const;
  return null;
}

/**
 * The bar's action for a key press, or `null` when React Aria's trigger or menu handles it (or
 * nothing does). In a row, the arrows along it move between top-level items, from the bar or from
 * an open menu (except where they open or close a submenu); in a column, the arrows along it move,
 * the forward arrow opens a menu and the backward arrow closes it.
 */
export function resolveMenubarKey(press: MenubarKeyPress): MenubarKeyAction | null {
  const { key, orientation, direction, place, hasSubmenu } = press;
  const forward = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
  const backward = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
  if (place === 'bar') return resolveBarKey(key, { orientation, forward, backward });
  if (orientation === 'vertical') {
    return key === backward && place === 'menu' ? { type: 'close' } : null;
  }
  if (key === forward && !hasSubmenu) return { type: 'move', to: 'next' };
  if (key === backward && place === 'menu') return { type: 'move', to: 'previous' };
  return null;
}
