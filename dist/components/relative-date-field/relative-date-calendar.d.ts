import { type RelativeDateBounds, type RelativeDateKind, type RelativeDateRange, type RelativeDateValue } from './relative-date.js';
export interface PresetCalendarProps {
    kind: RelativeDateKind;
    value: RelativeDateValue | null;
    bounds: RelativeDateBounds;
    /** The field clock's `YYYY-MM-DD` day, which the calendar shows while there is no value. */
    today: string;
    /** Receives the picked `YYYY-MM-DD` day, or the picked range of days. */
    onPick: (picked: string | RelativeDateRange) => void;
}
/**
 * The calendar beside the presets (the Date Time Field's calendar parts): picking a day, or a range
 * of days, commits it and closes the popover. Days outside the bounds cannot be picked.
 */
export declare function PresetCalendar({ kind, value, bounds, today, onPick }: PresetCalendarProps): import("react").JSX.Element;
//# sourceMappingURL=relative-date-calendar.d.ts.map