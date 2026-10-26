import type { ReactElement } from 'react';
import type { ControlSize, Key } from '../../core/props.js';
import { type MenuEntry } from '../menu/menu.js';
import type { FieldState } from './field-state.js';
/** A built-in field menu action: Clear, Set to default or Help. */
export type FieldMenuAction = 'clear' | 'set-default' | 'help';
/** A built-in action by name, or any menu entry. */
export type FieldMenuEntry = FieldMenuAction | MenuEntry;
export interface FieldMenuModel {
    /** The accessible name of both menus. */
    label: string;
    entries: MenuEntry[];
    onAction: (key: Key) => void;
    isDisabled: boolean;
}
/**
 * The field menu's entries in the caller's order, with built-in actions applied to the field state
 * before `onMenuAction` hears of any chosen entry.
 */
export declare function useFieldMenu(state: FieldState<unknown>, label: string, options: {
    menu: readonly FieldMenuEntry[];
    onMenuAction?: ((key: Key) => void) | undefined;
}): FieldMenuModel;
/** The field's menu button. */
export declare function FieldMenuButton({ model, size, className, }: {
    model: FieldMenuModel;
    size: ControlSize;
    className: string;
}): import("react").JSX.Element;
/** Opens the field menu on a secondary click, a long touch, Shift+F10 or the Context Menu key. */
export declare function FieldContextMenu({ model, children, }: {
    model: FieldMenuModel;
    children: ReactElement;
}): import("react").JSX.Element;
//# sourceMappingURL=field-menu.d.ts.map