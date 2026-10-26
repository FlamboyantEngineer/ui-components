import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useMemo } from 'react';
import { DisclosureGroup } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { FieldScopeContext, useFieldScope } from '../field/field.js';
import { PropertyScopeContext, usePropertyScopeLevel, useReportPropertyTally, } from '../property-scope/property-scope.js';
import { TextMatch } from '../text-match/text-match.js';
const panelHooks = createHooks('property-panel', ['header', 'body']);
const groupHooks = createHooks('property-group', ['heading']);
const iconGroupHooks = createHooks('property-icon-group');
/** The body: React Aria's disclosure group while the panel opens and closes its sections. */
function PanelBody({ expansion, children, }) {
    const { expandedKeys, defaultExpandedKeys, onExpandedChange, allowsMultipleExpanded } = expansion;
    const isManaged = expandedKeys !== undefined ||
        defaultExpandedKeys !== undefined ||
        allowsMultipleExpanded !== undefined;
    if (!isManaged)
        return _jsx("div", { ...panelHooks.slot('body'), children: children });
    return (_jsx(DisclosureGroup, { className: panelHooks.slotClass('body'), expandedKeys: expandedKeys, defaultExpandedKeys: defaultExpandedKeys, onExpandedChange: onExpandedChange, allowsMultipleExpanded: allowsMultipleExpanded ?? true, children: children }));
}
/**
 * A panel of labelled properties of one subject, as a `<section>` with an optional header. It can
 * open and close its sections as a group, and disable or lock every field inside.
 */
export function PropertyPanel({ header, labelLayout = 'responsive', isDisabled = false, isReadOnly = false, expandedKeys, defaultExpandedKeys, onExpandedChange, allowsMultipleExpanded, children, className, ...rest }) {
    const parent = useFieldScope();
    const scope = useMemo(() => ({
        ...parent,
        isDisabled: parent.isDisabled || isDisabled,
        isReadOnly: parent.isReadOnly || isReadOnly,
    }), [parent, isDisabled, isReadOnly]);
    const expansion = { expandedKeys, defaultExpandedKeys, onExpandedChange, allowsMultipleExpanded };
    const data = { labelLayout, disabled: isDisabled, readonly: isReadOnly };
    return (_jsxs("section", { ...rest, ...panelHooks.root({ className, data }), children: [isEmptyNode(header) ? null : _jsx("div", { ...panelHooks.slot('header'), children: header }), _jsx(FieldScopeContext, { value: scope, children: _jsx(PanelBody, { expansion: expansion, children: children }) })] }));
}
/** A run of rows under an optional heading. A query hides it while no row inside matches. */
export function PropertyGroup({ heading, children, className, id, ...rest }) {
    const level = usePropertyScopeLevel(heading);
    useReportPropertyTally(level.parent, level.total);
    const generatedId = useId();
    const headingId = `${id ?? generatedId}-heading`;
    const hasHeading = Boolean(heading);
    return (_jsxs("div", { ...rest, ...groupHooks.root({ className }), id: id, role: hasHeading ? 'group' : undefined, "aria-labelledby": hasHeading ? headingId : undefined, hidden: level.isFiltering && level.total.matches === 0, children: [heading ? (_jsx("div", { ...groupHooks.slot('heading'), id: headingId, children: _jsx(TextMatch, { children: heading }) })) : null, _jsx(PropertyScopeContext, { value: level.value, children: children })] }));
}
/** A named group of related icon buttons inside one property row, such as text alignments. */
export function PropertyIconGroup({ variant = 'separate', children, className, ...rest }) {
    return (_jsx("div", { ...rest, ...iconGroupHooks.root({ className, data: { variant } }), role: "group", children: children }));
}
export { PropertyCard } from './property-card.js';
export { PropertyRow } from './property-row.js';
export { PropertySection } from './property-section.js';
export { PropertyStrip, PropertyStripCell } from './property-strip.js';
//# sourceMappingURL=property-panel.js.map