import type { CSSProperties } from 'react';
import type { Key } from '../../core/props.js';
import type { PlacedEvent } from './calendar-layout.js';
import type { CalendarFormat } from './use-calendar-format.js';
/** What every event of a calendar view needs. */
export interface CalendarEventContext {
    format: CalendarFormat;
    onEventAction: ((key: Key) => void) | undefined;
}
export interface CalendarEventButtonProps {
    placed: PlacedEvent;
    context: CalendarEventContext;
    /** Whether the event is in the Tab sequence: only the focused day's events are. */
    isTabbable: boolean;
    /** The time shown before the title: the start, the range, or none. */
    time: 'start' | 'range' | 'none';
    continuesBefore?: boolean | undefined;
    continuesAfter?: boolean | undefined;
    /** Its geometry: a bar's width across days, or a timed block's place in its day. */
    style?: CSSProperties | undefined;
}
export interface CalendarMoreEventsProps {
    /** The day's events, all of them. */
    events: readonly PlacedEvent[];
    /** How many of them the cell hides. */
    hidden: number;
    /** The day in full, which titles the list. */
    dayLabel: string;
    isTabbable: boolean;
    context: CalendarEventContext;
}
/**
 * One event: a button showing its title, after its time when asked, and named by its title and when
 * it happens; a press calls `onEventAction` with its key.
 */
export declare function CalendarEventButton({ placed, context, isTabbable, time, continuesBefore, continuesAfter, style, }: CalendarEventButtonProps): import("react").JSX.Element;
/** The `+3 more` button of a crowded day, opening a popover that lists all of the day's events. */
export declare function CalendarMoreEvents({ events, hidden, dayLabel, isTabbable, context, }: CalendarMoreEventsProps): import("react").JSX.Element;
//# sourceMappingURL=calendar-event.d.ts.map