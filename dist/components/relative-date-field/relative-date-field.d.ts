import type { OpenStateProps } from '../../core/events.js';
import { type FieldInputProps } from '../field/field.js';
import { type RelativeDateComputedPreset, type RelativeDateKind, type RelativeDatePreset, type RelativeDateRange } from './relative-date.js';
/** A `YYYY-MM-DD` date or local `YYYY-MM-DDTHH:mm` date and time, or a `{ start, end }` range of dates. */
export type RelativeDateFieldValue<K extends RelativeDateKind = 'date'> = K extends 'date-range' ? RelativeDateRange | null : string | null;
export interface RelativeDateFieldProps<K extends RelativeDateKind = 'date'> extends FieldInputProps<RelativeDateFieldValue<K>>, OpenStateProps {
    /** What a preset commits: a `YYYY-MM-DD` date (the default), a date and time or a range of dates. */
    valueKind?: K | undefined;
    /**
     * The choices, in order: counts of units from now, with optional labels, or named values computed
     * from now. Defaults to today, tomorrow, yesterday, next week and last week (for a range: today,
     * the last 7 and 30 days and the next 7 days).
     */
    presets?: readonly (RelativeDatePreset | RelativeDateComputedPreset<NonNullable<RelativeDateFieldValue<K>>>)[] | undefined;
    /** The clock presets and relative text count from. Defaults to the current time. */
    getNow?: (() => Date) | undefined;
    /** The trigger's text while there is no value. Defaults to the provider string. */
    placeholder?: string | undefined;
    /** Values this many days away or more read as absolute dates. Defaults to 7. */
    fallbackAfterDays?: number | undefined;
    /** The earliest `YYYY-MM-DD` date a value may fall on; presets before it are disabled. */
    minValue?: string | undefined;
    /** The latest `YYYY-MM-DD` date a value may fall on; presets after it are disabled. */
    maxValue?: string | undefined;
    /** Draws a calendar beside the presets, to pick any date (or range of dates). */
    showCalendar?: boolean | undefined;
}
/**
 * A field that sets a date, an instant or a range of dates from relative presets (React Aria
 * `Select`), and with `showCalendar` from a calendar beside them: the trigger reads the value
 * relative to now, such as `Tomorrow` or `3 days ago`, and a preview after it gives the absolute
 * date. Picking a preset commits the value it stands for; presets outside the bounds are disabled.
 */
export declare function RelativeDateField<K extends RelativeDateKind = 'date'>(props: RelativeDateFieldProps<K>): import("react").JSX.Element;
export type { RelativeDateComputedPreset, RelativeDateKind, RelativeDatePreset, RelativeDateRange, RelativeDateUnit, } from './relative-date.js';
//# sourceMappingURL=relative-date-field.d.ts.map