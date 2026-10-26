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
export type MenubarKeyAction = {
    type: 'move';
    to: 'previous' | 'next' | 'first' | 'last';
} | {
    type: 'open';
} | {
    type: 'close';
};
/**
 * The bar's action for a key press, or `null` when React Aria's trigger or menu handles it (or
 * nothing does). In a row, the arrows along it move between top-level items, from the bar or from
 * an open menu (except where they open or close a submenu); in a column, the arrows along it move,
 * the forward arrow opens a menu and the backward arrow closes it.
 */
export declare function resolveMenubarKey(press: MenubarKeyPress): MenubarKeyAction | null;
//# sourceMappingURL=menubar-keys.d.ts.map