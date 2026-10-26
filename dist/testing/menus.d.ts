import type { NameMatch, TestUser } from './test-user.js';
/** Presses a menu trigger and returns the menu it opened. */
export declare function openMenu(user: TestUser, trigger: Element): Promise<HTMLElement>;
/** Opens a trigger's menu and presses the item named `name` (a plain, checkbox or radio item). */
export declare function chooseMenuItem(user: TestUser, trigger: Element, name: NameMatch): Promise<void>;
/**
 * Presses Escape where focus is, which dismisses the overlay holding it. When given the overlay,
 * waits until it has left the document.
 */
export declare function dismissOverlay(user: TestUser, overlay?: Element): Promise<void>;
//# sourceMappingURL=menus.d.ts.map