import type { ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
export interface FormatToolbarProps extends BaseProps, AriaLabellingProps {
    /** Controls after the built-in ones, such as an `InsertMenuButton` or the caller's own. */
    children?: ReactNode;
}
/**
 * The formatting toolbar of the enclosing `RichTextEditor`, for its `toolbar` slot: undo and redo,
 * the block type, the marks, the link and the lists and quote, each reflecting the selection.
 * Commands the schema lacks are left out.
 */
export declare function FormatToolbar({ className, children, ...rest }: FormatToolbarProps): import("react").JSX.Element;
//# sourceMappingURL=format-toolbar.d.ts.map