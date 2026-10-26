import type { ReactNode, Ref } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Orientation } from '../../core/props.js';
import type { ElementRender } from '../../utils/render-element.js';
/** `regular` and `compact` space the buttons apart; `attached` joins them into one control. */
export type ButtonGroupDensity = 'regular' | 'compact' | 'attached';
/** The states a button group passes to `render` with its root's props. */
export interface ButtonGroupRenderState {
    /** The pointer is over the group. */
    isHovered: boolean;
    /** Focus is inside the group. */
    isFocusWithin: boolean;
    /** Keyboard focus is inside the group. */
    isFocusVisible: boolean;
}
export interface ButtonGroupProps extends BaseProps, AriaLabellingProps {
    /** The buttons: `Button` elements or `DropdownMenu` triggers. */
    children?: ReactNode;
    /** Lays the buttons out in a row or a column. Defaults to `horizontal`. */
    orientation?: Orientation | undefined;
    /** How close the buttons sit. Defaults to `regular`. */
    density?: ButtonGroupDensity | undefined;
    /** The buttons share the group's length equally. */
    justified?: boolean | undefined;
    /** The group element. */
    ref?: Ref<HTMLDivElement> | undefined;
    /** Replaces the root `<div>` with the caller's own, given its props and the group's state. */
    render?: ElementRender<'div', ButtonGroupRenderState> | undefined;
}
/**
 * A labelled cluster of related buttons (`role="group"`): spaced or attached,
 * in a row or a column. Each button keeps its own tab stop; a row that should be one tab stop with
 * arrow-key focus is a toolbar.
 */
export declare function ButtonGroup({ orientation, density, justified, className, ...rest }: ButtonGroupProps): import("react").JSX.Element;
//# sourceMappingURL=button-group.d.ts.map