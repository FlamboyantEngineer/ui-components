'use client';

// The open list of a period field: a page of twelve months or years in a grid.

import { useState } from 'react';
import { ChevronLeftGlyph, ChevronRightGlyph } from '../../core/glyphs.js';
import { useUiStrings } from '../../core/provider.js';
import { ListBox, ListBoxItem, useLocale } from '../../primitives/index.js';
import { getDateTimeFormat } from '../../utils/intl-format.js';
import { Button } from '../button/button.js';
import { periodFieldHooks as hooks } from './period-field-hooks.js';
import {
  listPage,
  type PeriodGranularity,
  type PeriodIndex,
  toFormatDate,
  toPage,
  writePeriod,
} from './period-values.js';

/** Calendars whose months are the Gregorian months, whatever they number the years. */
const gregorianMonthCalendars = new Set(['gregory', 'buddhist', 'japanese', 'roc', 'iso8601']);

/**
 * The calendar periods are written in: the locale's own while its months are the Gregorian months
 * a period holds, else the Gregorian calendar, so `2026-03` never reads as another calendar's month.
 */
function toPeriodCalendar(locale: string): { calendar?: string } {
  const { calendar } = getDateTimeFormat(locale, { timeZone: 'UTC' }).resolvedOptions();
  return gregorianMonthCalendars.has(calendar) ? {} : { calendar: 'gregory' };
}

/** The writers of a period in the locale: its full name, and its short text in the grid. */
export function usePeriodFormats(granularity: PeriodGranularity) {
  const { locale } = useLocale();
  const isMonth = granularity === 'month';
  const calendar = toPeriodCalendar(locale);
  const full = getDateTimeFormat(locale, {
    ...(isMonth ? { month: 'long' } : {}),
    year: 'numeric',
    timeZone: 'UTC',
    ...calendar,
  });
  const short = getDateTimeFormat(locale, {
    ...(isMonth ? { month: 'short' } : { year: 'numeric' }),
    timeZone: 'UTC',
    ...calendar,
  });
  const year = getDateTimeFormat(locale, { year: 'numeric', timeZone: 'UTC', ...calendar });
  return {
    full: (index: PeriodIndex) => full.format(toFormatDate(index, granularity)),
    short: (index: PeriodIndex) => short.format(toFormatDate(index, granularity)),
    /** The page's heading: its year, or its first and last years. */
    page: (page: number) => {
      const periods = listPage(page);
      const first = year.format(toFormatDate(periods[0] ?? 0, granularity));
      const last = year.format(toFormatDate(periods.at(-1) ?? 0, granularity));
      return isMonth ? first : `${first} – ${last}`;
    },
  };
}

export interface PeriodPickerProps {
  granularity: PeriodGranularity;
  /** The chosen period, which the first page shows and the grid marks. */
  value: PeriodIndex | null;
  /** The page to open on without a value: the current period's, when the clock may be read. */
  fallback: PeriodIndex;
  min: PeriodIndex | null;
  max: PeriodIndex | null;
  isReadOnly: boolean;
  onPick: (text: string) => void;
}

/**
 * A heading with previous and next page buttons, and the page's twelve periods as a grid listbox:
 * the arrow keys move in two directions (mirrored right to left), periods beyond the bounds are
 * disabled, and choosing one picks it. Focus starts on the chosen period, else the first.
 */
export function PeriodPicker(props: PeriodPickerProps) {
  const { granularity, value, min, max, onPick } = props;
  const strings = useUiStrings();
  const isRtl = useLocale().direction === 'rtl';
  const formats = usePeriodFormats(granularity);
  const [page, setPage] = useState(() => toPage(value ?? props.fallback));
  const [autoFocus] = useState<'first' | true>(() => (value === null ? 'first' : true));
  const periods = listPage(page);
  const isOut = (index: PeriodIndex) =>
    (min !== null && index < min) || (max !== null && index > max);
  const heading = formats.page(page);
  return (
    <div {...hooks.slot('picker')}>
      <div {...hooks.slot('picker-header')}>
        <Button
          {...hooks.slot('picker-nav')}
          icon={isRtl ? ChevronRightGlyph : ChevronLeftGlyph}
          label={strings.previous}
          size="sm"
          isDisabled={min !== null && (periods[0] ?? 0) <= min}
          onPress={() => setPage(page - 1)}
        />
        <span {...hooks.slot('picker-heading')} aria-live="polite">
          {heading}
        </span>
        <Button
          {...hooks.slot('picker-nav')}
          icon={isRtl ? ChevronLeftGlyph : ChevronRightGlyph}
          label={strings.next}
          size="sm"
          isDisabled={max !== null && (periods.at(-1) ?? 0) >= max}
          onPress={() => setPage(page + 1)}
        />
      </div>
      <ListBox
        {...hooks.slot('grid', { granularity })}
        aria-label={heading}
        layout="grid"
        selectionMode="single"
        autoFocus={autoFocus}
        escapeKeyBehavior="none"
        selectedKeys={value === null ? [] : [writePeriod(value, granularity)]}
        disabledKeys={periods.filter(isOut).map((index) => writePeriod(index, granularity))}
        onSelectionChange={(keys) => {
          // Pressing the chosen period empties the selection: that picks it again.
          const [key = value === null ? undefined : writePeriod(value, granularity)] =
            keys === 'all' ? [] : [...keys];
          if (key !== undefined && !props.isReadOnly) onPick(String(key));
        }}
      >
        {periods.map((index) => {
          const id = writePeriod(index, granularity);
          return (
            <ListBoxItem
              {...hooks.slot('period')}
              key={id}
              id={id}
              textValue={formats.full(index)}
              aria-label={formats.full(index)}
            >
              {formats.short(index)}
            </ListBoxItem>
          );
        })}
      </ListBox>
    </div>
  );
}
