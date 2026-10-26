import { type JSX } from 'react';
type TimeWithTooltipProps = JSX.IntrinsicElements['time'] & {
    /** The tooltip's text. */
    tooltip: string;
    /** The tooltip panel's class. */
    tooltipClassName: string;
};
/**
 * A `<time>` element that takes focus and shows `tooltip` on hover and keyboard focus. React Aria's
 * tooltip trigger drives it directly: its `Focusable` expects an interactive role, which a
 * timestamp does not have.
 */
export declare function TimeWithTooltip({ tooltip, tooltipClassName, ...rest }: TimeWithTooltipProps): JSX.Element;
export {};
//# sourceMappingURL=relative-time-tooltip.d.ts.map