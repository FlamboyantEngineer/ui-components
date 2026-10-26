import { type ReactNode } from 'react';
import type { PressEventProps, SelectionProps } from '../../core/events.js';
import type { BaseProps, Key, SelectionMode, Tone } from '../../core/props.js';
import { type IconSource } from '../icon/icon.js';
import { type ShortcutProps } from '../shortcut/shortcut.js';
/** Emphasis of a menu item: `danger` marks a destructive action. */
export type MenuItemTone = Extract<Tone, 'neutral' | 'danger'>;
/** The state a menu item hands to custom content (`children` as a function). */
export interface MenuItemRenderState {
    isHovered: boolean;
    isFocused: boolean;
    isFocusVisible: boolean;
    isPressed: boolean;
    isSelected: boolean;
    isDisabled: boolean;
    /** The selection of the menu or section the item belongs to. */
    selectionMode: SelectionMode;
    /** The item opens a submenu. */
    hasSubmenu: boolean;
    /** Its submenu is open. */
    isOpen: boolean;
}
export interface MenuItemProps extends Omit<BaseProps, 'id'>, PressEventProps {
    /** Identifies the item in `onAction`, selections and `disabledKeys`. */
    id?: Key | undefined;
    /** Makes the item a link to this URL, navigated through the provider's `navigate` when set. */
    href?: string | undefined;
    /** The label, or a render function for custom content that replaces the default layout. */
    children?: ReactNode | ((state: MenuItemRenderState) => ReactNode);
    /** The text used for type-to-select. Defaults to the label when it is a string. */
    textValue?: string | undefined;
    /** Names the item when its content does not. */
    'aria-label'?: string | undefined;
    /** Called when the item is activated. */
    onAction?: (() => void) | undefined;
    /** Whether activating the item closes the menu. Defaults to the menu's setting. */
    shouldCloseOnSelect?: boolean | undefined;
    /** Drawn before the label. */
    icon?: IconSource;
    /** Secondary text after the label. */
    description?: ReactNode;
    /** A keyboard chord shown after the label. */
    shortcut?: ShortcutProps['chord'] | undefined;
    /** Defaults to `neutral`. */
    tone?: MenuItemTone | undefined;
    /** Keeps the item visible but out of reach. */
    isDisabled?: boolean | undefined;
    /** Keeps a disabled item in keyboard navigation, with `aria-disabled="true"`, refusing activation. */
    focusableWhenDisabled?: boolean | undefined;
    /** Draws a busy indicator instead of the icon and refuses activation. */
    isPending?: boolean | undefined;
    /**
     * Makes the item a check item of its own (`menuitemcheckbox`), checked while true, in a menu or
     * section without selection. Activating it calls `onAction`, for the caller to flip it.
     */
    isSelected?: boolean | undefined;
}
export interface MenuSectionProps extends Omit<BaseProps, 'id'>, Omit<SelectionProps, 'disabledKeys'> {
    /** Identifies the section among the menu's entries. */
    id?: Key | undefined;
    /** A heading drawn above the section's items, which also names the group. */
    title?: ReactNode;
    /** Names the group when it has no `title`. */
    'aria-label'?: string | undefined;
    /** Whether activating one of its items closes the menu. Defaults to the menu's setting. */
    shouldCloseOnSelect?: boolean | undefined;
    children?: ReactNode;
}
export type MenuSeparatorProps = Omit<BaseProps, 'id'>;
/** One menu row: selection check, icon, label, description, shortcut and submenu arrow. */
export declare function MenuItem({ id, children, icon, description, shortcut, tone, isPending, isDisabled, focusableWhenDisabled, isSelected, textValue, className, href, ...rest }: MenuItemProps): import("react").JSX.Element;
/** A group of menu items with an optional heading and its own selection mode. */
export declare function MenuSection({ id, title, children, className, selectedKeys, defaultSelectedKeys, onSelectionChange, ...rest }: MenuSectionProps): import("react").JSX.Element;
/** A rule between menu items or sections: a `Separator` with the menu's hook. */
export declare function MenuSeparator({ className, ...rest }: MenuSeparatorProps): import("react").JSX.Element;
//# sourceMappingURL=menu-item.d.ts.map