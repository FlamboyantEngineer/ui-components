import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { getLocalTimeZone, today as todayIn, useLocale } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import { useUiStrings } from '../../core/provider.js';
import { TimelineChart } from './timeline-chart.js';
import {} from './timeline-geometry.js';
import { timelineHooks as hooks } from './timeline-hooks.js';
import { layoutTimeline } from './timeline-layout.js';
import { collectGroupKeys, flattenTimelineRows } from './timeline-rows.js';
import { TimelineTable } from './timeline-table.js';
function toKeySet(keys, items) {
    if (keys === undefined)
        return undefined;
    return new Set(keys === 'all' ? items.map((item) => item.id) : keys);
}
/** The selected items, controlled or not, and a toggle that selects or deselects one item. */
function useItemSelection(props, items) {
    const { selectionMode = 'none', onSelectionChange } = props;
    const [selected, setSelected] = useControllableState(toKeySet(props.selectedKeys, items), toKeySet(props.defaultSelectedKeys, items) ?? new Set(), onSelectionChange ? (keys) => onSelectionChange(new Set(keys)) : undefined);
    const toggle = (id) => {
        const isSelected = selected.has(id);
        if (selectionMode === 'single')
            return setSelected(new Set(isSelected ? [] : [id]));
        const next = new Set(selected);
        if (isSelected)
            next.delete(id);
        else
            next.add(id);
        setSelected(next);
    };
    const replace = (keys) => setSelected(toKeySet(keys, items));
    return { selectionMode, selected, toggle, replace };
}
/** The expanded groups, controlled or not (every group at first), and a change to one group. */
function useRowExpansion(props, rows) {
    const { expandedKeys, defaultExpandedKeys, onExpandedChange } = props;
    const [expanded, setExpanded] = useControllableState(expandedKeys === undefined ? undefined : new Set(expandedKeys), new Set(defaultExpandedKeys ?? collectGroupKeys(rows)), onExpandedChange ? (keys) => onExpandedChange(new Set(keys)) : undefined);
    const change = (id, isExpanded) => {
        const next = new Set(expanded);
        if (isExpanded)
            next.add(id);
        else
            next.delete(id);
        setExpanded(next);
    };
    return { expanded, change };
}
/**
 * A Gantt-style timeline: rows of bars and milestones on a zoomable time scale, with progress,
 * dependency connectors, a today marker and collapsible row groups. Items move and resize by pointer
 * and keyboard, and the same items read as a table in the table view.
 */
export function Timeline({ rows, items, dependencies = [], scale = 'week', range, today, view = 'chart', rowHeight = 36, onItemChange, expandedKeys, defaultExpandedKeys, onExpandedChange, className, ...rest }) {
    const strings = useUiStrings();
    const { locale } = useLocale();
    const { selectionMode, selectedKeys, defaultSelectedKeys, onSelectionChange, ...elementProps } = rest;
    const selection = useItemSelection({ selectionMode, selectedKeys, defaultSelectedKeys, onSelectionChange }, items);
    const expansion = useRowExpansion({ expandedKeys, defaultExpandedKeys, onExpandedChange }, rows);
    const [draft, setDraft] = useState(null);
    const day = today ?? todayIn(getLocalTimeZone()).toString();
    const named = rest['aria-label'] !== undefined || rest['aria-labelledby'] !== undefined;
    const actions = {
        isSelectable: selection.selectionMode !== 'none',
        selectedKeys: selection.selected,
        onToggleSelection: selection.toggle,
        isEditable: (item) => onItemChange !== undefined && !item.isReadOnly,
        onDraft: setDraft,
        onCommit: (change) => onItemChange?.(change),
        onExpandedChange: expansion.change,
    };
    const visibleRows = flattenTimelineRows(rows, expansion.expanded);
    const { axis, layout } = layoutTimeline({
        rows: visibleRows,
        items,
        draft,
        dependencies,
        range,
        scale,
        today: day,
        locale,
        rowHeight,
    });
    return (_jsx("div", { role: "group", "aria-label": named ? undefined : strings.timeline, ...elementProps, ...hooks.root({ className, props: elementProps, data: { scale, view } }), children: view === 'table' ? (_jsx(TimelineTable, { label: rest['aria-label'] ?? (named ? undefined : strings.timeline), labelledBy: rest['aria-labelledby'], rows: rows, items: items, selectionMode: selection.selectionMode, selectedKeys: selection.selected, onSelectionChange: selection.replace })) : (_jsx(TimelineChart, { axis: axis, scale: scale, rows: visibleRows, layout: layout, rowHeight: rowHeight, today: day, actions: actions })) }));
}
//# sourceMappingURL=timeline.js.map