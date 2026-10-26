import { type ReactNode } from 'react';
import type { FocusEventProps } from '../../core/events.js';
import type { BaseProps, NativeProps } from '../../core/props.js';
/** The element that hides the content: a `<span>` keeps phrasing content valid. */
export type VisuallyHiddenElement = 'div' | 'span';
export interface VisuallyHiddenProps extends BaseProps, Pick<FocusEventProps, 'onFocus' | 'onBlur'>, Pick<NativeProps<'div'>, 'role'> {
    /** The content only assistive technology perceives. */
    children?: ReactNode;
    /** The element to render. Defaults to `div`. */
    elementType?: VisuallyHiddenElement | undefined;
    /** Shows the content while it or a descendant has focus, as a skip link does. */
    isFocusable?: boolean | undefined;
}
/**
 * Content only assistive technology perceives, such as the name of an icon-only control. With
 * `isFocusable` it shows while it or a descendant has focus, as a skip link does.
 */
export declare function VisuallyHidden({ className, isFocusable, ...rest }: VisuallyHiddenProps): import("react").JSX.Element;
//# sourceMappingURL=visually-hidden.d.ts.map