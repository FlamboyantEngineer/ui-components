'use client';

import { getLocalTimeZone, parseIsoDate, useLocale } from '../../primitives/index.js';
import type { OpenStateProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import {
  Field,
  useFieldControl,
  type FieldInputProps,
  type FieldIssue,
  type FieldState,
} from '../field/field.js';
import { PresetCalendar } from './relative-date-calendar.js';
import { PresetSelect } from './relative-date-select.js';
import {
  describeRelativeDate,
  describeRelativeRange,
  findRelativeBoundIssue,
  formatRelativePeriod,
  formatRelativePreset,
  resolvePickedDate,
  resolveRelativePreset,
  resolveRelativeRange,
  toLocalDay,
  type RelativeDateBounds,
  type RelativeDateComputedPreset,
  type RelativeDateKind,
  type RelativeDatePreset,
  type RelativeDateRange,
  type RelativeDateValue,
} from './relative-date.js';
import { getDateFormatter } from '../../utils/intl-format.js';

/** A `YYYY-MM-DD` date or local `YYYY-MM-DDTHH:mm` date and time, or a `{ start, end }` range of dates. */
export type RelativeDateFieldValue<K extends RelativeDateKind = 'date'> = K extends 'date-range'
  ? RelativeDateRange | null
  : string | null;

export interface RelativeDateFieldProps<K extends RelativeDateKind = 'date'>
  extends FieldInputProps<RelativeDateFieldValue<K>>, OpenStateProps {
  /** What a preset commits: a `YYYY-MM-DD` date (the default), a date and time or a range of dates. */
  valueKind?: K | undefined;
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
  /** The clock presets and relative text count from. Defaults to the current time. */
  getNow?: (() => Date) | undefined;
  /** The trigger's text while there is no value. Defaults to the provider string. */
  placeholder?: string | undefined;
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
  kind: RelativeDateKind;
  locale: string;
}

const DEFAULT_PRESETS: readonly RelativeDatePreset[] = [
  { amount: 0, unit: 'day' },
  { amount: 1, unit: 'day' },
  { amount: -1, unit: 'day' },
  { amount: 1, unit: 'week' },
  { amount: -1, unit: 'week' },
];

const DEFAULT_RANGE_PRESETS: readonly RelativeDatePreset[] = [
  { amount: 0, unit: 'day' },
  { amount: -7, unit: 'day' },
  { amount: -30, unit: 'day' },
  { amount: 7, unit: 'day' },
];

const hooks = createHooks('relative-date-field', ['preview']);

const currentTime = () => new Date();

function resolvePreset(preset: AnyPreset, { now, kind }: PresetContext): RelativeDateValue {
  if ('getValue' in preset) return preset.getValue(now);
  if (kind === 'date-range') return resolveRelativeRange(preset, now);
  return resolveRelativePreset(preset, { now, kind });
}

function labelPreset(preset: AnyPreset, context: PresetContext, strings: UiStrings): string {
  if ('getValue' in preset) return preset.label;
  if (context.kind !== 'date-range' || preset.label || preset.amount === 0) {
    return formatRelativePreset(preset, context.locale);
  }
  const period = formatRelativePeriod(preset, context.locale);
  return preset.amount < 0 ? strings.lastPeriod(period) : strings.nextPeriod(period);
}

/** The value read relative to now: a date or instant, or a range of dates. */
function describeValue(value: RelativeDateValue | null, options: PresetContext & { days: number }) {
  if (!value) return null;
  const describe = { now: options.now, locale: options.locale, fallbackAfterDays: options.days };
  return typeof value === 'string'
    ? describeRelativeDate(value, describe)
    : describeRelativeRange(value, describe);
}

/** A `YYYY-MM-DD` date as a localized date; unreadable text is kept. */
function formatDay(text: string, locale: string): string {
  const date = parseIsoDate(text);
  if (!date) return text;
  return getDateFormatter(locale, { dateStyle: 'medium' }).format(date.toDate(getLocalTimeZone()));
}

/** The field's own check: a value outside the bounds is invalid, with the bound in the message. */
function useBoundCheck(bounds: RelativeDateBounds) {
  const strings = useUiStrings();
  const { locale } = useLocale();
  return (value: RelativeDateValue | null): FieldIssue | null => {
    const issue = findRelativeBoundIssue(value, bounds);
    if (!issue) return null;
    const limit = formatDay(issue.limit, locale);
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
      <time dateTime={value.start}>{formatDay(value.start, locale)}</time> –{' '}
      <time dateTime={value.end}>{formatDay(value.end, locale)}</time>
    </span>
  );
}

/**
 * The value in its form, under the field's `name`: a hidden input holding the date or date and
 * time, or a range as an ISO 8601 interval (`start/end`), empty while there is none.
 */
function FormValue({
  name,
  value,
  isDisabled,
}: {
  name: string | undefined;
  value: RelativeDateValue | null;
  isDisabled: boolean;
}) {
  if (!name) return null;
  const text =
    value === null || typeof value === 'string' ? (value ?? '') : `${value.start}/${value.end}`;
  return <input type="hidden" name={name} value={text} disabled={isDisabled} />;
}

/**
 * A field that sets a date, an instant or a range of dates from relative presets (React Aria
 * `Select`), and with `showCalendar` from a calendar beside them: the trigger reads the value
 * relative to now, such as `Tomorrow` or `3 days ago`, and a preview after it gives the absolute
 * date. Picking a preset commits the value it stands for; presets outside the bounds are disabled.
 */
export function RelativeDateField<K extends RelativeDateKind = 'date'>(
  props: RelativeDateFieldProps<K>,
) {
  const strings = useUiStrings();
  const { locale } = useLocale();
  const kind: RelativeDateKind = props.valueKind ?? 'date';
  const bounds = { minValue: props.minValue, maxValue: props.maxValue };
  const check = useBoundCheck(bounds);
  const { state, field } = useFieldControl<RelativeDateFieldValue<K>, RelativeDateFieldProps<K>>(
    props,
    { initialValue: null as RelativeDateFieldValue<K>, emptyValue: null, check },
  );
  const getNow = props.getNow ?? currentTime;
  const presets = (props.presets ??
    (kind === 'date-range' ? DEFAULT_RANGE_PRESETS : DEFAULT_PRESETS)) as readonly AnyPreset[];
  const context: PresetContext = { now: getNow(), kind, locale };
  const value = (state.value ?? null) as RelativeDateValue | null;
  const text = describeValue(value, { ...context, days: props.fallbackAfterDays ?? 7 });
  const items = presets.map((preset, index) => ({
    id: String(index),
    label: labelPreset(preset, context, strings),
    isDisabled: findRelativeBoundIssue(resolvePreset(preset, context), bounds) !== null,
  }));
  const commit = (next: RelativeDateValue) => {
    state.setValue(next as RelativeDateFieldValue<K>);
    state.commit();
  };
  const pickDate = (picked: string | RelativeDateRange) => {
    const now = getNow();
    if (typeof picked !== 'string') commit(picked);
    else commit(resolvePickedDate(picked, { now, kind: kind === 'date-time' ? kind : 'date' }));
  };
  const data = { valueKind: kind, relation: text?.relation };
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
            state={state as FieldState<unknown>}
            items={items}
            text={text}
            placeholder={props.placeholder ?? strings.selectPlaceholder}
            onPick={(id) => {
              const preset = presets[Number(id)];
              if (preset) commit(resolvePreset(preset, { ...context, now: getNow() }));
            }}
            aside={
              props.showCalendar ? (
                <PresetCalendar
                  kind={kind}
                  value={value}
                  bounds={bounds}
                  today={toLocalDay(context.now)}
                  onPick={pickDate}
                />
              ) : null
            }
          />
          {text && value ? <Preview value={value} absolute={text.absolute} /> : null}
          <FormValue name={props.name} value={value} isDisabled={state.isDisabled} />
        </>
      )}
    </Field>
  );
}

export type {
  RelativeDateComputedPreset,
  RelativeDateKind,
  RelativeDatePreset,
  RelativeDateRange,
  RelativeDateUnit,
} from './relative-date.js';
