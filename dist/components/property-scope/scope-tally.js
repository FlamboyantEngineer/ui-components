// The bookkeeping behind property filtering: each part of a property panel reports how many
// properties it holds, how many match the active query and whether one overrides an inherited
// value; each level sums the reports of the parts inside it.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { textMatchesTerms } from '../text-match/text-match.js';
export const PropertyScopeContext = createContext({
    terms: [],
    query: '',
    filter: undefined,
    path: '',
    report: () => () => undefined,
});
function isSameTally(left, right) {
    return (left !== undefined &&
        left.count === right.count &&
        left.matches === right.matches &&
        left.isOverridden === right.isOverridden);
}
function sumTallies(tallies) {
    const total = { count: 0, matches: 0, isOverridden: false };
    for (const tally of tallies) {
        total.count += tally.count;
        total.matches += tally.matches;
        total.isOverridden ||= tally.isOverridden;
    }
    return total;
}
/** Joins the non-blank texts of a scope path with single spaces. */
function joinScopeText(texts) {
    return texts.filter((text) => Boolean(text?.trim())).join(' ');
}
/** Collects the tallies the parts inside one level report, and their sum. */
export function usePropertyTallies() {
    const [tallies, setTallies] = useState(() => new Map());
    const report = useCallback((key, tally) => {
        setTallies((previous) => isSameTally(previous.get(key), tally) ? previous : new Map(previous).set(key, tally));
        return () => setTallies((previous) => {
            const next = new Map(previous);
            next.delete(key);
            return next;
        });
    }, []);
    const total = useMemo(() => sumTallies(tallies.values()), [tallies]);
    return { report, total };
}
/** Reports a part's tally to its enclosing level while the part is mounted. */
export function useReportPropertyTally(scope, tally) {
    const [key] = useState(() => Symbol('property'));
    const { report } = scope;
    const { count, matches, isOverridden } = tally;
    useEffect(() => report(key, { count, matches, isOverridden }), [report, key, count, matches, isOverridden]);
}
/** One level of the scope: a section, group or card that adds `text` to the path. */
export function usePropertyScopeLevel(text) {
    const parent = useContext(PropertyScopeContext);
    const { report, total } = usePropertyTallies();
    const value = useMemo(() => ({ ...parent, path: joinScopeText([parent.path, text]), report }), [parent, text, report]);
    return { parent, value, total, isFiltering: parent.terms.length > 0 };
}
/**
 * Whether the scope's path followed by `texts` matches the query: holds every active term, or
 * passes the caller's filter. True without a query.
 */
export function matchesPropertyScope(scope, texts) {
    if (scope.terms.length === 0)
        return true;
    const text = joinScopeText([scope.path, ...texts]);
    return scope.filter ? scope.filter(text, scope.query) : textMatchesTerms(text, scope.terms);
}
//# sourceMappingURL=scope-tally.js.map