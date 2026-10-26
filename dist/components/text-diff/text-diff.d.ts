import { type ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type TextDiffLine } from './diff-rows.js';
export type { TextDiffChange, TextDiffLine } from './diff-rows.js';
/** `unified` draws both texts in one column; `split` draws the old text beside the new one. */
export type TextDiffLayout = 'unified' | 'split';
export interface TextDiffProps extends BaseProps, AriaLabellingProps {
    /** The text before the change. */
    oldText: string;
    /** The text after the change. */
    newText: string;
    /** One column, or the two texts side by side. Defaults to `unified`. */
    layout?: TextDiffLayout | undefined;
    /** Unchanged lines kept beside each change; longer unchanged runs fold. Defaults to 3. */
    context?: number | undefined;
    /** Draws content under a line, such as its comments; nothing when it returns nothing. */
    renderLineWidget?: ((line: TextDiffLine) => ReactNode) | undefined;
}
/**
 * The line diff of two texts, unified or split side by side, with word changes inside changed
 * lines, line numbers, unchanged runs folded behind buttons, widgets under lines, and a header
 * that counts the changes and moves between them.
 */
export declare function TextDiff({ oldText, newText, layout, context, renderLineWidget, className, ...rest }: TextDiffProps): import("react").JSX.Element;
//# sourceMappingURL=text-diff.d.ts.map