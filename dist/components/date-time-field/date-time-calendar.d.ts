import { type ReactNode } from 'react';
import type { DateTimeFieldDateState } from './date-time-field.js';
import type { DateControlSettings } from './date-time-pickers.js';
import { type DateFieldValue, type DateTimeFieldMode } from './date-values.js';
/** A named value offered beside the calendar, such as `Last 7 days`. */
export interface DateTimeFieldPreset<V> {
    label: string;
    /** The value the preset sets, in the field's format. */
    value: V;
}
/** How the calendar heading shows its month: as text, or as month and year selects. */
export type DateTimeFieldCalendarHeading = 'text' | 'select';
interface CalendarPopoverProps {
    mode: DateTimeFieldMode;
    settings: DateControlSettings;
    onPick: (value: DateFieldValue) => void;
    children: ReactNode;
}
/** The heading (text or selects) with month navigation, and one grid per visible month. */
export declare function CalendarBody({ months, heading, getDateState, }: {
    months: number;
    getDateState?: ((date: string) => DateTimeFieldDateState | undefined) | undefined;
    heading: DateTimeFieldCalendarHeading;
}): import("react").JSX.Element;
/**
 * The picker's popover on the `dropdown` layer: a dialog holding the presets, the calendar and the
 * actions.
 */
export declare function CalendarPopover({ mode, settings, onPick, children }: CalendarPopoverProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=date-time-calendar.d.ts.map