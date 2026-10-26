import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { FocusScope, Disclosure as AriaDisclosure, DisclosureGroup as AriaDisclosureGroup, } from '../../primitives/index.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { materializeIterator } from '../../utils/materialize-iterator.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { useHeadingLevel } from '../section-header/section-header.js';
import { DisclosurePartsContext, disclosureGroupHooks as groupHooks, disclosureHooks as hooks, } from './disclosure-hooks.js';
import { DisclosurePanel, DisclosureTitle } from './disclosure-parts.js';
/**
 * React Aria replaces a falsy disclosure id with a generated one, so `0` and `''` would not match
 * the group's keys: ids and keys cross to it encoded.
 */
function toGroupKeys(keys) {
    return keys === undefined ? undefined : Array.from(materializeIterator(keys), toCollectionKey);
}
/**
 * A collapsible section: a heading whose trigger toggles a panel. With
 * `title` it draws its own title and panel; without it, the caller composes the parts. Inside a
 * `DisclosureGroup` its `id` is its key among the group's expanded keys.
 */
export function Disclosure({ id, title, headingLevel, indicatorPosition = 'start', children, className, ...rest }) {
    const level = useHeadingLevel(headingLevel);
    const parts = useMemo(() => ({ level, indicatorPosition }), [level, indicatorPosition]);
    return (_jsx(AriaDisclosure, { ...rest, id: id === undefined ? undefined : toCollectionKey(id), ...hooks.root({ className, data: { indicatorPosition } }), children: _jsx(DisclosurePartsContext, { value: parts, children: title == null ? (children) : (_jsxs(_Fragment, { children: [_jsx(DisclosureTitle, { children: title }), _jsx(DisclosurePanel, { children: children })] })) }) }));
}
/**
 * Disclosures that expand together, one at a time as an accordion
 * unless `allowsMultipleExpanded`. Arrow keys, Home and End move focus between their triggers.
 */
export function DisclosureGroup({ expandedKeys, defaultExpandedKeys, onExpandedChange, className, children, ...rest }) {
    const ariaExpandedKeys = useMemo(() => toGroupKeys(expandedKeys), [expandedKeys]);
    const ariaDefaultExpandedKeys = useMemo(() => toGroupKeys(defaultExpandedKeys), [defaultExpandedKeys]);
    return (_jsx(AriaDisclosureGroup, { ...rest, expandedKeys: ariaExpandedKeys, defaultExpandedKeys: ariaDefaultExpandedKeys, onExpandedChange: onExpandedChange &&
            ((keys) => onExpandedChange(new Set(Array.from(keys, fromCollectionKey)))), ...groupHooks.root({ className }), children: _jsx(FocusScope, { children: children }) }));
}
export { DisclosureHeader, DisclosurePanel, DisclosureTitle } from './disclosure-parts.js';
//# sourceMappingURL=disclosure.js.map