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
 * Arrow keys, Home, End, PageUp and PageDown on a day cell move the focused day (and with it the
 * month or week on show), then focus its cell; focus landing in a day of the period makes it the
 * focused day, so the tab stop follows the reader.
 */
export function useCalendarGrid({
  focused,
  setFocused,
  mode,
  isInPeriod,
}: CalendarGridOptions): CalendarGrid {
  const { locale, direction } = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const shouldFocus = useRef(false);
  useLayoutEffect(() => {
    if (!shouldFocus.current) return;
    shouldFocus.current = false;
    ref.current?.querySelector<HTMLElement>(`${dayCellSelector}[data-date="${focused}"]`)?.focus();
  }, [focused]);
  return {
    ref,
    onKeyDown: (event) => {
      const target = event.target as Element;
      if (!target.matches(dayCellSelector) || event.altKey || event.ctrlKey || event.metaKey)
        return;
      const isRightToLeft = direction === 'rtl';
      const next = moveFocusedDay(focused, { key: event.key, mode, isRightToLeft, locale });
      if (!next) return;
      event.preventDefault();
      if (next === focused) return;
      shouldFocus.current = true;
      setFocused(next);
    },
    onFocus: (event) => {
      const cell = (event.target as Element).closest(dayCellSelector);
      const day = cell?.getAttribute('data-date');
      if (day && day !== focused && isInPeriod(day)) setFocused(day);
    },
  };
}
