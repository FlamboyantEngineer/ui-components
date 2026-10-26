import { type ReactElement, type ReactNode } from 'react';
import type { AriaLabellingProps, OpenStateProps, SelectionProps } from '../../core/events.js';
import type { BaseProps, Key } from '../../core/props.js';
import { type MenuSize } from './menu-context.js';
import type { MenuItemProps, MenuItemRenderState, MenuSectionProps } from './menu-item.js';
/** One action described as data. With `items` it opens a submenu of those entries. */
export interface MenuItemEntry extends Omit<MenuItemProps, 'id' | 'children' | 'textValue'> {
    type?: 'item' | undefined;
    id: Key;
    /** The visible label, also used for type-to-select. */
    label: string;
    items?: readonly MenuEntry[] | undefined;
    /** Custom content, drawn instead of the default layout. */
    renderContent?: ((state: MenuItemRenderState) => ReactNode) | undefined;
}
/** A group of entries with an optional title and its own selection. */
export interface MenuSectionEntry extends Omit<MenuSectionProps, 'id' | 'children'> {
    type: 'section';
    id: Key;
    items: readonly MenuEntry[];
}
/** A rule between entries. */
export interface MenuSeparatorEntry {
    type: 'separator';
    id: Key;
}
export type MenuEntry = MenuItemEntry | MenuSectionEntry | MenuSeparatorEntry;
export interface MenuProps extends BaseProps, AriaLabellingProps, SelectionProps {
    /** Entries as data, used when there are no `children`. */
    items?: readonly MenuEntry[] | undefined;
    /** `MenuItem`, `MenuSection`, `MenuSeparator` and `SubmenuTrigger` elements. */
    children?: ReactNode;
    /** Called with the `id` of the item activated. A submenu without its own reports here. */
    onAction?: ((key: Key) => void) | undefined;
    /** Whether activating an item closes the menu. Defaults to true, except in multiple selection. */
    shouldCloseOnSelect?: boolean | undefined;
    /** Shown while the menu has no items. */
    renderEmptyState?: (() => ReactNode) | undefined;
    /** Row density. Submenus inherit it. Defaults to `md`. */
    size?: MenuSize | undefined;
    /** Leads the menu with a search field that narrows the items while focus stays in it. */
    filterable?: boolean | undefined;
    /** Marks the text typed in the enclosing search field (its own, or a command palette's) in the labels. */
    highlightMatches?: boolean | undefined;
    /** Renders only the rows in view of the scroll container, for long menus. */
    virtualized?: boolean | undefined;
    /** The height of every row of a virtualized menu, in pixels. Defaults to 24, 28 or 32 by `size`. */
    rowHeight?: number | undefined;
    /** Called when the end of the menu scrolls into view while `isLoading` is false. */
    onLoadMore?: (() => void) | undefined;
    /** More items are loading: the menu ends with a loading row. */
    isLoading?: boolean | undefined;
}
/** A trigger and the `MenuPopover` it opens. */
export interface MenuTriggerProps extends OpenStateProps {
    /** The trigger (a `Button`, an `Button` or another pressable), then its `MenuPopover`. */
    children: ReactNode;
}
/** A `MenuItem` and the submenu it opens. */
export interface SubmenuTriggerProps {
    /** The `MenuItem` that opens the submenu, then the submenu's `MenuPopover`. */
    children: ReactElement[];
}
/**
 * A list of actions or options (React Aria `Menu`), standalone or in a `MenuPopover`. A submenu's
 * `Menu` without its own `onAction` reports to the menu that opens it. It can lead with a search
 * field that filters its items, mark the typed text in their labels, render only the rows in view,
 * and end with a sentinel that loads more of them.
 */
export declare function Menu(props: MenuProps): import("react").JSX.Element;
/**
 * Opens its `MenuPopover` from its trigger (React Aria `MenuTrigger`): on press, Enter or Space,
 * and on Arrow Down or Arrow Up, which focus the first or last item.
 */
export declare function MenuTrigger({ children, ...openState }: MenuTriggerProps): import("react").JSX.Element;
/**
 * Makes its `MenuItem` open the `MenuPopover` beside it (React Aria `SubmenuTrigger`). The item
 * ignores `focusableWhenDisabled`: hover and the arrow key would still open the submenu.
 */
export declare function SubmenuTrigger({ children }: SubmenuTriggerProps): import("react").JSX.Element;
export { MenuItem, MenuSection, MenuSeparator } from './menu-item.js';
export type { MenuItemProps, MenuItemRenderState, MenuItemTone, MenuSectionProps, MenuSeparatorProps, } from './menu-item.js';
export { MenuOverlay, MenuPopover } from './menu-popover.js';
export type { MenuOverlayProps, MenuPopoverProps } from './menu-popover.js';
export type { MenuSize } from './menu-context.js';
export { joinMenuGroups } from './menu-groups.js';
//# sourceMappingURL=menu.d.ts.map