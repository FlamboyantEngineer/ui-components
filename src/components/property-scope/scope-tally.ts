'use client';

// The bookkeeping behind property filtering: each part of a property panel reports how many
// properties it holds, how many match the active query and whether one overrides an inherited
// value; each level sums the reports of the parts inside it.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { textMatchesTerms } from '../text-match/text-match.js';
import { isShallowEqual } from '../../utils/is-shallow-equal.js';

/** What a part of a property panel reports to the level that holds it. */
interface PropertyTally {
  /** Properties inside the part. */
  count: number;
  /** Properties that match the active query; all of them while no query is active. */
  matches: number;
  /** Whether a property inside overrides an inherited value. */
  isOverridden: boolean;
  /**
   * Whether the parts inside have not all reported yet, as during server rendering and before the
   * first effects run: `matches` is then a lower bound, not a confirmed count.
   */
  isPending: boolean;
}

/** Whether a row's joined texts match the query, in place of holding each of its terms. */
export type PropertyScopeFilter = (text: string, query: string) => boolean;

/** What one level of a property panel hands to the parts inside it. */
interface PropertyScopeValue {
  /** The query's normalized terms, which the default matching needs every one of. */
  terms: readonly string[];
  /**
   * Whether a query is active: one with terms, or with the caller's filter any nonblank one, even
   * one such as `/` that holds no terms.
   */
  isFiltering: boolean;
  /** The query as typed. */
  query: string;
  /** The caller's matching, when it replaces the terms'. */
  filter: PropertyScopeFilter | undefined;
  /** The texts of the enclosing section, group and card, joined by spaces. */
  path: string;
  /** Records a part's tally under its key and returns the function that removes it. */
  report: (key: symbol, tally: PropertyTally) => () => void;
}

interface PropertyScopeLevel {
  /** The enclosing level. */
  parent: PropertyScopeValue;
  /** The value the parts inside this level receive. */
  value: PropertyScopeValue;
  /** The sum of the tallies the parts inside report. */
  total: PropertyTally;
  /** Whether a query is active. */
  isFiltering: boolean;
  /** Whether a query is active and every part inside has reported that none of them matches. */
  hasNoMatch: boolean;
}

export const PropertyScopeContext = createContext<PropertyScopeValue>({
  terms: [],
  isFiltering: false,
  query: '',
  filter: undefined,
  path: '',
  report: () => () => undefined,
});

function sumTallies(tallies: Iterable<PropertyTally>): PropertyTally {
  const total: PropertyTally = { count: 0, matches: 0, isOverridden: false, isPending: false };
  for (const tally of tallies) {
    total.count += tally.count;
    total.matches += tally.matches;
    total.isOverridden ||= tally.isOverridden;
    total.isPending ||= tally.isPending;
  }
  return total;
}

/** Joins the non-blank texts of a scope path with single spaces. */
function joinScopeText(texts: ReadonlyArray<string | undefined>): string {
  return texts.filter((text): text is string => Boolean(text?.trim())).join(' ');
}

/** Whether a query is active and the tallies confirm that nothing inside matches. */
export function hasNoPropertyMatch(isFiltering: boolean, total: PropertyTally): boolean {
  return isFiltering && !total.isPending && total.matches === 0;
}

/**
 * Collects the tallies the parts inside one level report, and their sum, which stays pending until
 * the parts mounted with the level have reported: their reports run in effects before the level's.
 */
export function usePropertyTallies(): Pick<PropertyScopeValue, 'report'> & {
  total: PropertyTally;
} {
  const [tallies, setTallies] = useState<ReadonlyMap<symbol, PropertyTally>>(() => new Map());
  const [isCollected, setCollected] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- The parts report in their own effects, which run just before this one.
    setCollected(true);
  }, []);
  const report = useCallback((key: symbol, tally: PropertyTally) => {
    setTallies((previous) =>
      isShallowEqual(previous.get(key), tally) ? previous : new Map(previous).set(key, tally),
    );
    return () =>
      setTallies((previous) => {
        const next = new Map(previous);
        next.delete(key);
        return next;
      });
  }, []);
  const total = useMemo(() => {
    const sum = sumTallies(tallies.values());
    return isCollected ? sum : { ...sum, isPending: true };
  }, [tallies, isCollected]);
  return { report, total };
}

/** Reports a part's tally to its enclosing level while the part is mounted. */
export function useReportPropertyTally(scope: PropertyScopeValue, tally: PropertyTally): void {
  const [key] = useState(() => Symbol('property'));
  const { report } = scope;
  const { count, matches, isOverridden, isPending } = tally;
  useEffect(
    () => report(key, { count, matches, isOverridden, isPending }),
    [report, key, count, matches, isOverridden, isPending],
  );
}

/** One level of the scope: a section, group or card that adds `text` to the path. */
export function usePropertyScopeLevel(text: string | undefined): PropertyScopeLevel {
  const parent = useContext(PropertyScopeContext);
  const { report, total } = usePropertyTallies();
  const value = useMemo(
    () => ({ ...parent, path: joinScopeText([parent.path, text]), report }),
    [parent, text, report],
  );
  const { isFiltering } = parent;
  return { parent, value, total, isFiltering, hasNoMatch: hasNoPropertyMatch(isFiltering, total) };
}

/**
 * Whether the scope's path followed by `texts` matches the query: holds every active term, or
 * passes the caller's filter. True without a query.
 */
export function matchesPropertyScope(
  scope: PropertyScopeValue,
  texts: ReadonlyArray<string | undefined>,
): boolean {
  if (!scope.isFiltering) return true;
  const text = joinScopeText([scope.path, ...texts]);
  return scope.filter ? scope.filter(text, scope.query) : textMatchesTerms(text, scope.terms);
}
