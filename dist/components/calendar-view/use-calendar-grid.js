import { useLayoutEffect, useRef, } from 'react';
import { useLocale } from '../../primitives/index.js';
import { moveFocusedDay } from './calendar-days.js';
const dayCellSelector = '[role="gridcell"][data-date]';
/**
 * Arrow keys, Home, End, PageUp and PageDown on a day cell move from that cell's day, make the day
 * they reach the focused day (showing its month or week), then focus its cell; focus landing in a
 * day of the period makes it the focused day, so the tab stop follows the reader. A move the owner
 * of a controlled date does not apply leaves focus where it is.
 */
export function useCalendarGrid({ focused, setFocused, mode, isInPeriod, }) {
    const { locale, direction } = useLocale();
    const ref = useRef(null);
    /** The day a keyboard move asked for, focused once it is the focused day. */
    const pendingFocus = useRef(null);
    const focusDay = (day) => ref.current?.querySelector(`${dayCellSelector}[data-date="${day}"]`)?.focus();
    // Runs after every render: a render that does not show the requested day drops the request.
    useLayoutEffect(() => {
        const pending = pendingFocus.current;
        if (pending === null)
            return;
        pendingFocus.current = null;
        if (pending === focused)
            focusDay(pending);
    });
    return {
        ref,
        onKeyDown: (event) => {
            const target = event.target;
            if (!target.matches(dayCellSelector) || event.altKey || event.ctrlKey || event.metaKey)
                return;
            const isRightToLeft = direction === 'rtl';
            const from = target.getAttribute('data-date') ?? focused;
            const next = moveFocusedDay(from, { key: event.key, mode, isRightToLeft, locale });
            if (!next)
                return;
            event.preventDefault();
            if (next === focused) {
                focusDay(next);
                return;
            }
            pendingFocus.current = next;
            setFocused(next);
        },
        onFocus: (event) => {
            const cell = event.target.closest(dayCellSelector);
            const day = cell?.getAttribute('data-date');
            if (day && day !== focused && isInPeriod(day))
                setFocused(day);
        },
    };
}
//# sourceMappingURL=use-calendar-grid.js.map