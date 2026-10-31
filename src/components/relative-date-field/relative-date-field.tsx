'use client';

import { useLocale } from '../../primitives/index.js';
import { useGetNow, useNow, useTimeZone } from '../../core/clock.js';
import { useClockTick } from '../../core/clock-tick.js';
import { untilMidnight } from '../../utils/relative-time.js';
import type { OpenStateProps } from '../../core/events.js';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import {
  DateFormInputs,
  toEndpointErrorSources,
  type DateRangeValue,
} from '../date-time-field/date-time-field.js';
import {
  Field,
  useFieldControl,
  type FieldInputProps,
  type FieldIssue,
  type FieldState,
  type FieldTextInputProps,
} from '../field/field.js';
import { PresetCalendar } from './relative-date-calendar.js';
import { PresetSelect } from './relative-date-select.js';
import {
  describeRelativeDate,
  describeRelativeRange,
  findRelativeBoundIssue,
  isReadableRelativeValue,
  formatDay,
  formatDayRange,
  formatRelativePeriod,
  formatRelativePreset,
  resolvePickedDate,
  resolveRelativePreset,
  resolveRelativeRange,
  toZonedDay,
  type RelativeDateBounds,
  type RelativeDateComputedPreset,
  type RelativeDateFieldMode,
  type RelativeDatePreset,
  type RelativeDateText,
  type RelativeDateValue,
} from './relative-date.js';
import { formatStableTime } from '../../utils/relative-time.js';
import { relativeDateFieldHooks as hooks } from './relative-date-field-hooks.js';

/** A `YYYY-MM-DD` date or local `YYYY-MM-DDTHH:mm` date and time, or a `{ start, end }` range of dates. */
export type RelativeDateFieldValue<K extends RelativeDateFieldMode = 'date'> =
  K extends 'date-range' ? DateRangeValue | null : string | null;

export interface RelativeDateFieldProps<K extends RelativeDateFieldMode = 'date'>
  extends
    FieldInputProps<RelativeDateFieldValue<K>>,
    OpenStateProps,
    /** `placeholder` is the trigger's text while there is no value; it defaults to the provider string. */
    Pick<FieldTextInputProps, 'placeholder'> {
  /**
   * What a preset commits, named as in `DateTimeField`: a `YYYY-MM-DD` date (the default), a date
   * and time or a range of dates.
   */
  mode?: K | undefined;
  /** The form names of a range's start and end, as in `DateTimeField`; `name` is a single value's. */
  startName?: string | undefined;
  endName?: string | undefined;
  /**
   * The choices, in order: counts of units from now, with optional labels, or named values computed
   * from now. Defaults to today, tomorrow, yesterday, next week and last week (for a range: today,
   * the last 7 and 30 days and the next 7 days).
   */
  presets?:
    | readonly (
        | RelativeDatePreset
        | RelativeDateComputedPreset<NonNullable<RelativeDateFieldValue<K>>>
      )[]
    | undefined;
  /** The clock presets and relative text count from. Defaults to the provider's, else the current time. */
  getNow?: (() => Date) | undefined;
  /**
   * The IANA time zone days are read in, such as `Europe/Paris`, as in `DateTimeField`. Defaults to
   * the provider's, else the browser's.
   */
  timeZone?: string | undefined;
  /** Values this many days away or more read as absolute dates. Defaults to 7. */
  fallbackAfterDays?: number | undefined;
  /** The earliest `YYYY-MM-DD` date a value may fall on; presets before it are disabled. */
  minValue?: string | undefined;
  /** The latest `YYYY-MM-DD` date a value may fall on; presets after it are disabled. */
  maxValue?: string | undefined;
  /** Draws a calendar beside the presets, to pick any date (or range of dates). */
  showCalendar?: boolean | undefined;
}

type AnyPreset = RelativeDatePreset | RelativeDateComputedPreset<RelativeDateValue>;

interface PresetContext {
  now: Date;
  timeZone: string;
  kind: RelativeDateFieldMode;
  locale: string;
}

const defaultPresets: readonly RelativeDatePreset[] = [
  { amount: 0, unit: 'day' },
  { amount: 1, unit: 'day' },
  { amount: -1, unit: 'day' },
  { amount: 1, unit: 'week' },
  { amount: -1, unit: 'week' },
];

