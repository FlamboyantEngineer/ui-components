import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
// Keeps portalled content in the tab order of the place it is declared: Tab moves into and out of
// it as if it sat there, through focus guards in place and at both ends of the portal wrapper.
import { useMemo, useRef } from 'react';
const tabbableSelector = [
    'a[href]',
    'area[href]',
    'button',
    'input:not([type="hidden"])',
    'select',
    'textarea',
    'iframe',
    'summary',
    'audio[controls]',
    'video[controls]',
    '[contenteditable]:not([contenteditable="false"])',
    '[tabindex]',
].join(', ');
function isTabbable(element) {
    if (element.tabIndex < 0 ||
        element.matches(':disabled') ||
        element.closest('[inert], [hidden]')) {
        return false;
    }
    return typeof element.checkVisibility === 'function'
        ? element.checkVisibility({ visibilityProperty: true })
        : true;
}
/** The tabbable elements of `root`'s document outside `nodes`, or inside the wrapper only. */
function listTabbables(nodes, scope) {
    const { wrapper } = nodes;
    if (!wrapper)
        return [];
    const root = scope === 'inside' ? wrapper : wrapper.ownerDocument;
    const guards = new Set(Object.values(nodes.guards));
    return Array.from(root.querySelectorAll(tabbableSelector)).filter((element) => !guards.has(element) &&
        (scope === 'inside' || !wrapper.contains(element)) &&
        isTabbable(element));
}
function isAfter(reference, element) {
    return Boolean(reference.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING);
}
/** The tabbable element outside the portal just after (or before) `reference` in document order. */
function findOutside(nodes, reference, direction) {
    if (!reference)
        return null;
    const outside = listTabbables(nodes, 'outside');
    return direction === 'next'
        ? (outside.find((element) => isAfter(reference, element)) ?? null)
        : (outside.findLast((element) => isAfter(element, reference)) ?? null);
}
/** Where focus goes from a guard; `null` leaves the page's tab order (the guard blurs). */
function resolveGuardTarget(kind, nodes, cameFrom) {
    const { wrapper, guards } = nodes;
    const inside = listTabbables(nodes, 'inside');
    const fromInside = cameFrom !== null && Boolean(wrapper?.contains(cameFrom));
    switch (kind) {
        case 'before':
            return inside[0] ?? findOutside(nodes, guards.after, 'next');
        case 'after':
            return inside.at(-1) ?? findOutside(nodes, guards.before, 'previous');
        case 'start':
            // Leaving backwards, or reached at the end of the document: skip what was already visited.
            return fromInside
                ? findOutside(nodes, guards.before, 'previous')
                : findOutside(nodes, guards.end, 'next');
        case 'end':
            return fromInside
                ? findOutside(nodes, guards.after, 'next')
                : findOutside(nodes, guards.start, 'previous');
    }
}
function FocusGuard({ kind, nodes, }) {
    const onFocus = (event) => {
        const target = resolveGuardTarget(kind, nodes.current, event.relatedTarget);
        if (target)
            target.focus();
        else
            event.currentTarget.blur();
    };
    return (_jsx("span", { ref: (node) => {
            nodes.current.guards[kind] = node;
        }, tabIndex: 0, style: { position: 'fixed', top: 0, left: 0 }, onFocus: onFocus }));
}
/**
 * Focus guards that give portalled content the tab order of the place it is declared. Tab reaches
 * the content right after what precedes that place and leaves it to what follows; Shift+Tab does
 * the reverse. Reached through the document's own order instead, the content is skipped.
 */
export function usePreservedTabOrder() {
    const nodes = useRef({
        wrapper: null,
        guards: { before: null, after: null, start: null, end: null },
    });
    return useMemo(() => ({
        wrapperRef: (node) => {
            nodes.current.wrapper = node;
        },
        placeGuards: (_jsxs(_Fragment, { children: [_jsx(FocusGuard, { kind: "before", nodes: nodes }), _jsx(FocusGuard, { kind: "after", nodes: nodes })] })),
        startGuard: _jsx(FocusGuard, { kind: "start", nodes: nodes }),
        endGuard: _jsx(FocusGuard, { kind: "end", nodes: nodes }),
    }), []);
}
//# sourceMappingURL=tab-order.js.map