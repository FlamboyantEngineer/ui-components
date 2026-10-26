import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useMemo } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { formatOutlineNumber, } from '../../utils/outline-number.js';
import { EmptyState } from '../empty-state/empty-state.js';
import { ExpandToggle } from '../expand-toggle/expand-toggle.js';
import { useScrollSpy } from '../scroll-region/scroll-region.js';
import { flattenOutline, nestOutlineHeadings, } from './outline-tree.js';
import { useOutlineExpansion } from './use-outline-expansion.js';
const hooks = createHooks('outline', ['empty', 'list', 'item', 'row', 'link', 'number', 'label']);
const noViewport = { current: null };
/** A plain primary click; others (a new tab, a download) keep the browser's behaviour. */
function isPlainClick(event) {
    return (!event.defaultPrevented &&
        event.button === 0 &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey);
}
/** Scrolls the heading into view and moves focus to it when it can take focus. */
function revealHeading(document, id) {
    const target = document.getElementById(id);
    if (!target)
        return;
    target.scrollIntoView({ block: 'start' });
    if (target.hasAttribute('tabindex'))
        target.focus({ preventScroll: true });
}
function OutlineList(props) {
    return (_jsx("ol", { ...hooks.slot('list'), id: props.id, hidden: props.hidden, children: props.entries.map((entry) => (_jsx(OutlineItem, { entry: entry, context: props.context }, entry.heading.id))) }));
}
function OutlineItem({ entry, context }) {
    const strings = useUiStrings();
    const { heading, children } = entry;
    const hasChildren = children.length > 0;
    const isExpanded = hasChildren && context.isExpanded(entry);
    const isCurrent = heading.id === context.currentId;
    const listId = `${context.baseId}-${entry.path.join('-')}`;
    return (_jsxs("li", { ...hooks.slot('item', {
            level: heading.level,
            current: isCurrent,
            currentWithin: context.currentAncestors.has(heading.id),
            expanded: isExpanded,
        }), children: [_jsxs("div", { ...hooks.slot('row'), children: [context.hasToggles ? (_jsx(ExpandToggle, { size: "xs", isExpandable: hasChildren, isExpanded: isExpanded, onExpandedChange: (next) => context.setExpanded(entry, next), label: strings.sectionsIn(heading.label), "aria-controls": hasChildren ? listId : undefined })) : null, _jsxs("a", { ...hooks.slot('link'), href: `#${heading.id}`, "aria-current": isCurrent ? 'location' : undefined, onClick: (event) => context.onFollow(event, heading.id), children: [context.isNumbered ? (_jsxs(_Fragment, { children: [_jsx("span", { ...hooks.slot('number'), children: formatOutlineNumber(entry.path, context.numberOptions) }), ' '] })) : null, _jsx("span", { ...hooks.slot('label'), children: heading.label })] })] }), hasChildren ? (_jsx(OutlineList, { entries: children, context: context, id: listId, hidden: !isExpanded })) : null] }));
}
/** The current heading: the controlled one, else the one the viewport's scroll position reaches. */
function useCurrentHeading(entries, { currentId, viewportRef, trackingOffset }) {
    const ids = useMemo(() => entries.map((entry) => entry.heading.id), [entries]);
    const tracked = useScrollSpy(viewportRef ?? noViewport, { ids, offset: trackingOffset });
    const current = currentId === undefined ? tracked : currentId;
    const ancestors = entries.find((entry) => entry.heading.id === current)?.ancestors ?? [];
    return { current, currentAncestors: new Set(ancestors) };
}
/**
 * A document outline: a navigation landmark with the document's headings as nested links. It marks
 * the heading being read, follows the scroll of a viewport, scrolls to a heading when its entry is
 * followed, collapses and expands sections, and can number its entries.
 */
export function Outline(props) {
    const { headings, isPending = false, emptyMessage, isNumbered = false } = props;
    const { className, id, 'aria-label': ariaLabel, 'aria-labelledby': labelledBy } = props;
    const strings = useUiStrings();
    const baseId = useId();
    const roots = useMemo(() => nestOutlineHeadings(headings), [headings]);
    const entries = useMemo(() => flattenOutline(roots), [roots]);
    const parents = entries.filter((entry) => entry.children.length > 0);
    const { isExpanded, setExpanded } = useOutlineExpansion(parents, props);
    const { current, currentAncestors } = useCurrentHeading(entries, props);
    const context = {
        baseId,
        currentId: current,
        currentAncestors,
        hasToggles: parents.length > 0,
        isNumbered,
        numberOptions: props.numberOptions,
        isExpanded,
        setExpanded,
        onFollow: (event, headingId) => {
            if (!isPlainClick(event))
                return;
            event.preventDefault();
            props.onNavigate?.(headingId);
            revealHeading(event.currentTarget.ownerDocument, headingId);
        },
    };
    const hasNotice = roots.length === 0 && (isPending || !isEmptyNode(emptyMessage));
    return (_jsxs("nav", { ...hooks.root({ className, props, data: { numbered: isNumbered, pending: isPending } }), id: id, "aria-label": ariaLabel ?? (labelledBy ? undefined : strings.outline), "aria-labelledby": labelledBy, "aria-describedby": props['aria-describedby'], "aria-details": props['aria-details'], "aria-busy": isPending || undefined, children: [hasNotice ? (_jsx(EmptyState, { variant: isPending ? 'loading' : 'empty', size: "sm", description: isPending ? strings.loading : emptyMessage, className: hooks.slotClass('empty') })) : null, roots.length > 0 ? _jsx(OutlineList, { entries: roots, context: context }) : null] }));
}
//# sourceMappingURL=outline.js.map