// The field menu's entries, server-safe so a server component can extend the default menu.

import type { MenuActionIcons } from '../menu/menu-action-icons.js';
import type { MenuEntry } from '../menu/menu.js';

/**
 * A built-in field menu action: Clear (the empty value), Reset (the last committed value), Set to
 * default (the default value) or Help.
 */
export type FieldMenuAction = 'clear' | 'reset' | 'set-default' | 'help';

/** The menu every field offers unless it lists its own: Clear and Reset. */
export const defaultFieldMenu: readonly FieldMenuEntry[] = ['clear', 'reset'];

/** Icons for the field menu's built-in actions, by action; `null` removes an action's own icon. */
export type FieldMenuIcons = MenuActionIcons<FieldMenuAction>;

/** A built-in action by name, or any menu entry. */
export type FieldMenuEntry = FieldMenuAction | MenuEntry;
