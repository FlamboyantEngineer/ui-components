// Week numbers for a calendar's rows: which week of its year a row of seven days is, by the
// ISO 8601 rule or by the locale's.

/** A day of the week, as the first day of a calendar's weeks. */
export type DateTimeFieldWeekday = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

/**
 * How a calendar numbers its weeks: `iso` by ISO 8601 (week 1 is the first with four days in the
 * new year, and weeks start on Monday unless `firstDayOfWeek` says otherwise), `locale` by the
 * locale's own first-week rule.
 */
export type DateTimeFieldWeekNumbers = 'iso' | 'locale';

const dayLength = 24 * 60 * 60 * 1000;

// The regions whose first week is the first with four days in the new year (CLDR `minDays` 4), for
// runtimes without `Intl.Locale` week data; every other region counts the week holding 1 January.
const fourDayRegions = new Set(
  (
    'AD AN AT AX BE BG CH CZ DE DK EE ES FI FJ FO FR GB GF GG GI GP GR HU IE IM IS IT JE LI LT LU ' +
    'MC MQ NL NO PL PT RE RU SE SJ SK SM VA'
  ).split(' '),
);

interface LocaleWeekInfo {
  minimalDays?: number;
}

/** `Intl.Locale` week data, which runtimes expose as a method or, earlier, as a property. */
interface LocaleWithWeekInfo extends Intl.Locale {
  getWeekInfo?: () => LocaleWeekInfo;
  weekInfo?: LocaleWeekInfo;
}

/**
 * How many days of the new year a week needs to be its week 1: 4 for ISO 8601, else the locale's
 * rule (1 where the week holding 1 January is week 1).
 */
export function getMinimalWeekDays(rule: DateTimeFieldWeekNumbers, locale: string): number {
  if (rule === 'iso') return 4;
  const tag = new Intl.Locale(locale) as LocaleWithWeekInfo;
  const info = tag.getWeekInfo?.() ?? tag.weekInfo;
  if (info?.minimalDays) return info.minimalDays;
  return fourDayRegions.has(tag.maximize().region ?? '') ? 4 : 1;
}

function toUtcDay(isoDate: string): number {
  return Date.parse(`${isoDate}T00:00:00Z`);
}

/**
 * The number of the week that starts on `rowStart` (a `YYYY-MM-DD` Gregorian date): weeks start on
 * that date's weekday, and week 1 of a year is the first holding at least `minimalDays` of its days.
 * A week that spans two years belongs to the year holding enough of its days, so 28 December 2026
 * starts ISO week 53 and 29 December 2025 starts ISO week 1 of 2026.
 */
export function getWeekNumber(rowStart: string, minimalDays: number): number {
  const start = toUtcDay(rowStart);
  const year = new Date(start + (7 - minimalDays) * dayLength).getUTCFullYear();
  // Date.UTC reads years 0 to 99 as 1900 to 1999.
  const january = new Date(0).setUTCFullYear(year, 0, 1);
  const lead = (new Date(january).getUTCDay() - new Date(start).getUTCDay() + 7) % 7;
  const firstWeek = january - lead * dayLength + (7 - lead < minimalDays ? 7 * dayLength : 0);
  return Math.round((start - firstWeek) / dayLength / 7) + 1;
}
