'use client';

import { type DataSlotPrefix, prefixDataSlots } from '../../core/data-slot-names.js';
import { createHooks, type DataSlotOverrides } from '../../core/hooks.js';

/** The hook classes of the menu family (specs/MENU.md). */
export const menuHooks = createHooks(
  'menu',
  ['search', 'search-input', 'empty', 'load-more', 'load-more-spinner'],
  { root: 'dropdown-menu-content' },
);
export const menuItemHooks = createHooks(
  'menu-item',
  ['check', 'icon', 'spinner', 'label', 'description', 'shortcut', 'trailing', 'submenu-indicator'],
  { root: 'dropdown-menu-item', shortcut: 'dropdown-menu-shortcut' },
);
export const menuSectionHooks = createHooks('menu-section', ['header'], {
  root: 'dropdown-menu-group',
  header: 'dropdown-menu-label',
});
export const menuSeparatorHooks = createHooks('menu-separator', [], {
  root: 'dropdown-menu-separator',
});

/**
 * The names a presentation that shows menus gives their parts, `dropdown-menu-*` with another
 * prefix (`context-menu-item`), for a `DataSlotNames` scope around the menus (UIC-MENU-4.7).
 */
export function prefixMenuDataSlots(prefix: Omit<DataSlotPrefix, 'from'>): DataSlotOverrides {
  return prefixDataSlots([menuHooks, menuItemHooks, menuSectionHooks, menuSeparatorHooks], {
    ...prefix,
    from: 'dropdown-menu',
  });
}
