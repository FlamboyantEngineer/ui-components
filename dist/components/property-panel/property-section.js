import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button as AriaButton, Disclosure, DisclosureGroupStateContext, DisclosurePanel, Heading, } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { Glyph } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Badge } from '../badge/badge.js';
import { useExpandGlyph } from '../expand-toggle/expand-toggle.js';
import { PropertyScopeContext, usePropertyScopeLevel, useReportPropertyTally, } from '../property-scope/property-scope.js';
import { TextMatch } from '../text-match/text-match.js';
import { OverrideMark, useSectionExpansion, } from './property-disclosure.js';
const hooks = createHooks('property-section', [
    'header',
    'heading',
    'trigger',
    'chevron',
    'title',
    'override',
    'count',
    'meta',
    'actions',
    'content',
    'description',
]);
/**
 * A collapsible category of a property panel (React Aria `Disclosure`): a heading whose trigger
 * shows the title, an override mark and the count, trailing actions, and the content, which stays
 * mounted while collapsed. A query opens it while it holds a match and hides it otherwise.
 */
export function PropertySection({ id, title, description, meta, actions, count, headingLevel = 3, persistKey, isExpanded, defaultExpanded = true, onExpandedChange, hidden = false, children, className, ...rest }) {
    const level = usePropertyScopeLevel(title);
    const { total, isFiltering } = level;
    useReportPropertyTally(level.parent, { ...total, matches: hidden ? 0 : total.matches });
    const expansion = useSectionExpansion({
        id,
        isFiltering,
        isExpandedWhileFiltering: true,
        isExpanded,
        defaultExpanded,
        onExpandedChange,
        persistKey,
    });
    const glyph = useExpandGlyph(expansion.isExpanded);
    const shownCount = count ?? (total.count > 0 ? total.count : undefined);
    return (_jsx(DisclosureGroupStateContext, { value: null, children: _jsxs(Disclosure, { ...rest, ...expansion, ...hooks.root({ className, data: { overridden: total.isOverridden } }), hidden: hidden || (isFiltering && total.matches === 0), children: [_jsxs("div", { ...hooks.slot('header'), children: [_jsx(Heading, { level: headingLevel, className: hooks.slotClass('heading'), children: _jsxs(AriaButton, { slot: "trigger", className: hooks.slotClass('trigger'), children: [_jsx(Glyph, { name: glyph, className: hooks.slotClass('chevron') }), _jsx("span", { ...hooks.slot('title'), children: _jsx(TextMatch, { children: title }) }), ' ', total.isOverridden ? _jsx(OverrideMark, { className: hooks.slotClass('override') }) : null, ' ', shownCount === undefined ? null : (_jsx(Badge, { count: shownCount, size: "sm", className: hooks.slotClass('count') })), ' ', isEmptyNode(meta) ? null : _jsx("span", { ...hooks.slot('meta'), children: meta })] }) }), isEmptyNode(actions) ? null : _jsx("div", { ...hooks.slot('actions'), children: actions })] }), _jsxs(DisclosurePanel, { className: hooks.slotClass('content'), children: [isEmptyNode(description) ? null : (_jsx("div", { ...hooks.slot('description'), children: description })), _jsx(PropertyScopeContext, { value: level.value, children: children })] })] }) }));
}
//# sourceMappingURL=property-section.js.map