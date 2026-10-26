import { type ReactNode } from 'react';
import type { BaseProps, Placement } from '../../core/props.js';
import { type ButtonProps } from '../button/button.js';
import type { IconSource } from '../icon/icon.js';
import { type MenuProps, type MenuSize, type MenuTriggerProps } from '../menu/menu.js';
export interface DropdownMenuProps extends Omit<MenuTriggerProps, 'children'>, DropdownMenuMenuProps, Pick<ButtonProps, 'variant' | 'size' | 'isDisabled' | 'ref' | 'onPress'>, BaseProps {
    /** The trigger's text, or its accessible name when `iconOnly` (then it must be text). */
    label: ReactNode;
    /** Drawn before the label, or alone when `iconOnly`. */
    icon?: IconSource;
    /** Draws the trigger as an `Button` showing only `icon` (`more` by default). */
    iconOnly?: boolean | undefined;
    /** Draws a caret after the label of a button trigger. Defaults to true. */
    showCaret?: boolean | undefined;
    /** Menu row density. Defaults to the trigger size (`sm` for an `xs` trigger). */
    menuSize?: MenuSize | undefined;
    /** Where the menu opens against the trigger. Defaults to `bottom start`. */
    placement?: Placement | undefined;
    /** Makes a split button: the labelled button runs `onPress`, a chevron beside it opens the menu. */
    onPress?: ButtonProps['onPress'];
}
type DropdownMenuMenuProps = Pick<MenuProps, 'items' | 'children' | 'onAction' | 'selectionMode' | 'selectedKeys' | 'defaultSelectedKeys' | 'onSelectionChange' | 'disabledKeys' | 'disallowEmptySelection' | 'shouldCloseOnSelect' | 'filterable' | 'aria-label' | 'aria-labelledby'>;
/**
 * A button that opens a menu (React Aria `MenuTrigger`, which wires `aria-haspopup`,
 * `aria-expanded` and focus). Menu props pass to the `Menu`; the rest to the trigger. With
 * `onPress` it is a split button whose chevron opens the menu.
 */
export declare function DropdownMenu({ isOpen, defaultOpen, onOpenChange, placement, menuSize, items, children, onAction, selectionMode, selectedKeys, defaultSelectedKeys, onSelectionChange, disabledKeys, disallowEmptySelection, shouldCloseOnSelect, filterable, 'aria-label': menuLabel, 'aria-labelledby': menuLabelledBy, size, onPress, ...trigger }: DropdownMenuProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=dropdown-menu.d.ts.map