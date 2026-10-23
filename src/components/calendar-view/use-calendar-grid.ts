import {
  useLayoutEffect,
  useRef,
  type FocusEvent,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import { useLocale } from '../../primitives/index.js';
import type { CalendarViewMode } from './calendar-view.js';
import { moveFocusedDay } from './calendar-days.js';

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

const dayCellSelector = '[role="gridcell"][data-date]';

/**
 * Arrow keys, Home, End, PageUp and PageDown on a day cell move from that cell's day, make the day
 * they reach the focused day (showing its month or week), then focus its cell; focus landing in a
 * day of the period makes it the focused day, so the tab stop follows the reader. A move the owner
 * of a controlled date does not apply leaves focus where it is.
 */
export function useCalendarGrid({
  focused,
  setFocused,
  mode,
  isInPeriod,
}: CalendarGridOptions): CalendarGrid {
  const { locale, direction } = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  /** The day a keyboard move asked for, focused once it is the focused day. */
  const pendingFocus = useRef<string | null>(null);
  const focusDay = (day: string) =>
    ref.current?.querySelector<HTMLElement>(`${dayCellSelector}[data-date="${day}"]`)?.focus();
  // Runs after every render: a render that does not show the requested day drops the request.
  useLayoutEffect(() => {
    const pending = pendingFocus.current;
    if (pending === null) return;
    pendingFocus.current = null;
    if (pending === focused) focusDay(pending);
  });
  return {
    ref,
    onKeyDown: (event) => {
      const target = event.target as Element;
      if (!target.matches(dayCellSelector) || event.altKey || event.ctrlKey || event.metaKey)
        return;
      const isRightToLeft = direction === 'rtl';
      const from = target.getAttribute('data-date') ?? focused;
      const next = moveFocusedDay(from, { key: event.key, mode, isRightToLeft, locale });
      if (!next) return;
      event.preventDefault();
      if (next === focused) {
        focusDay(next);
        return;
      }
      pendingFocus.current = next;
      setFocused(next);
    },
    onFocus: (event) => {
      const cell = (event.target as Element).closest(dayCellSelector);
      const day = cell?.getAttribute('data-date');
      if (day && day !== focused && isInPeriod(day)) setFocused(day);
    },
  };
}
