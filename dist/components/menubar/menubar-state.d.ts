import { type KeyboardEvent, type RefObject } from 'react';
import type { Orientation } from '../../core/props.js';
import type { MenuSize } from '../menu/menu.js';
/** Where focus goes in a menu the bar opens: its first or last item, or (`null`) the menu itself. */
type MenuFocus = 'first' | 'last' | null;
/** The part of a top-level item's menu state the bar drives; closing also closes its submenus. */
interface MenubarMenuState {
    open: (focus: MenuFocus) => void;
    close: () => void;
}
interface MenubarContextValue {
    orientation: Orientation;
    size: MenuSize;
    /** The open menu's key. */
    openKey: string | null;
    /** The top-level item in the tab sequence. */
    tabKey: string | null;
    /** Records a top-level item and its menu state, returning the cleanup; the function is stable. */
    register: (key: string, trigger: TriggerEntry | null) => (() => void) | undefined;
    /** React Aria's trigger opened or closed a menu. */
    setOpen: (key: string, isOpen: boolean) => void;
    /** Closes a menu with its submenus. */
    close: (key: string) => void;
    /** A top-level item took focus, so it becomes the tab stop. */
    setTabKey: (key: string) => void;
    /** The pointer entered a top-level item: while another menu is open, its menu opens instead. */
    switchTo: (key: string) => void;
    /** Whether an element is part of the bar or of an open submenu, so a press on it is not outside. */
    isInside: (element: Element) => boolean;
}
/** A top-level item's element and the latest state of its menu. */
interface TriggerEntry {
    element: HTMLElement;
    state: RefObject<MenubarMenuState | null>;
}
interface MenubarStateOptions {
    rootRef: RefObject<HTMLElement | null>;
    orientation: Orientation;
    size: MenuSize;
    direction: 'ltr' | 'rtl';
}
export declare const MenubarContext: import("react").Context<MenubarContextValue | null>;
/** The enclosing menubar's state; a `MenubarMenu` works only inside a `Menubar`. */
export declare function useMenubarContext(): MenubarContextValue;
/**
 * The state behind a `Menubar`: its context value and the capture-phase key handler for its root,
 * which sees key presses on the top-level items and, through React's tree, in their open menus.
 */
export declare function useMenubarState({ rootRef, orientation, size, direction }: MenubarStateOptions): {
    context: MenubarContextValue;
    onKeyDownCapture: (event: KeyboardEvent<HTMLElement>) => void;
};
export {};
//# sourceMappingURL=menubar-state.d.ts.map