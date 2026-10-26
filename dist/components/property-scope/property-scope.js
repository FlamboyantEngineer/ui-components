import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { EmptyState } from '../empty-state/empty-state.js';
import { TextMatchProvider, splitMatchTerms } from '../text-match/text-match.js';
import { PropertyScopeContext, usePropertyTallies, } from './scope-tally.js';
const hooks = createHooks('property-scope', ['status']);
/**
 * Filters the property sections, groups, cards and rows below it by a query the caller owns:
 * rows whose texts miss a term hide but stay mounted, matching containers open, matched text is
 * marked, and a status message reports a query nothing matches.
 */
export function PropertyScope({ query = '', filter, onClear, children, className, ...rest }) {
    const strings = useUiStrings();
    const terms = useMemo(() => splitMatchTerms(query), [query]);
    const { report, total } = usePropertyTallies();
    const value = useMemo(() => ({ terms, query, filter, path: '', report }), [terms, query, filter, report]);
    const hasNoMatch = terms.length > 0 && total.matches === 0;
    return (_jsxs("div", { ...rest, ...hooks.root({ className }), children: [_jsx(TextMatchProvider, { query: query, children: _jsx(PropertyScopeContext, { value: value, children: children }) }), _jsx("div", { ...hooks.slot('status'), role: "status", children: hasNoMatch ? (_jsx(EmptyState, { size: "sm", description: _jsxs(_Fragment, { children: [strings.noPropertyMatches(query.trim()), onClear ? (_jsxs(_Fragment, { children: [' ', _jsx(Button, { variant: "ghost", size: "xs", onPress: onClear, children: strings.clearFilter })] })) : null] }) })) : null })] }));
}
export { PropertyScopeContext, matchesPropertyScope, usePropertyScopeLevel, useReportPropertyTally, } from './scope-tally.js';
//# sourceMappingURL=property-scope.js.map