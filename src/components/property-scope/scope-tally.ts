// The bookkeeping behind property filtering: each part of a property panel reports how many
// properties it holds, how many match the active query and whether one overrides an inherited
// value; each level sums the reports of the parts inside it.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { textMatchesTerms } from '../text-match/text-match.js';

/** What a part of a property panel reports to the level that holds it. */
export interface PropertyTally {
  /** Properties inside the part. */
  count: number;
  /** Properties that match the active query; all of them while no query is active. */
  matches: number;
  /** Whether a property inside overrides an inherited value. */
  isOverridden: boolean;
}

/** What one level of a property panel hands to the parts inside it. */
export interface PropertyScopeValue {
  /** The active query's normalized terms; empty while nothing filters. */
  terms: readonly string[];
  /** The texts of the enclosing section, group and card, joined by spaces. */
  path: string;
  /** Records a part's tally under its key and returns the function that removes it. */
  report: (key: symbol, tally: PropertyTally) => () => void;
}

export interface PropertyScopeLevel {
  /** The enclosing level. */
  parent: PropertyScopeValue;
  /** The value the parts inside this level receive. */
  value: PropertyScopeValue;
  /** The sum of the tallies the parts inside report. */
  total: PropertyTally;
  /** Whether a query is active. */
  isFiltering: boolean;
}

export const PropertyScopeContext = createContext<PropertyScopeValue>({
  terms: [],
  path: '',
  report: () => () => undefined,
});

function isSameTally(left: PropertyTally | undefined, right: PropertyTally): boolean {
  return (
    left !== undefined &&
    left.count === right.count &&
    left.matches === right.matches &&
    left.isOverridden === right.isOverridden
  );
}

function sumTallies(tallies: Iterable<PropertyTally>): PropertyTally {
  const total: PropertyTally = { count: 0, matches: 0, isOverridden: false };
  for (const tally of tallies) {
    total.count += tally.count;
    total.matches += tally.matches;
    total.isOverridden ||= tally.isOverridden;
  }
  return total;
}

/** Joins the non-blank texts of a scope path with single spaces. */
function joinScopeText(texts: ReadonlyArray<string | undefined>): string {
  return texts.filter((text): text is string => Boolean(text?.trim())).join(' ');
}

/** Collects the tallies the parts inside one level report, and their sum. */
export function usePropertyTallies(): Pick<PropertyScopeValue, 'report'> & {
  total: PropertyTally;
} {
  const [tallies, setTallies] = useState<ReadonlyMap<symbol, PropertyTally>>(() => new Map());
  const report = useCallback((key: symbol, tally: PropertyTally) => {
    setTallies((previous) =>
      isSameTally(previous.get(key), tally) ? previous : new Map(previous).set(key, tally),
    );
    return () =>
      setTallies((previous) => {
        const next = new Map(previous);
        next.delete(key);
        return next;
      });
  }, []);
  const total = useMemo(() => sumTallies(tallies.values()), [tallies]);
  return { report, total };
}

/** Reports a part's tally to its enclosing level while the part is mounted. */
export function useReportPropertyTally(scope: PropertyScopeValue, tally: PropertyTally): void {
  const [key] = useState(() => Symbol('property'));
  const { report } = scope;
  const { count, matches, isOverridden } = tally;
  useEffect(
    () => report(key, { count, matches, isOverridden }),
    [report, key, count, matches, isOverridden],
  );
}

/** One level of the scope: a section, group or card that adds `text` to the path. */
export function usePropertyScopeLevel(text: string | undefined): PropertyScopeLevel {
  const parent = useContext(PropertyScopeContext);
  const { report, total } = usePropertyTallies();
  const { terms, path } = parent;
  const value = useMemo(
    () => ({ terms, path: joinScopeText([path, text]), report }),
    [terms, path, text, report],
  );
  return { parent, value, total, isFiltering: terms.length > 0 };
}

/** Whether the scope's path followed by `texts` holds every active term; true without a query. */
export function matchesPropertyScope(
  scope: PropertyScopeValue,
  texts: ReadonlyArray<string | undefined>,
): boolean {
  if (scope.terms.length === 0) return true;
  return textMatchesTerms(joinScopeText([scope.path, ...texts]), scope.terms);
}
