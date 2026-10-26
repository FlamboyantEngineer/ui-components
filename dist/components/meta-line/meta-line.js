import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment, isValidElement } from 'react';
import { createHooks } from '../../core/hooks.js';
const separator = '·';
const textSeparator = ` ${separator} `;
const hooks = createHooks('meta-line', ['separator']);
function isTextItem(item) {
    return typeof item === 'number' || (typeof item === 'string' && item.trim().length > 0);
}
function hasContent(item) {
    if (item === null || item === undefined || typeof item === 'boolean')
        return false;
    if (typeof item === 'string' || typeof item === 'number')
        return isTextItem(item);
    if (Array.isArray(item))
        return item.some(hasContent);
    if (isValidElement(item) && item.type === Fragment) {
        return hasContent(item.props.children);
    }
    return true;
}
function getEntryKey(item, index) {
    // Explicit keys and positions live in separate namespaces, so key="1" never meets position 1.
    // Positions count every item, empty ones included, so an entry keeps its key when one before it
    // empties.
    return isValidElement(item) && item.key !== null ? `k:${item.key}` : `i:${index}`;
}
/** The text form of a metadata line, for tooltips, descriptions and other string-only places. */
export function formatMetaLine(items) {
    return items.filter(isTextItem).join(textSeparator);
}
/** One inline line of metadata entries separated by a decorative middot. */
export function MetaLine({ items, className, ...rest }) {
    const entries = items.flatMap((item, index) => hasContent(item) ? [{ item, key: getEntryKey(item, index) }] : []);
    if (entries.length === 0)
        return null;
    return (_jsx("span", { ...rest, ...hooks.root({ className }), children: entries.map(({ item, key }, index) => (_jsxs(Fragment, { children: [index > 0 ? (_jsxs(_Fragment, { children: [' ', _jsx("span", { ...hooks.slot('separator'), "aria-hidden": "true", children: separator }), ' '] })) : null, item] }, key))) }));
}
//# sourceMappingURL=meta-line.js.map