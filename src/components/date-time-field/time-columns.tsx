'use client';

import { useId, useMemo, useRef } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { ListBox, ListBoxItem, useLocale } from '../../primitives/index.js';
import { getDateTimeFormat, getNumberFormat } from '../../utils/intl-format.js';
import { useWheelSteps } from '../../utils/use-wheel-steps.js';
import { dateTimeFieldHooks as hooks } from './date-time-field-hooks.js';
import type { DateTimeFieldGranularity } from './date-values.js';
import {
  buildTimeColumns,
  type DayBounds,
  pickTimePart,
  stepTimeOption,
  type TimeColumn,
  type TimeColumnUnit,
  type TimeParts,
  wholeDay,
} from './time-columns-model.js';

interface TimeColumnsProps {
  /** Names the group of columns. */
  label: string;
  /** The time the columns show chosen, or `null` for none. */
  value: TimeParts | null;
  /** Called with the time a pick or a wheel step makes. */
  onChange: (value: TimeParts) => void;
  granularity: DateTimeFieldGranularity;
  /** The field's hour cycle, else the locale's. */
  hourCycle: 12 | 24 | undefined;
  /** The seconds of the day the time may take. */
  bounds?: DayBounds | undefined;
}

/** The field's hour cycle, else the one the locale writes. */
function useHourCycle(hourCycle: 12 | 24 | undefined): 12 | 24 {
  const { locale } = useLocale();
  if (hourCycle) return hourCycle;
  const cycle = getDateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions().hourCycle;
  return cycle === 'h11' || cycle === 'h12' ? 12 : 24;
}

/** The locale's names of the two day periods, such as `AM` and `PM`. */
function useDayPeriodNames(): readonly [string, string] {
  const { locale } = useLocale();
  return useMemo(() => {
    const format = new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      hourCycle: 'h12',
      timeZone: 'UTC',
    });
    const name = (hour: number) =>
      format.formatToParts(Date.UTC(2000, 0, 1, hour)).find((part) => part.type === 'dayPeriod')
        ?.value ?? (hour < 12 ? 'AM' : 'PM');
    return [name(9), name(21)] as const;
  }, [locale]);
}

/** How each column writes its options: two-digit numbers, a 12 hour clock's hours, period names. */
function useOptionText(hourCycle: 12 | 24) {
  const { locale } = useLocale();
  const periods = useDayPeriodNames();
  const twoDigits = getNumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false });
  const plain = getNumberFormat(locale, { useGrouping: false });
  return (unit: TimeColumnUnit, id: number) => {
    if (unit === 'dayPeriod') return id === 0 ? periods[0] : periods[1];
    if (unit === 'hour' && hourCycle === 12) return plain.format(id === 0 ? 12 : id);
    return twoDigits.format(id);
  };
}

/** Scrolls an option's column so the option sits in the middle of it, as the option mounts. */
function centerInColumn(chosen: HTMLElement | null) {
  const list = chosen?.closest<HTMLElement>('[role="listbox"]');
  if (!chosen || !list) return;
  const frame = list.getBoundingClientRect();
  const box = chosen.getBoundingClientRect();
  list.scrollTop += box.top - frame.top - (frame.height - box.height) / 2;
}

interface TimeColumnListProps {
  column: TimeColumn;
  label: string;
  text: (unit: TimeColumnUnit, id: number) => string;
  onPick: (id: number) => void;
}

/**
 * One column as a listbox: a press or Enter picks an option, and the wheel over the column steps
 * to the next enabled option (rolled down) or the previous one (rolled up), wrapping around,
 * without scrolling the page.
 */
function TimeColumnList({ column, label, text, onPick }: TimeColumnListProps) {
  const ref = useRef<HTMLDivElement>(null);
  useWheelSteps(ref, (direction) => {
    const id = stepTimeOption(column, direction === 1 ? -1 : 1);
    if (id !== null && id !== column.selected) onPick(id);
  });
  return (
    <ListBox
      ref={ref}
      {...hooks.slot('time-column', { unit: column.unit })}
      aria-label={label}
      items={column.options}
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={column.selected === null ? [] : [column.selected]}
      disabledKeys={column.options.filter((entry) => entry.isDisabled).map((entry) => entry.id)}
      onSelectionChange={(keys) => {
        const [key] = keys === 'all' ? [] : [...keys];
        if (typeof key === 'number') onPick(key);
      }}
    >
      {(entry) => (
        <ListBoxItem
          id={entry.id}
          // The chosen option centres its column when it mounts or becomes the chosen one.
          ref={entry.id === column.selected ? centerInColumn : undefined}
          className={hooks.slotClass('time-option')}
          textValue={text(column.unit, entry.id)}
        >
          {text(column.unit, entry.id)}
        </ListBoxItem>
      )}
    </ListBox>
  );
}

/**
 * A time of day picked with the pointer and the wheel: a column of hours, of minutes and of seconds
 * down to the granularity, and of day periods in a 12 hour cycle (UIC-DATE-TIME-FIELD-4.6).
 */
export function TimeColumns({
  label,
  value,
  onChange,
  granularity,
  hourCycle: fieldHourCycle,
  bounds = wholeDay,
}: TimeColumnsProps) {
  const strings = useUiStrings();
  const labelId = useId();
  const hourCycle = useHourCycle(fieldHourCycle);
  const text = useOptionText(hourCycle);
  const settings = { granularity, hourCycle, bounds };
  const names: Record<TimeColumnUnit, string> = {
    hour: strings.hoursColumn,
    minute: strings.minutesColumn,
    second: strings.secondsColumn,
    dayPeriod: strings.dayPeriodColumn,
  };
  return (
    <div {...hooks.slot('time-columns')} role="group" aria-labelledby={labelId}>
      <span {...hooks.slot('time-label')} id={labelId}>
        {label}
      </span>
      {buildTimeColumns(value, settings).map((column) => (
        <TimeColumnList
          key={column.unit}
          column={column}
          label={names[column.unit]}
          text={text}
          onPick={(id) => onChange(pickTimePart(value, { unit: column.unit, id }, settings))}
        />
      ))}
    </div>
  );
}
