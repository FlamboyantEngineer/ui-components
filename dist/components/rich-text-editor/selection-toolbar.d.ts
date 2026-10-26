import { type ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
export interface SelectionToolbarProps extends BaseProps, AriaLabellingProps {
    /** Controls after the marks and the link button. */
    children?: ReactNode;
}
/**
 * A toolbar floating above selected text in the enclosing `RichTextEditor`, for its children: the
 * marks and the link button. Alt+F10 moves focus into it from the document and Escape returns.
 */
export declare function SelectionToolbar({ className, children, ...rest }: SelectionToolbarProps): import("react").JSX.Element;
//# sourceMappingURL=selection-toolbar.d.ts.map