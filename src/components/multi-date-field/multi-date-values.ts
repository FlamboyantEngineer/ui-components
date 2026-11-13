// A multi-date field's value model: a set of `YYYY-MM-DD` calendar dates, written in one order, and
// the reason a set is refused.

import { parseIsoDate } from '../../primitives/index.js';
import { type BoundIssue, findOrderedBoundIssue } from '../../utils/date-bounds.js';

/** What a set of dates may hold. */
export interface MultiDateRules {
  minValue?: string | undefined;
  maxValue?: string | undefined;
  /** Refuses a `YYYY-MM-DD` date. */
  isDateUnavailable?: ((date: string) => boolean) | undefined;
  /** The most dates the set may hold. */
  maxValues?: number | undefined;
}

/** Why a set of dates is refused. */
export type MultiDateIssue =
  | { kind: 'unreadable' }
  | ({ kind: 'bound' } & BoundIssue)
  | { kind: 'unavailable' }
  | { kind: 'too-many'; maxValues: number };

function isReadableDate(text: string): boolean {
  return parseIsoDate(text) !== null;
}

/**
 * The set as the field writes it: each date once, earliest first. Dates are calendar days, so the
 * text alone orders them, whatever the time zone or a daylight saving change.
 */
export function normalizeDates(dates: readonly string[]): string[] {
  return [...new Set(dates)].sort();
}

/**
 * The readable dates of a set as the field writes it: what its tags show, its form submits and a
 * change starts from, so a text that is no date is reported (`findDatesIssue`) but never kept.
 */
export function toReadableDates(dates: readonly string[]): string[] {
  return normalizeDates(dates).filter(isReadableDate);
}

/**
 * The first reason the set is refused: a text that is no `YYYY-MM-DD` date, a date outside the
 * bounds, an unavailable date, or more dates than `maxValues`.
 */
export function findDatesIssue(
  dates: readonly string[],
  { minValue, maxValue, isDateUnavailable, maxValues }: MultiDateRules,
): MultiDateIssue | null {
  if (!dates.every(isReadableDate)) return { kind: 'unreadable' };
  // Dates of one format compare as text.
  const compare = (left: string, right: string) => (left < right ? -1 : left > right ? 1 : 0);
  for (const date of dates) {
    const bound = findOrderedBoundIssue(date, compare, { minValue, maxValue });
    if (bound) return { kind: 'bound', ...bound };
  }
  if (isDateUnavailable && dates.some(isDateUnavailable)) return { kind: 'unavailable' };
  if (maxValues !== undefined && normalizeDates(dates).length > maxValues) {
    return { kind: 'too-many', maxValues };
  }
  return null;
}
