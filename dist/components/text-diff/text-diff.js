import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useId, useLayoutEffect, useMemo, useRef, useState, } from 'react';
import { isEditableTarget } from '../../utils/is-editable-target.js';
import { useStateFor } from '../../utils/use-state-for.js';
import { useUiStrings } from '../../core/provider.js';
import { useSyncedScroll } from '../../utils/use-synced-scroll.js';
import { Button } from '../button/button.js';
import { ScrollRegion } from '../scroll-region/scroll-region.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { countChanges, createDiffBlocks, createSplitRows, createUnifiedRows, } from './diff-rows.js';
import { textDiffHooks as hooks } from './text-diff-hooks.js';
import { SplitTable, UnifiedTable, getChangeRowId, getRowId, } from './text-diff-table.js';
const noneExpanded = new Set();
/** The rows of a split side, as anchors the other side aligns to: line, filler and fold rows. */
function readRowAnchors(container) {
    const origin = container.getBoundingClientRect().top - container.scrollTop;
    const rows = container.querySelectorAll(`:scope > table > tbody > tr:not(.${hooks.slotClass('widget')})`);
    return Array.from(rows, (row, index) => ({
        key: index,
        offset: row.getBoundingClientRect().top - origin,
    }));
}
function TextDiffHeader({ added, removed, previous, next, changes, onMove }) {
    const strings = useUiStrings();
    return (_jsxs("div", { ...hooks.slot('header'), children: [_jsxs("span", { ...hooks.slot('summary'), children: [_jsxs("span", { "aria-hidden": "true", ...hooks.slot('count', { change: 'added' }), children: ["+", added] }), _jsxs("span", { "aria-hidden": "true", ...hooks.slot('count', { change: 'removed' }), children: ["\u2212", removed] }), _jsx(VisuallyHidden, { elementType: "span", children: strings.textDiffSummary(added, removed) })] }), _jsxs("span", { ...hooks.slot('navigation'), children: [_jsx(Button, { icon: "chevron-up", size: "sm", label: strings.textDiffPreviousChange, className: hooks.slotClass('previous'), isDisabled: previous < 0, onPress: () => onMove(previous) }), _jsx(Button, { icon: "chevron-down", size: "sm", label: strings.textDiffNextChange, className: hooks.slotClass('next'), isDisabled: next >= changes, onPress: () => onMove(next) })] })] }));
}
/** The scrolling lines: one pane, or two side by side that scroll together. */
function TextDiffBody({ blocks, isSplit, fold, options }) {
    const strings = useUiStrings();
    const [oldPane, setOldPane] = useState(null);
    const [newPane, setNewPane] = useState(null);
    useSyncedScroll([oldPane, newPane], { getAnchors: readRowAnchors, enabled: isSplit });
    const pane = { className: hooks.slotClass('pane'), role: 'group', tabIndex: 0 };
    if (!isSplit) {
        return (_jsx(ScrollRegion, { ...pane, axis: "both", "data-side": "both", "aria-label": strings.textDiffLines, children: _jsx(UnifiedTable, { rows: createUnifiedRows(blocks, fold), options: options }) }));
    }
    const rows = createSplitRows(blocks, fold);
    return (_jsxs("div", { ...hooks.slot('panes'), children: [_jsx(ScrollRegion, { ...pane, axis: "both", "data-side": "old", "aria-label": strings.valueBefore, ref: setOldPane, children: _jsx(SplitTable, { rows: rows, side: "old", options: options }) }), _jsx(ScrollRegion, { ...pane, axis: "both", "data-side": "new", "aria-label": strings.valueAfter, ref: setNewPane, children: _jsx(SplitTable, { rows: rows, side: "new", options: options }) })] }));
}
/**
 * The line diff of two texts, unified or split side by side, with word changes inside changed
 * lines, line numbers, unchanged runs folded behind buttons, widgets under lines, and a header
 * that counts the changes and moves between them.
 */
export function TextDiff({ oldText, newText, layout = 'unified', context = 3, renderLineWidget, className, ...rest }) {
    const baseId = useId();
    const rootRef = useRef(null);
    const pendingFocus = useRef(null);
    const blocks = useMemo(() => createDiffBlocks(oldText, newText), [oldText, newText]);
    // Opened folds and the current change belong to one pair of texts and start over with the next.
    const [expanded, setExpanded] = useStateFor(blocks, noneExpanded);
    const [current, setCurrent] = useStateFor(blocks, null);
    const isSplit = layout === 'split';
    const counts = countChanges(blocks);
    const changeBlocks = blocks.filter((block) => block.kind === 'change');
    const previous = current === null ? -1 : current - 1;
    const next = current === null ? 0 : current + 1;
    const focusRow = (id) => rootRef.current?.ownerDocument.getElementById(id)?.focus();
    useLayoutEffect(() => {
        if (pendingFocus.current === null)
            return;
        focusRow(pendingFocus.current);
        pendingFocus.current = null;
    });
    const moveTo = (change) => {
        const block = changeBlocks[change];
        if (!block)
            return;
        setCurrent(change);
        focusRow(getChangeRowId(baseId, block, isSplit));
    };
    const onExpand = (fold) => {
        setExpanded(new Set(expanded).add(fold.block));
        pendingFocus.current = getRowId(baseId, isSplit ? 'new' : 'both', fold.firstKey);
    };
    const onKeyDown = (event) => {
        const widget = `.${hooks.slotClass('widget')}`;
        if (event.altKey || event.ctrlKey || event.metaKey || isEditableTarget(event.target, widget)) {
            return;
        }
        if (event.key === 'n')
            moveTo(next);
        else if (event.key === 'p')
            moveTo(previous);
        else
            return;
        event.preventDefault();
    };
    return (_jsxs("div", { ...rest, ...hooks.root({ className, props: rest, data: { layout } }), ref: rootRef, role: "group", onKeyDown: onKeyDown, children: [_jsx(TextDiffHeader, { ...counts, previous: previous, next: next, onMove: moveTo }), _jsx(TextDiffBody, { blocks: blocks, isSplit: isSplit, fold: { context, expanded }, options: { baseId, current, renderLineWidget, onExpand } })] }));
}
//# sourceMappingURL=text-diff.js.map