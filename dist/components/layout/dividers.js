import { jsxs as _jsxs } from "react/jsx-runtime";
import { Children, Fragment, createElement, isValidElement } from 'react';
import { isEmptyNode } from '../../utils/is-empty-node.js';
/** Parents whose children are list items, so a divider between them is one too. */
const listParents = new Set(['ul', 'ol']);
/** Parents that hold phrasing content only, so a divider between their children is inline. */
const phrasingParents = new Set(['a', 'label', 'p', 'span']);
/** The element of a divider that is valid between the children of `parent`. */
export function resolveDividerElement(parent) {
    if (listParents.has(parent))
        return 'li';
    return phrasingParents.has(parent) ? 'span' : 'div';
}
/**
 * The rendered children of a layout primitive with a decorative divider, hidden from assistive
 * technology, between each pair. Children that are `null`, `undefined`, booleans or empty strings
 * get no divider; components are not rendered to find out whether they draw anything.
 */
export function interleaveDividers(children, { parent, className }) {
    const element = resolveDividerElement(parent);
    // `Children.toArray` keys every element, so keyed children keep their identity when reordered.
    const shown = Children.toArray(children).filter((child) => !isEmptyNode(child));
    return shown.map((child, index) => (_jsxs(Fragment, { children: [index > 0 ? createElement(element, { className, 'aria-hidden': true }) : null, child] }, isValidElement(child) ? child.key : index)));
}
//# sourceMappingURL=dividers.js.map