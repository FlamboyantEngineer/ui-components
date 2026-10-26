import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useContext, useId } from 'react';
import { createHooks } from '../../core/hooks.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { PropertyScopeContext, matchesPropertyScope, useReportPropertyTally, } from '../property-scope/property-scope.js';
import { TextMatch } from '../text-match/text-match.js';
const hooks = createHooks('property-row', [
    'label',
    'required',
    'control',
    'unit',
    'hint',
    'description',
    'actions',
]);
const noKeywords = [];
function RowLabel({ id, htmlFor, children }) {
    if (htmlFor === undefined) {
        return (_jsx("div", { ...hooks.slot('label'), id: id, children: children }));
    }
    return (_jsx("label", { ...hooks.slot('label'), id: id, htmlFor: htmlFor, children: children }));
}
/** The control slot: named by the label as a group unless the label is bound to the control. */
function RowControl({ labelId, htmlFor, unit, hint, children }) {
    const isGroup = htmlFor === undefined;
    return (_jsxs("div", { ...hooks.slot('control'), role: isGroup ? 'group' : undefined, "aria-labelledby": isGroup ? labelId : undefined, children: [children, unit ? _jsx("span", { ...hooks.slot('unit'), children: unit }) : null, isEmptyNode(hint) ? null : _jsx("div", { ...hooks.slot('hint'), children: hint })] }));
}
/**
 * One labelled property of a panel: the label, then the control with its unit and hint, a
 * description and actions. Under a query it hides, staying mounted, unless the enclosing path, its
 * label or its keywords hold every term.
 */
export function PropertyRow({ label, htmlFor, keywords = noKeywords, unit, hint, description, actions, isOverridden = false, isRequired = false, wide = false, children, className, id, ...rest }) {
    const scope = useContext(PropertyScopeContext);
    const labelText = typeof label === 'string' ? label : undefined;
    const isMatch = matchesPropertyScope(scope, [labelText, ...keywords]);
    useReportPropertyTally(scope, { count: 1, matches: isMatch ? 1 : 0, isOverridden });
    const generatedId = useId();
    const labelId = `${id ?? generatedId}-label`;
    const data = { overridden: isOverridden, required: isRequired, wide };
    return (_jsxs("div", { ...rest, ...hooks.root({ className, data }), id: id, hidden: !isMatch, children: [_jsxs(RowLabel, { id: labelId, htmlFor: htmlFor, children: [labelText === undefined ? label : _jsx(TextMatch, { children: labelText }), isRequired ? (_jsx("span", { ...hooks.slot('required'), "aria-hidden": "true", children: "*" })) : null] }), _jsx(RowControl, { labelId: labelId, htmlFor: htmlFor, unit: unit, hint: hint, children: children }), isEmptyNode(description) ? null : _jsx("div", { ...hooks.slot('description'), children: description }), isEmptyNode(actions) ? null : _jsx("div", { ...hooks.slot('actions'), children: actions })] }));
}
//# sourceMappingURL=property-row.js.map