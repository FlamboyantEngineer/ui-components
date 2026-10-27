import { useLocale } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import {
  capitalizeText,
  describeRelativeTime,
  type RelativeTimePrecision,
  type RelativeTimeStyle,
  type RelativeTimeUnitStyle,
} from '../../utils/relative-time.js';
import { useClockTick } from './relative-time-clock.js';
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
  /** The clock the value is read against. Defaults to the current time. */
  getNow?: (() => Date) | undefined;
  /** Shows the absolute date in a tooltip on hover and keyboard focus. Defaults to true. */
  showTooltip?: boolean | undefined;
  /** Upper-cases the first letter, as at the start of a label. Defaults to true. */
  capitalize?: boolean | undefined;
  /** The text shown when the value is missing or unreadable. Without it nothing renders. */
  placeholder?: string | undefined;
}

const hooks = createHooks('relative-time', ['tooltip']);

const currentTime = () => new Date();

/**
 * A timestamp read relative to now (`Now`, `5 minutes ago`, `Yesterday`) in a `<time>` element, which
 * updates on one clock shared by every timestamp on the page and shows the absolute date in a
 * tooltip. Past `fallbackAfterDays` it reads as the absolute date.
 */
export function RelativeTime({
  value,
  fallbackAfterDays = 7,
  precision,
  unitStyle,
  dateStyle,
  timeStyle,
  getNow = currentTime,
  showTooltip = true,
  capitalize = true,
  placeholder,
  className,
  ...rest
}: RelativeTimeProps) {
  const { locale } = useLocale();
  const options = {
    now: getNow(),
    locale,
    fallbackAfterDays,
    precision,
    unitStyle,
    dateStyle,
    timeStyle,
  };
  const text = value ? describeRelativeTime(value, options) : null;
  useClockTick(text?.nextChange ?? null);
  const finish = (words: string) => (capitalize ? capitalizeText(words, locale) : words);
  if (!text || !value) {
    if (!placeholder) return null;
    return (
      <span {...rest} {...hooks.root({ className, data: { empty: true } })}>
        {finish(placeholder)}
      </span>
    );
  }
  const data = { relation: text.relation, format: text.isRelative ? 'relative' : 'absolute' };
  const timeProps = { ...rest, ...hooks.root({ className, data }), dateTime: value };
  const words = text.isRelative ? finish(text.relative) : text.relative;
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
