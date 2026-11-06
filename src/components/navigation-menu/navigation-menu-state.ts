'use client';

// The state a navigation menu shares with its items and links.

import { createContext, type Ref, useContext } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { Key } from '../../core/props.js';

/** Why the open panel opened: a hovered one closes when the pointer leaves, a pressed one stays. */
export type NavigationMenuOpenReason = 'hover' | 'press';

export interface NavigationMenuState {
  /** The key of the item whose panel is open, or `null`. */
  openKey: Key | null;
  /** Opens the panel of `key` for `reason`; `null` closes the open one. */
  setOpen: (key: Key | null, reason: NavigationMenuOpenReason) => void;
  /** The reason the open panel opened. */
  getOpenReason: () => NavigationMenuOpenReason;
  /** Starts the hover delay before the panel of `key` opens; at once while another is open. */
  hoverStart: (key: Key) => void;
  /** Starts the grace delay before a panel opened by hover closes. */
  hoverEnd: () => void;
  /** Receives the open panel, the one the menu measures. */
  panelRef: Ref<HTMLDivElement>;
}

export const navigationMenuHooks = createHooks('navigation-menu', [
  'list',
  'item',
  'trigger',
  'indicator',
  'panel',
  'link',
]);

const closedMenu: NavigationMenuState = {
  openKey: null,
  setOpen: () => {},
  getOpenReason: () => 'press',
  hoverStart: () => {},
  hoverEnd: () => {},
  panelRef: null,
};

export const NavigationMenuContext = createContext<NavigationMenuState>(closedMenu);

/** True inside an item's panel, where a link is content rather than a top-level item. */
export const NavigationMenuPanelContext = createContext(false);

export function useNavigationMenu(): NavigationMenuState {
  return useContext(NavigationMenuContext);
}
