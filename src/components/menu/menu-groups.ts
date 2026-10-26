import type { MenuEntry, MenuItemEntry } from './menu.js';

/** Joins non-empty entry groups, keeping separators out of empty and edge positions. */
export function joinMenuGroups(groups: readonly MenuItemEntry[][]): MenuEntry[] {
  return groups
    .filter((group) => group.length > 0)
    .flatMap((group, index) =>
      index === 0 ? group : [{ type: 'separator' as const, id: `separator-${index}` }, ...group],
    );
}
