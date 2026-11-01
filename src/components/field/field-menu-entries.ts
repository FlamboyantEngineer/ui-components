// The field menu's entries, server-safe so a server component can extend the default menu.

import type { MenuEntry } from '../menu/menu.js';

/**
 * A built-in field menu action: Clear (the empty value), Reset (the last committed value), Set to
 * default (the default value) or Help.
 */
export type FieldMenuAction = 'clear' | 'reset' | 'set-default' | 'help';

/** The menu every field offers unless it lists its own: Clear and Reset. */
export const defaultFieldMenu: readonly FieldMenuEntry[] = ['clear', 'reset'];

/** A built-in action by name, or any menu entry. */
export type FieldMenuEntry = FieldMenuAction | MenuEntry;
