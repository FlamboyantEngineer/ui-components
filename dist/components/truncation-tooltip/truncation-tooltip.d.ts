import { type ReactNode } from 'react';
import type { BaseProps, NativeProps } from '../../core/props.js';
import { type TooltipPlacement } from '../tooltip/tooltip.js';
/** The pointer handlers the component owns on its text. */
type TruncationPointerHandler = 'onPointerEnter' | 'onPointerLeave' | 'onPointerDown';
export interface TruncationTooltipProps extends Omit<NativeProps<'span'>, 'children' | TruncationPointerHandler>, BaseProps {
    /** The text. The stylesheet cuts it (ellipsis or line clamp); the tooltip shows it whole. */
    children: ReactNode;
    /** Preferred side of the text. Defaults to `top`; the tooltip flips when it does not fit. */
    placement?: TooltipPlacement | undefined;
    /** Hover delay before the tooltip opens, in milliseconds. Keyboard focus opens it at once. */
    delay?: number | undefined;
    /** Draws a "Show more" control after cut text that shows it whole in place, then "Show less". */
    expandable?: boolean | undefined;
    /** Whether expandable text is shown whole (controlled). */
    isExpanded?: boolean | undefined;
    /** Whether expandable text starts whole (uncontrolled). Defaults to `false`. */
    defaultExpanded?: boolean | undefined;
    /** Called with the requested state when the reader shows more or less. */
    onExpandedChange?: ((isExpanded: boolean) => void) | undefined;
}
/**
 * Text that shows its full content in a tooltip only while the stylesheet cuts it short. The
 * tooltip is visual: the text is already in the page, so nothing new is announced.
 */
export declare function TruncationTooltip({ children, placement, delay, expandable, isExpanded, defaultExpanded, onExpandedChange, className, ref: callerRef, ...rest }: TruncationTooltipProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=truncation-tooltip.d.ts.map