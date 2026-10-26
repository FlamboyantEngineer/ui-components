import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button as AriaButton, Disclosure, DisclosureGroupStateContext, DisclosurePanel, } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { Glyph } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { useExpandGlyph } from '../expand-toggle/expand-toggle.js';
import { PropertyScopeContext, matchesPropertyScope, usePropertyScopeLevel, useReportPropertyTally, } from '../property-scope/property-scope.js';
import { TextMatch } from '../text-match/text-match.js';
import { OverrideMark, useScopedExpansion, } from './property-disclosure.js';
const hooks = createHooks('property-card', [
    'header',
    'trigger',
    'chevron',
    'name',
    'summary',
    'override',
    'actions',
    'body',
]);
/**
 * A collapsible group of related properties inside a section (React Aria `Disclosure`), counted as
 * one property of its section. A query keeps it while its name or a row inside matches, and opens it.
 */
export function PropertyCard({ name, summary, isOverridden = false, actions, isExpanded, defaultExpanded = false, onExpandedChange, children, className, ...rest }) {
    const level = usePropertyScopeLevel(name);
    const { parent, total, isFiltering } = level;
    const isMatch = matchesPropertyScope(parent, [name]) || total.matches > 0;
    const overridden = isOverridden || total.isOverridden;
    useReportPropertyTally(parent, {
        count: 1,
        matches: isMatch ? 1 : 0,
        isOverridden: overridden,
    });
    const expansion = useScopedExpansion({
        isFiltering,
        isExpandedWhileFiltering: isMatch,
        isExpanded,
        defaultExpanded,
        onExpandedChange,
    });
    const glyph = useExpandGlyph(expansion.isExpanded);
    return (_jsx(DisclosureGroupStateContext, { value: null, children: _jsxs(Disclosure, { ...rest, ...expansion, ...hooks.root({ className, data: { overridden } }), hidden: !isMatch, children: [_jsxs("div", { ...hooks.slot('header'), children: [_jsxs(AriaButton, { slot: "trigger", className: hooks.slotClass('trigger'), children: [_jsx(Glyph, { name: glyph, className: hooks.slotClass('chevron') }), _jsx("span", { ...hooks.slot('name'), children: _jsx(TextMatch, { children: name }) }), ' ', isEmptyNode(summary) ? null : _jsx("span", { ...hooks.slot('summary'), children: summary }), ' ', overridden ? _jsx(OverrideMark, { className: hooks.slotClass('override') }) : null] }), isEmptyNode(actions) ? null : _jsx("div", { ...hooks.slot('actions'), children: actions })] }), _jsx(DisclosurePanel, { className: hooks.slotClass('body'), children: _jsx(PropertyScopeContext, { value: level.value, children: children }) })] }) }));
}
//# sourceMappingURL=property-card.js.map