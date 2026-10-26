import { type FocusEvent, type KeyboardEvent, type RefObject } from 'react';
import type { CalendarViewMode } from './calendar-view.js';
export interface CalendarGridOptions {
    /** The focused day, which holds the grid's tab stop. */
    focused: string;
    setFocused: (date: string) => void;
    mode: CalendarViewMode;
    /** Whether a day focused by pointer may become the focused day (days of other months may not). */
    isInPeriod: (day: string) => boolean;
}
/** A calendar grid's keyboard navigation between days and its single tab stop. */
export interface CalendarGrid {
    ref: RefObject<HTMLDivElement | null>;
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
    onFocus: (event: FocusEvent<HTMLElement>) => void;
}
/**
 * Arrow keys, Home, End, PageUp and PageDown on a day cell move from that cell's day, make the day
 * they reach the focused day (showing its month or week), then focus its cell; focus landing in a
 * day of the period makes it the focused day, so the tab stop follows the reader. A move the owner
 * of a controlled date does not apply leaves focus where it is.
 */
export declare function useCalendarGrid({ focused, setFocused, mode, isInPeriod, }: CalendarGridOptions): CalendarGrid;
//# sourceMappingURL=use-calendar-grid.d.ts.map