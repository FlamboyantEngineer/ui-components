import type { BaseProps } from '../../core/props.js';
import { type RelativeTimeStyle } from '../../utils/relative-time.js';
export type { RelativeTimeStyle } from '../../utils/relative-time.js';
export interface RelativeTimeProps extends BaseProps {
    /** An ISO 8601 date (`YYYY-MM-DD`) or date and time, local or with an offset. */
    value: string | null | undefined;
    /** Values this many calendar days away or more read as the absolute date. Defaults to 7. */
    fallbackAfterDays?: number | undefined;
    /** The absolute date's style. Defaults to `medium`. */
    dateStyle?: RelativeTimeStyle | undefined;
    /** The absolute time's style, for a date and time. Defaults to `short`. */
    timeStyle?: RelativeTimeStyle | undefined;
    /** The clock the value is read against. Defaults to the current time. */
    getNow?: (() => Date) | undefined;
    /** Shows the absolute date in a tooltip on hover and keyboard focus. Defaults to true. */
    showTooltip?: boolean | undefined;
    /** Upper-cases the first letter, as at the start of a label. Defaults to true. */
    capitalize?: boolean | undefined;
    /** The text shown when the value is missing or unreadable. Without it nothing renders. */
    placeholder?: string | undefined;
}
/**
 * A timestamp read relative to now (`5 minutes ago`, `Yesterday`) in a `<time>` element, which
 * updates on one clock shared by every timestamp on the page and shows the absolute date in a
 * tooltip. Past `fallbackAfterDays` it reads as the absolute date.
 */
export declare function RelativeTime({ value, fallbackAfterDays, dateStyle, timeStyle, getNow, showTooltip, capitalize, placeholder, className, ...rest }: RelativeTimeProps): import("react").JSX.Element | null;
//# sourceMappingURL=relative-time.d.ts.map