const defaultRangePresets: readonly RelativeDatePreset[] = [
  { amount: 0, unit: 'day' },
  { amount: -7, unit: 'day' },
  { amount: -30, unit: 'day' },
  { amount: 7, unit: 'day' },
];

function resolvePreset(preset: AnyPreset, context: PresetContext): RelativeDateValue {
  const { now, timeZone, kind } = context;
  if ('getValue' in preset) return preset.getValue(now);
  if (kind === 'date-range') return resolveRelativeRange(preset, { now, timeZone });
  return resolveRelativePreset(preset, { now, timeZone, kind });
}

function labelPreset(
  preset: AnyPreset,
  context: Pick<PresetContext, 'kind' | 'locale'>,
  strings: UiStrings,
): string {
  if ('getValue' in preset) return preset.label;
  if (context.kind !== 'date-range' || preset.label || preset.amount === 0) {
    return formatRelativePreset(preset, context.locale);
  }
  const period = formatRelativePeriod(preset, context.locale);
  return preset.amount < 0 ? strings.lastPeriod(period) : strings.nextPeriod(period);
}

interface DescribeOptions {
  now: Date | null;
  timeZone: string;
  locale: string;
  fallbackAfterDays: number;
}

/**
 * The value read relative to now: a date or instant, or a range of dates. Before the clock may be
 * read it is the absolute text alone, the same on a server and in the client hydrating it.
 */
function describeValue(
  value: RelativeDateValue | null,
  { now, ...options }: DescribeOptions,
): RelativeDateText | null {
  if (!value) return null;
  if (now) {
    const describe = { ...options, now };
    return typeof value === 'string'
      ? describeRelativeDate(value, describe)
      : describeRelativeRange(value, describe);
  }
  const absolute =
    typeof value === 'string'
      ? formatStableTime(value, options.locale)
      : formatDayRange(value, options.locale);
  return absolute === null
    ? null
    : { relative: absolute, absolute, relation: undefined, nextChange: null };
}

/** Bounds read in the field's resolved zone. */
type ZonedBounds = RelativeDateBounds & { timeZone: string };

/** Whether the field takes a value: one its mode can read, inside the bounds. */
function isPickableValue(
  value: RelativeDateValue,
  kind: RelativeDateFieldMode,
  bounds: ZonedBounds,
) {
  return isReadableRelativeValue(value, kind) && !findRelativeBoundIssue(value, bounds);
}

/**
 * The field's own check: a value the mode cannot read, or outside the bounds, is invalid, with the
 * reason or the bound in the message.
 */
function useValueCheck(kind: RelativeDateFieldMode, bounds: ZonedBounds) {
  const strings = useUiStrings();
  const { locale } = useLocale();
  return (value: RelativeDateValue | null): FieldIssue | null => {
    if (value !== null && !isReadableRelativeValue(value, kind)) {
      return { severity: 'error', message: strings.dateUnreadable };
    }
    const issue = findRelativeBoundIssue(value, bounds);
    if (!issue) return null;
    const limit = formatDay(issue.limit, locale) ?? issue.limit;
    const message =
      issue.bound === 'min' ? strings.dateTooEarly(limit) : strings.dateTooLate(limit);
    return { severity: 'error', message };
  };
}

/**
 * The absolute value after the trigger: a `<time>` element, or for a range a `<span>` holding a
 * `<time>` element per end.
 */
function Preview({ value, absolute }: { value: RelativeDateValue; absolute: string }) {
  const { locale } = useLocale();
  if (typeof value === 'string') {
    return (
      <time {...hooks.slot('preview')} dateTime={value}>
        {absolute}
      </time>
    );
  }
  return (
    <span {...hooks.slot('preview')}>
      <time dateTime={value.start}>{formatDay(value.start, locale) ?? value.start}</time> –{' '}
      <time dateTime={value.end}>{formatDay(value.end, locale) ?? value.end}</time>
    </span>
  );
}

/**
 * Commits a picked value: a preset's, or a calendar day or range read in the field's zone. The value
 * is resolved once, when picked, and a value the mode cannot read or the bounds refuse then is not
 * committed, even when its preset was enabled while the list was open.
 */
