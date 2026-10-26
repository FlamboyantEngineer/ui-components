import { type JSX, type ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Orientation } from '../../core/props.js';
import type { ElementRender } from '../../utils/render-element.js';
/** The line style. */
export type SeparatorVariant = 'solid' | 'dashed' | 'dotted';
/** Where a label sits along the line, in the writing direction. */
export type SeparatorLabelPosition = 'start' | 'center' | 'end';
/** The element a separator renders when it can hold an `<hr>`'s rule. */
export type SeparatorElement = 'hr' | 'div' | 'li';
/** The state a separator passes to `render` with its element's props. */
export interface SeparatorRenderState {
    orientation: Orientation;
}
export interface SeparatorProps extends BaseProps, Pick<AriaLabellingProps, 'aria-label' | 'aria-labelledby'> {
    /** `horizontal` (the default) separates blocks; `vertical` separates inline items. */
    orientation?: Orientation | undefined;
    /** The element for an unlabelled horizontal rule. Defaults to `hr`; otherwise a `<div>`. */
    elementType?: SeparatorElement | undefined;
    /** Line style. Defaults to `solid`. */
    variant?: SeparatorVariant | undefined;
    /** Content drawn across the line, between a start and an end line; it names the separator. */
    label?: ReactNode;
    /** Where the label sits along the line. Defaults to `center`. */
    labelPosition?: SeparatorLabelPosition | undefined;
    /** A purely visual rule (`role="none"`) that assistive technology passes over. */
    decorative?: boolean | undefined;
    /**
     * Replaces the separator's element with the caller's own of the same type, given its finished
     * props and state.
     */
    render?: ElementRender<'div', SeparatorRenderState> | undefined;
}
/**
 * A rule between groups of content, horizontal or vertical, optionally
 * with a label drawn across it that also names it.
 */
export declare function Separator({ orientation, variant, label, labelPosition, decorative, elementType, render, className, ...rest }: SeparatorProps): JSX.Element;
//# sourceMappingURL=separator.d.ts.map