'use client';

import { useLocale } from '../../primitives/index.js';
import { useGetNow, useIsClockReadable, useTimeZone } from '../../core/clock.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import {
  capitalizeText,
  describeRelativeTime,
  formatStableTime,
  type RelativeTimePrecision,
  type RelativeTimeStyle,
  type RelativeTimeUnitStyle,
} from '../../utils/relative-time.js';
import { useClockTick } from '../../core/clock-tick.js';
import { TimeWithTooltip } from './relative-time-tooltip.js';

export type {
  RelativeTimePrecision,
  RelativeTimeStyle,
  RelativeTimeUnitStyle,
} from '../../utils/relative-time.js';

export interface RelativeTimeProps extends BaseProps {
  /** An ISO 8601 date (`YYYY-MM-DD`) or date and time, local or with an offset. */
  value: string | null | undefined;
  /** Values this many calendar days away or more read as the absolute date. Defaults to 7. */
  fallbackAfterDays?: number | undefined;
  /**
   * How finely an instant within a minute reads: `minute` shows `Now`, then `1 minute ago`;
   * `second` counts live seconds (`5 seconds ago`). Defaults to `minute`.
   */
  precision?: RelativeTimePrecision | undefined;
  /** How the words spell their units: `long` (`5 minutes ago`), `short` or `narrow`. Defaults to `long`. */
  unitStyle?: RelativeTimeUnitStyle | undefined;
  /** The absolute date's style. Defaults to `medium`. */
  dateStyle?: RelativeTimeStyle | undefined;
  /** The absolute time's style, for a date and time. Defaults to `short`. */
  timeStyle?: RelativeTimeStyle | undefined;
  /** The clock the value is read against. Defaults to the provider's, else the current time. */
  getNow?: (() => Date) | undefined;
  /** The IANA time zone days and times are read in. Defaults to the provider's, else the device's. */
  timeZone?: string | undefined;
  /** Shows the absolute date in a tooltip on hover and keyboard focus. Defaults to true. */
  showTooltip?: boolean | undefined;
  /** Upper-cases the first letter, as at the start of a label. Defaults to true. */
  capitalize?: boolean | undefined;
  /** The text shown when the value is missing or unreadable. Without it nothing renders. */
  placeholder?: string | undefined;
}

const hooks = createHooks('relative-time', ['tooltip']);

/** The placeholder of a missing or unreadable value, or nothing without one. */
function EmptyTime({
  placeholder,
  capitalize,
  className,
  ...rest
}: Pick<RelativeTimeProps, 'placeholder' | 'className'> & { capitalize: boolean }) {
  const { locale } = useLocale();
  if (!placeholder) return null;
  return (
    <span {...rest} {...hooks.root({ className, data: { empty: true } })}>
      {capitalize ? capitalizeText(placeholder, locale) : placeholder}
    </span>
  );
}

/** The live timestamp: the words against `getNow()`, kept current on the shared clock. */
function LiveTime({
  value,
  fallbackAfterDays = 7,
  precision,
  unitStyle,
  dateStyle,
  timeStyle,
  getNow,
  timeZone,
  showTooltip = true,
  capitalize = true,
  placeholder,
  className,
  ...rest
}: RelativeTimeProps) {
  const { locale } = useLocale();
  const now = useGetNow(getNow)();
  const zone = useTimeZone(timeZone);
  const time = { precision, unitStyle, dateStyle, timeStyle, timeZone: zone };
  const options = { ...time, now, locale, fallbackAfterDays };
  const text = value ? describeRelativeTime(value, options) : null;
  useClockTick(text?.nextChange ?? null, now.getTime());
  if (!text || !value) {
    const empty = { ...rest, placeholder, capitalize, className };
    return <EmptyTime {...empty} />;
  }
  const data = { relation: text.relation, format: text.isRelative ? 'relative' : 'absolute' };
  const timeProps = { ...rest, ...hooks.root({ className, data }), dateTime: value };
  const words =
    text.isRelative && capitalize ? capitalizeText(text.relative, locale) : text.relative;
  // A timestamp already read as the absolute date has nothing to add in a tooltip.
  if (!showTooltip || !text.isRelative) return <time {...timeProps}>{words}</time>;
  return (
    <TimeWithTooltip
      {...timeProps}
      tooltip={text.absolute}
      tooltipClassName={hooks.slotClass('tooltip')}
    >
      {words}
    </TimeWithTooltip>
  );
}

/** The timestamp before the clock may be read: the stable absolute text, without a tooltip. */
function StableTime({
  value,
  dateStyle,
  timeStyle,
  capitalize = true,
  placeholder,
  className,
  ...props
}: RelativeTimeProps) {
  const { locale } = useLocale();
  const { fallbackAfterDays, precision, unitStyle, getNow, timeZone, showTooltip, ...rest } = props;
  const text = value ? formatStableTime(value, locale, { dateStyle, timeStyle }) : null;
  if (!text || !value) {
    const empty = { ...rest, placeholder, capitalize, className };
    return <EmptyTime {...empty} />;
  }
  const data = { format: 'absolute' };
  return (
    <time {...rest} {...hooks.root({ className, data })} dateTime={value}>
      {text}
    </time>
  );
}

/**
 * A timestamp read relative to now (`Now`, `5 minutes ago`, `Yesterday`) in a `<time>` element, which
 * updates on one clock shared by every timestamp on the page and shows the absolute date in a
 * tooltip. Past `fallbackAfterDays` it reads as the absolute date. The server and hydration render
 * the stable absolute text instead, then the live words.
 */
export function RelativeTime(props: RelativeTimeProps) {
  return useIsClockReadable() ? <LiveTime {...props} /> : <StableTime {...props} />;
}
