import { type ReactNode } from 'react';
import type { BaseProps, ControlSize, NativeProps, Orientation } from '../../core/props.js';
import { type MenuProps } from '../menu/menu.js';
export interface MenubarProps extends Omit<NativeProps<'div'>, 'role' | 'children' | 'aria-orientation'>, BaseProps {
    /** The top-level menus, as `MenubarMenu` elements. */
    children?: ReactNode;
    /** Lays the top-level items out in a row (the default) or a column; the arrow keys follow it. */
    orientation?: Orientation | undefined;
    /** Row density of the bar and its menus. Defaults to `md`. */
    size?: ControlSize | undefined;
}
export interface MenubarMenuProps extends Pick<MenuProps, 'items' | 'children' | 'onAction'>, BaseProps {
    /** The top-level item's text, which also names its menu. */
    label: ReactNode;
}
/**
 * A menubar (`role="menubar"`): a row or column of top-level items that each open a menu, like an
 * application's File, Edit and View menus. It is one tab stop; the arrow keys move between the
 * items and from one open menu to the next, and once a menu is open, pointing at another item
 * opens its menu instead.
 */
export declare function Menubar({ orientation, size, className, children, ...rest }: MenubarProps): import("react").JSX.Element;
/**
 * One top-level item of a `Menubar` and the menu it opens (React Aria `MenuTrigger` with the
 * library `Menu`, so the menu takes items, sections, separators, selection, shortcuts and submenus).
 * The menu floats without hiding the page, so the bar stays reachable while it is open.
 */
export declare function MenubarMenu({ items, children, onAction, ...trigger }: MenubarMenuProps): import("react").JSX.Element;
//# sourceMappingURL=menubar.d.ts.map