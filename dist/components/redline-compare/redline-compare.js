import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useMemo, useRef } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { isEditableTarget } from '../../utils/is-editable-target.js';
import { useStateFor } from '../../utils/use-state-for.js';
import { compareBlocks, } from '../../utils/compare-blocks.js';
import { RedlineCompareColumns, RedlineCompareHeader, redlineCompareHooks as hooks, } from './redline-compare-parts.js';
import { RedlineRow } from './redline-row.js';
const noDecisions = {};
/** A row the reader can step to and decide on: every difference but a moved block's old position. */
const isChangeRow = (row) => row.change !== 'unchanged' && row.move !== 'from';
/** Steps between changes and moved blocks' positions, focusing the row it reaches. */
function useRedlineNavigation(comparison, baseId) {
    const rootRef = useRef(null);
    const [current, setCurrent] = useStateFor(comparison, null);
    const { changes, positions } = useMemo(() => ({
        changes: comparison.rows.filter(isChangeRow),
        positions: new Map(comparison.rows.map((row, position) => [row.key, position])),
    }), [comparison]);
    const index = changes.findIndex((row) => row.key === current);
    const rowId = (key) => `${baseId}-row-${positions.get(key)}`;
    const focusRow = (key) => {
        const element = rootRef.current?.ownerDocument.getElementById(rowId(key));
        element?.focus();
        element?.scrollIntoView?.({ block: 'nearest' });
    };
    const goTo = (key) => {
        if (changes.some((row) => row.key === key))
            setCurrent(key);
        focusRow(key);
    };
    const move = (step) => {
        const target = changes[current === null ? (step === 1 ? 0 : -1) : index + step];
        if (target)
            goTo(target.key);
    };
    return {
        rootRef,
        current,
        rowId,
        goTo,
        move,
        canMove: { previous: current !== null && index > 0, next: index < changes.length - 1 },
    };
}
/**
 * The block-level redline of two rich documents: blocks aligned by id or text, inserted and
 * deleted words inline, changed kinds and formatting noted, moved blocks linked between their two
 * positions, inline or side by side, with steps between changes and accept and reject buttons that
 * report each decision as plain data.
 */
export function RedlineCompare({ oldBlocks, newBlocks, layout = 'inline', oldLabel, newLabel, resolutions, onResolve, className, ...rest }) {
    const strings = useUiStrings();
    const baseId = useId();
    const comparison = useMemo(() => compareBlocks(oldBlocks, newBlocks), [oldBlocks, newBlocks]);
    const navigation = useRedlineNavigation(comparison, baseId);
    const [ownDecisions, setOwnDecisions] = useStateFor(comparison, noDecisions);
    const decisions = resolutions ?? ownDecisions;
    const isSplit = layout === 'split';
    const resolve = (row, decision) => {
        if (decisions[row.key] === decision)
            return;
        if (!resolutions)
            setOwnDecisions({ ...ownDecisions, [row.key]: decision });
        onResolve?.({ decision, row });
    };
    const onKeyDown = (event) => {
        if (event.altKey || event.ctrlKey || event.metaKey || isEditableTarget(event.target))
            return;
        if (event.key === 'n')
            navigation.move(1);
        else if (event.key === 'p')
            navigation.move(-1);
        else
            return;
        event.preventDefault();
    };
    const labelledBy = rest['aria-labelledby'];
    return (_jsxs("div", { ...rest, ...hooks.root({ className, props: rest, data: { layout } }), "aria-label": rest['aria-label'] ?? (labelledBy ? undefined : strings.redlineComparison), ref: navigation.rootRef, role: "group", onKeyDown: onKeyDown, children: [_jsx(RedlineCompareHeader, { counts: comparison.counts, canMove: navigation.canMove, onMove: navigation.move }), isSplit ? (_jsx(RedlineCompareColumns, { labels: { old: oldLabel ?? strings.valueBefore, new: newLabel ?? strings.valueAfter } })) : null, _jsx("ol", { ...hooks.slot('rows'), children: comparison.rows.map((row) => (_jsx(RedlineRow, { row: row, rowId: navigation.rowId(row.key), isSplit: isSplit, isCurrent: row.key === navigation.current, decision: decisions[row.key], onResolve: onResolve && isChangeRow(row) ? (decision) => resolve(row, decision) : undefined, onJump: () => navigation.goTo(row.counterpartKey) }, row.key))) })] }));
}
//# sourceMappingURL=redline-compare.js.map