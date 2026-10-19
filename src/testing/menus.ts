import { waitFor, within } from '@testing-library/dom';
import { findPopup } from './popups.js';
import type { NameMatch, TestUser } from './test-user.js';

const ITEM_ROLES = ['menuitem', 'menuitemcheckbox', 'menuitemradio'] as const;

/** Presses a menu trigger and returns the menu it opened. */
export async function openMenu(user: TestUser, trigger: Element): Promise<HTMLElement> {
  await user.click(trigger);
  return findPopup(trigger, 'menu');
}

/** Opens a trigger's menu and presses the item named `name` (a plain, checkbox or radio item). */
export async function chooseMenuItem(user: TestUser, trigger: Element, name: NameMatch) {
  const menu = await openMenu(user, trigger);
  const item = await waitFor(() => {
    const items = ITEM_ROLES.flatMap((role) => within(menu).queryAllByRole(role, { name }));
    if (!items[0]) throw new Error(`No menu item named ${String(name)}.`);
    return items[0];
  });
  await user.click(item);
}

/**
 * Presses Escape where focus is, which dismisses the overlay holding it. When given the overlay,
 * waits until it has left the document.
 */
export async function dismissOverlay(user: TestUser, overlay?: Element) {
  await user.keyboard('{Escape}');
  if (!overlay) return;
  await waitFor(() => {
    if (overlay.isConnected) throw new Error('The overlay is still open.');
  });
}
