// Calendar months (`YYYY-MM`) and years (`YYYY`) as values: never a day or an instant
// (specs/PERIOD-FIELD.md).

/** What a period field's value counts in. */
export type PeriodGranularity = 'month' | 'year';

/** A period as a count: months since year 0 for a month, the year itself for a year. */
export type PeriodIndex = number;

const patterns: Record<PeriodGranularity, RegExp> = {
  month: /^(\d{4})-(0[1-9]|1[0-2])$/,
  year: /^(\d{4})$/,
};

/** The period a text names in `granularity`, or `null` for a text that names none. */
export function readPeriod(text: string, granularity: PeriodGranularity): PeriodIndex | null {
  const match = patterns[granularity].exec(text);
  if (!match) return null;
  const year = Number(match[1]);
  return granularity === 'year' ? year : year * 12 + Number(match[2]) - 1;
}

/** The canonical text of a period: `YYYY-MM` or `YYYY`. */
export function writePeriod(index: PeriodIndex, granularity: PeriodGranularity): string {
  if (granularity === 'year') return String(index).padStart(4, '0');
  const year = Math.floor(index / 12);
  const month = index - year * 12 + 1;
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
}

/** The year a period falls in. */
export function toYear(index: PeriodIndex, granularity: PeriodGranularity): number {
  return granularity === 'year' ? index : Math.floor(index / 12);
}

/**
 * The twelve periods a page of the picker shows: page `p` holds periods `12p` to `12p + 11`, so a
 * page of months is year `p` and a page of years runs from year `12p`.
 */
export function listPage(page: number): PeriodIndex[] {
  return Array.from({ length: 12 }, (_, offset) => page * 12 + offset);
}

/** The page that shows a period. */
export function toPage(index: PeriodIndex): number {
  return Math.floor(index / 12);
}

/** A period's first day at noon UTC, for formatting it in a locale without a zone moving it. */
export function toFormatDate(index: PeriodIndex, granularity: PeriodGranularity): Date {
  const year = toYear(index, granularity);
  const month = granularity === 'year' ? 0 : index - year * 12;
  const date = new Date(Date.UTC(2000, month, 1, 12));
  date.setUTCFullYear(year);
  return date;
}
