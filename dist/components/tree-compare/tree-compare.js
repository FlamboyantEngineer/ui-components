import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { useUiStrings } from '../../core/provider.js';
import { compareTrees, } from '../../utils/compare-trees.js';
import { useStateFor } from '../../utils/use-state-for.js';
import { Tree } from '../tree/tree.js';
import { TreeCompareHeader, TreeCompareJump, TreeCompareRowContent, TreeCompareToolbar, treeCompareHooks as hooks, } from './tree-compare-parts.js';
import { collectKeysAboveChanges, filterChangedRows, indexRows, nameRow, } from './tree-compare-rows.js';
import { useTreeCompareNavigation } from './use-tree-compare-navigation.js';
const readChildren = (row) => row.children;
/**
 * The expanded rows, by default every row with a difference below it. Uncontrolled expansion
 * belongs to the compared trees: it starts over when `left` or `right` changes.
 */
function useCompareExpansion({ rows, trees }, props) {
    const { expandedKeys, defaultExpandedKeys, onExpandedChange } = props;
    const initial = useMemo(() => (defaultExpandedKeys ? new Set(defaultExpandedKeys) : collectKeysAboveChanges(rows)), [defaultExpandedKeys, rows]);
    const [own, setOwn] = useStateFor(trees, initial);
    const isControlled = expandedKeys !== undefined;
    const setExpanded = (next) => {
        if (!isControlled)
            setOwn(next);
        onExpandedChange?.(next);
    };
    return [isControlled ? new Set(expandedKeys) : own, setExpanded];
}
/** Everything the comparison draws: the aligned rows shown, the filter, expansion and navigation. */
function useTreeCompareModel(props) {
    const { left, right, isEqual, changesOnly, defaultChangesOnly = false } = props;
    const comparison = useMemo(() => compareTrees(left, right, { isEqual }), [left, right, isEqual]);
    const trees = useMemo(() => ({ left, right }), [left, right]);
    const [isFiltered, setFiltered] = useControllableState(changesOnly, defaultChangesOnly, props.onChangesOnlyChange);
    const rows = useMemo(() => (isFiltered ? filterChangedRows(comparison.rows) : comparison.rows), [comparison, isFiltered]);
    const index = useMemo(() => indexRows(rows), [rows]);
    const [expanded, setExpanded] = useCompareExpansion({ rows: comparison.rows, trees }, props);
    const navigation = useTreeCompareNavigation({
        index,
        expandedKeys: expanded,
        setExpandedKeys: setExpanded,
    });
    const { counts } = comparison;
    return {
        rows,
        counts,
        hasChanges: counts.added + counts.removed + counts.changed + counts.moved > 0,
        isFiltered,
        setFiltered,
        expanded,
        setExpanded,
        navigation,
        /** A moved row goes to its other position; a row with child rows expands or collapses. */
        onAction(key) {
            const row = index.byId.get(key);
            if (row?.counterpartId !== undefined)
                navigation.reveal(row.counterpartId);
            else if (row && row.children.length > 0) {
                const next = new Set(expanded);
                if (!next.delete(key))
                    next.add(key);
                setExpanded(next);
            }
        },
        /** F7 steps to the next difference and Shift+F7 to the previous one. */
        onItemKeyDown(_row, event) {
            if (event.key !== 'F7')
                return false;
            navigation.step(event.shiftKey ? -1 : 1);
            return true;
        },
    };
}
/**
 * Two hierarchies aligned row by row on React Aria's tree through `Tree`: each row shows a node's
 * left and right versions side by side, marked added, removed, changed or moved, with one
 * expansion for both sides, a filter that keeps only differences, steps between differences, links
 * between a moved node's two positions and a summary of the counts.
 */
export function TreeCompare(props) {
    const strings = useUiStrings();
    const model = useTreeCompareModel(props);
    const { navigation } = model;
    const { className, id, leftLabel, rightLabel, renderLabel } = props;
    const labelledBy = props['aria-labelledby'];
    return (_jsxs("div", { ...hooks.root({ className, props, data: { changesOnly: model.isFiltered } }), id: id, onFocus: navigation.onFocus, children: [_jsx(TreeCompareToolbar, { counts: model.counts, changesOnly: model.isFiltered, onChangesOnlyChange: model.setFiltered, hasChanges: model.hasChanges, onStep: navigation.step }), _jsx(TreeCompareHeader, { leftLabel: leftLabel ?? strings.valueBefore, rightLabel: rightLabel ?? strings.valueAfter }), _jsx(Tree, { "aria-label": props['aria-label'] ?? (labelledBy ? undefined : strings.treeComparison), "aria-labelledby": labelledBy, "aria-describedby": props['aria-describedby'], "aria-details": props['aria-details'], ref: navigation.treeRef, className: hooks.slotClass('tree'), items: model.rows, getChildren: readChildren, getTextValue: (row) => nameRow(row, strings), expandedKeys: model.expanded, onExpandedChange: model.setExpanded, onAction: model.onAction, onItemKeyDown: model.onItemKeyDown, emptyMessage: strings.treeNoDifferences, renderLabel: (row, state) => (_jsx(TreeCompareRowContent, { row: row, isExpanded: state.isExpanded, renderLabel: renderLabel })), renderActions: (row) => row.counterpartId === undefined ? null : (_jsx(TreeCompareJump, { isOldPosition: row.right === undefined, onPress: () => navigation.reveal(row.counterpartId) })) })] }));
}
//# sourceMappingURL=tree-compare.js.map