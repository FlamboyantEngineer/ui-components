import type { ReactNode } from 'react';
import type { Key } from '../../core/props.js';
import { type SelectFieldItem, type SelectFieldOption } from './select-options.js';
/** The state of an option row that `renderOption` draws for. */
export interface SelectFieldOptionState {
    /** The option is chosen. */
    isSelected: boolean;
    /** The option has focus, from the keyboard or the pointer. */
    isFocused: boolean;
    /** The option has keyboard focus. */
    isFocusVisible: boolean;
    /** The pointer is over the option. */
    isHovered: boolean;
    /** The option is being pressed. */
    isPressed: boolean;
    /** The option cannot be chosen. */
    isDisabled: boolean;
}
/** Draws an option's content in the list instead of its icon, label and description. */
export type SelectFieldOptionRenderer = (option: SelectFieldOption, state: SelectFieldOptionState) => ReactNode;
/** How every option of the list is drawn. */
export interface SelectOptionsDisplay {
    isMultiple: boolean;
    /** Options that cannot be picked now, beside those disabled themselves. */
    blockedKeys: ReadonlySet<Key>;
    renderOption?: SelectFieldOptionRenderer | undefined;
}
/** What the rows depend on beyond their own item, so a cached row is drawn again when it changes. */
export declare function toDisplayDependencies(display: SelectOptionsDisplay): unknown[];
/**
 * Draws the list's items in a React Aria `Collection`, which keeps each item's row while the item
 * and the display stay the same, so filtering a long list does not draw every row again: an option
 * row, or a group as a section (React Aria `ListBoxSection`) led by its heading, when it has one,
 * and holding its options. Rows carry their collection key as `id`, which also keys them.
 */
export declare function SelectListItems({ items, display, }: {
    items: readonly SelectFieldItem[];
    display: SelectOptionsDisplay;
}): import("react").JSX.Element;
//# sourceMappingURL=select-option.d.ts.map