function usePick<K extends RelativeDateFieldMode>(
  state: FieldState<RelativeDateFieldValue<K>>,
  {
    kind,
    getNow,
    bounds,
  }: { kind: RelativeDateFieldMode; getNow: () => Date; bounds: ZonedBounds },
) {
  const { timeZone } = bounds;
  const commit = (next: RelativeDateValue) => {
    if (!isPickableValue(next, kind, bounds)) return;
    state.setValue(next as RelativeDateFieldValue<K>);
    state.commit();
  };
  const pickDate = (picked: string | DateRangeValue) => {
    if (typeof picked !== 'string') commit(picked);
    else {
      const pickedKind = kind === 'date-time' ? kind : 'date';
      commit(resolvePickedDate(picked, { now: getNow(), timeZone, kind: pickedKind }));
    }
  };
  return { commit, pickDate };
}

/**
 * A field that sets a date, an instant or a range of dates from relative presets (React Aria
 * `Select`), and with `showCalendar` from a calendar beside them: the trigger reads the value
 * relative to now, such as `Tomorrow` or `3 days ago`, and a preview after it gives the absolute
 * date. Picking a preset commits the value it stands for; presets outside the bounds are disabled.
 */
export function RelativeDateField<K extends RelativeDateFieldMode = 'date'>(
  props: RelativeDateFieldProps<K>,
) {
  const strings = useUiStrings();
  const { locale } = useLocale();
  const kind: RelativeDateFieldMode = props.mode ?? 'date';
  const timeZone = useTimeZone(props.timeZone);
  const bounds = { minValue: props.minValue, maxValue: props.maxValue, timeZone };
  const check = useValueCheck(kind, bounds);
  const { state, field } = useFieldControl<RelativeDateFieldValue<K>, RelativeDateFieldProps<K>>(
    props,
    {
      initialValue: null as RelativeDateFieldValue<K>,
      emptyValue: null,
      check,
      errorSources: toEndpointErrorSources(props),
    },
  );
  const getNow = useGetNow(props.getNow);
  const now = useNow(props.getNow);
  const presets = (props.presets ??
    (kind === 'date-range' ? defaultRangePresets : defaultPresets)) as readonly AnyPreset[];
  // Presets resolve against the clock read when one is picked; before then they are all enabled.
  const context = (at: Date): PresetContext => ({ now: at, timeZone, kind, locale });
  const value = (state.value ?? null) as RelativeDateValue | null;
  const fallbackAfterDays = props.fallbackAfterDays ?? 7;
  const text = describeValue(value, { now, timeZone, locale, fallbackAfterDays });
  const items = presets.map((preset, index) => ({
    id: String(index),
    label: labelPreset(preset, { kind, locale }, strings),
    isDisabled: now !== null && !isPickableValue(resolvePreset(preset, context(now)), kind, bounds),
  }));
  const { commit, pickDate } = usePick(state, { kind, getNow, bounds });
  // The text, the relation and the presets' bounds move on with the clock: wake when the text may
  // change, and at the next midnight in the field's zone.
  useClockTick(
    now ? Math.min(text?.nextChange ?? Infinity, untilMidnight(now, timeZone)) : null,
    now?.getTime() ?? 0,
  );
  const data = { mode: kind, relation: text?.relation };
  return (
    <Field
      {...field}
      {...hooks.root({ className: field.className, props: field, data })}
      state={state}
    >
      {(control) => (
        <>
          <PresetSelect
            isOpen={props.isOpen}
            defaultOpen={props.defaultOpen}
            onOpenChange={props.onOpenChange}
            control={control}
            state={state}
            items={items}
            text={text}
            placeholder={props.placeholder ?? strings.selectPlaceholder}
            onPick={(id) => {
              const preset = presets[Number(id)];
              if (preset) commit(resolvePreset(preset, context(getNow())));
            }}
            aside={
              props.showCalendar ? (
                <PresetCalendar
                  kind={kind}
                  value={value}
                  bounds={bounds}
                  today={now ? toZonedDay(now, timeZone) : undefined}
                  onPick={pickDate}
                />
              ) : null
            }
          />
          {text && value ? <Preview value={value} absolute={text.absolute} /> : null}
          <DateFormInputs value={value} names={props} isDisabled={state.isDisabled} />
        </>
      )}
    </Field>
  );
}

export type {
  RelativeDateComputedPreset,
  RelativeDateFieldMode,
  RelativeDatePreset,
  RelativeDateUnit,
} from './relative-date.js';
