'use client';

import { useContext, useId } from 'react';
import { ChevronLeftGlyph, ChevronRightGlyph } from '../../core/glyphs.js';
import { useUiStrings } from '../../core/provider.js';
import {
  CalendarCell,
  type CalendarDate,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  CalendarStateContext,
  Heading,
  RangeCalendarStateContext,
  useLocale,
} from '../../primitives/index.js';
import { getDateFormatter } from '../../utils/intl-format.js';
import { Button } from '../button/button.js';
import { CalendarHeadingSelects } from './date-time-calendar-heading.js';
import type { DateTimeFieldDateState } from './date-time-field.js';
import { dateTimeFieldHooks as hooks } from './date-time-field-hooks.js';

/** How the calendar heading shows its month: as text, or as month and year selects. */
export type DateTimeFieldCalendarHeading = 'text' | 'select';

/** How many months the calendar shows side by side. */
export type DateTimeFieldVisibleMonths = 1 | 2 | 3;

/** What the calendar's previous and next buttons move by: every visible month, or one month. */
export type DateTimeFieldCalendarPaging = 'page' | 'month';

/** How a calendar lays out its months. Each option has a default, so `{}` is one month. */
export interface CalendarOptions {
  /** Defaults to `text`. */
  heading?: DateTimeFieldCalendarHeading | undefined;
  /** Defaults to 1. */
  months?: DateTimeFieldVisibleMonths | undefined;
  /** Defaults to `page`. */
  paging?: DateTimeFieldCalendarPaging | undefined;
}

interface CalendarBodyProps {
  options?: CalendarOptions | undefined;
  getDateState?: ((date: string) => DateTimeFieldDateState | undefined) | undefined;
}

/** The props a calendar or range calendar takes for the options: its visible months and paging. */
export function toCalendarProps({ months = 1, paging = 'page' }: CalendarOptions) {
  return {
    visibleDuration: { months },
    pageBehavior: paging === 'month' ? ('single' as const) : ('visible' as const),
  };
}

function DateCell({
  date,
  state,
}: {
  date: CalendarDate;
  state: DateTimeFieldDateState | undefined;
}) {
  const id = useId();
  return (
    <CalendarCell
      date={date}
      {...hooks.slot('calendar-cell', { tone: state?.tone, taken: state?.isTaken })}
      render={(props) => (
        <div
          {...props}
          aria-describedby={
            [props['aria-describedby'], state?.description ? id : undefined]
              .filter(Boolean)
              .join(' ') || undefined
          }
        />
      )}
    >
      {({ formattedDate }) => (
        <>
          {formattedDate}
          {state?.description ? (
            <span id={id} hidden>
              {state.description}
            </span>
          ) : null}
        </>
      )}
    </CalendarCell>
  );
}

/** The calendar state of the nearest calendar or range calendar. */
function useCalendarState() {
  const single = useContext(CalendarStateContext);
  const range = useContext(RangeCalendarStateContext);
  const state = single ?? range;
  if (!state) throw new Error('A calendar body renders inside a calendar or a range calendar.');
  return state;
}

/**
 * The month and year a grid shows, written above it when several months show together. The grid's
 * own accessible name already says it, so assistive technology skips the caption.
 */
function MonthCaption({ offset, months }: { offset: number; months: number }) {
  const { locale } = useLocale();
  const state = useCalendarState();
  if (months === 1) return null;
  const month = state.visibleRange.start.add({ months: offset });
  const text = getDateFormatter(locale, {
    month: 'long',
    year: 'numeric',
    calendar: month.calendar.identifier,
    timeZone: state.timeZone,
  }).format(month.toDate(state.timeZone));
  return (
    <caption {...hooks.slot('calendar-month')} aria-hidden="true">
      {text}
    </caption>
  );
}

function CalendarHeader({ heading }: { heading: DateTimeFieldCalendarHeading }) {
  const strings = useUiStrings();
  // Previous sits at the inline start and points there; right to left that is the right edge.
  const isRtl = useLocale().direction === 'rtl';
  return (
    // The month navigation is no page banner, wherever the calendar is drawn.
    <header {...hooks.slot('calendar-header')} role="none">
      <Button
        slot="previous"
        icon={isRtl ? ChevronRightGlyph : ChevronLeftGlyph}
        label={strings.previous}
        size="sm"
        className={hooks.slotClass('calendar-nav')}
      />
      {heading === 'select' ? (
        <CalendarHeadingSelects />
      ) : (
        <Heading className={hooks.slotClass('calendar-heading')} />
      )}
      <Button
        slot="next"
        icon={isRtl ? ChevronLeftGlyph : ChevronRightGlyph}
        label={strings.next}
        size="sm"
        className={hooks.slotClass('calendar-nav')}
      />
    </header>
  );
}

/**
 * The heading (text or selects) with month navigation, and one grid per visible month, each
 * captioned with its month when several show.
 */
export function CalendarBody({ options = {}, getDateState }: CalendarBodyProps) {
  const { heading = 'text', months = 1 } = options;
  return (
    <>
      <CalendarHeader heading={heading} />
      <div {...hooks.slot('calendar-months')}>
        {Array.from({ length: months }, (_, offset) => (
          <CalendarGrid
            key={offset}
            className={hooks.slotClass('calendar-grid')}
            offset={offset > 0 ? { months: offset } : undefined}
          >
            <MonthCaption offset={offset} months={months} />
            <CalendarGridHeader className={hooks.slotClass('calendar-head')}>
              {(day) => (
                <CalendarHeaderCell className={hooks.slotClass('calendar-weekday')}>
                  {day}
                </CalendarHeaderCell>
              )}
            </CalendarGridHeader>
            <CalendarGridBody className={hooks.slotClass('calendar-body')}>
              {(date) => <DateCell date={date} state={getDateState?.(date.toString())} />}
            </CalendarGridBody>
          </CalendarGrid>
        ))}
      </div>
    </>
  );
}
