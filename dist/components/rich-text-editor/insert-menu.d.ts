import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type InsertMenuItem } from './insert-items.js';
export interface InsertMenuProps extends BaseProps, AriaLabellingProps {
    /** Entries after the built-in blocks, such as a template or a custom node. */
    items?: readonly InsertMenuItem[] | undefined;
}
export interface InsertMenuButtonProps extends BaseProps {
    /** Entries after the built-in blocks. */
    items?: readonly InsertMenuItem[] | undefined;
}
/**
 * The slash command menu of the enclosing `RichTextEditor`, for its children: typing `/` at the
 * start of a block or after a space lists the blocks to insert at the caret, filtered by what
 * follows the slash. Arrow keys move through the list, Enter or Tab inserts, Escape closes it.
 */
export declare function InsertMenu({ items, className, ...rest }: InsertMenuProps): import("react").JSX.Element;
/**
 * A button that opens the menu of blocks to insert at the selection in the enclosing
 * `RichTextEditor`, for its toolbar.
 */
export declare function InsertMenuButton({ items, className, ...rest }: InsertMenuButtonProps): import("react").JSX.Element;
export type { InsertMenuItem } from './insert-items.js';
//# sourceMappingURL=insert-menu.d.ts.map