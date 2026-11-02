// Icons a host sets on a component's built-in menu actions (specs/MENU.md, UIC-MENU-6.1).

import type { IconSource } from '../icon/icon.js';

/**
 * The icons of a component's built-in menu actions, by action name: an icon adds one to an action
 * drawn without, or replaces the action's own, and `null` removes it. Actions left out keep their
 * own icon, or none. Custom entries take their icon from `MenuEntry`.
 */
export type MenuActionIcons<A extends string> = Partial<Record<A, IconSource>>;

/** The icon of a built-in action: the host's, when `icons` names the action (even as `null`), else `fallback`. */
export function resolveActionIcon<A extends string>(
  icons: MenuActionIcons<A> | undefined,
  action: A,
  fallback?: IconSource,
): IconSource {
  return icons !== undefined && Object.hasOwn(icons, action) ? icons[action] : fallback;
}
