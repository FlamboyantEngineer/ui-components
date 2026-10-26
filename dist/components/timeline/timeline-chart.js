import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useId } from 'react';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { measuredProperty } from '../../core/hooks.js';
import { ExpandToggle } from '../expand-toggle/expand-toggle.js';
import { resolveScaleCells, timelineScales, } from './timeline-geometry.js';
import { TimelineHeader } from './timeline-header.js';
import { timelineHooks as hooks } from './timeline-hooks.js';
import { TimelineItemButton } from './timeline-item.js';
/** The row names on the left, pinned to the viewport's start while the chart scrolls sideways. */
function TimelineRowList({ rows, rowHeight, labelId, onExpandedChange }) {
    return (_jsx("div", { ...hooks.slot('list'), style: { position: 'sticky', left: 0, zIndex: 1 }, children: rows.map(({ row, level, hasChildren, isExpanded }, index) => (_jsxs("div", { ...hooks.slot('row-label', { group: hasChildren, expanded: isExpanded }), style: { height: rowHeight, ...measuredProperty('timeline-level', String(level)) }, children: [_jsx(ExpandToggle, { className: hooks.slotClass('toggle'), isExpandable: hasChildren, isExpanded: isExpanded, label: row.label, onExpandedChange: (next) => onExpandedChange(row.id, next) }), _jsx("span", { ...hooks.slot('row-name'), id: labelId(index), children: row.label })] }, toKeyIdentity(row.id)))) }));
}
/** Gridlines at the starts of the scale's units and the today marker, behind the rows. */
function TimelineGuides({ axis, scale, today, }) {
    const plan = timelineScales[scale];
    const majorStarts = new Set(resolveScaleCells(axis, plan.major).map((cell) => cell.start));
    const isTodayShown = today >= axis.range.start && today <= axis.range.end;
    return (_jsxs(_Fragment, { children: [resolveScaleCells(axis, plan.minor).map((cell) => (_jsx("span", { ...hooks.slot('gridline', { major: majorStarts.has(cell.start) }), style: { position: 'absolute', top: 0, bottom: 0, left: cell.left }, "aria-hidden": "true" }, cell.start))), isTodayShown ? (_jsx("span", { ...hooks.slot('today'), style: {
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: axis.scale.map(today) + axis.dayWidth / 2,
                }, "aria-hidden": "true" })) : null] }));
}
/** The dependency connectors, drawn behind the items. */
function TimelineConnectors({ axis, layout, height, }) {
    return (_jsx("svg", { ...hooks.slot('connectors'), width: axis.width, height: height, style: { position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }, "aria-hidden": "true", focusable: "false", children: layout.connectors.map((connector) => (_jsx("path", { ...hooks.slot('connector', { conflict: connector.hasConflict }), d: connector.path, fill: "none" }, connector.key))) }));
}
/**
 * The scrolling chart: a viewport holding the pinned corner, time scale and row list around the
 * rows of bars, milestones and dependency connectors.
 */
export function TimelineChart({ axis, scale, rows, layout, rowHeight, today, actions, }) {
    const baseId = useId();
    const labelId = (index) => `${baseId}-row-${index}`;
    return (_jsx("div", { ...hooks.slot('viewport'), children: _jsxs("div", { ...hooks.slot('canvas'), style: { gridTemplateColumns: `auto ${axis.width}px` }, children: [_jsx("div", { ...hooks.slot('corner'), style: { position: 'sticky', top: 0, left: 0, zIndex: 3 } }), _jsx(TimelineHeader, { axis: axis, scale: scale }), _jsx(TimelineRowList, { rows: rows, rowHeight: rowHeight, labelId: labelId, onExpandedChange: actions.onExpandedChange }), _jsxs("div", { ...hooks.slot('body'), style: {
                        position: 'relative',
                        zIndex: 0,
                        width: axis.width,
                        height: rows.length * rowHeight,
                    }, children: [_jsx(TimelineGuides, { axis: axis, scale: scale, today: today }), _jsx(TimelineConnectors, { axis: axis, layout: layout, height: rows.length * rowHeight }), rows.map(({ row }, index) => (_jsx("div", { ...hooks.slot('row'), role: "group", "aria-labelledby": labelId(index), style: { position: 'relative', height: rowHeight }, children: layout.rowItems.get(row.id)?.map((placed) => (_jsx(TimelineItemButton, { placed: placed, predecessors: layout.predecessors.get(placed.item.id), scale: scale, dayWidth: axis.dayWidth, isEditable: actions.isEditable(placed.item), selection: {
                                    isSelectable: actions.isSelectable,
                                    isSelected: actions.selectedKeys.has(placed.item.id),
                                    onToggle: actions.onToggleSelection,
                                }, onDraft: actions.onDraft, onCommit: actions.onCommit }, toKeyIdentity(placed.item.id)))) }, toKeyIdentity(row.id))))] })] }) }));
}
//# sourceMappingURL=timeline-chart.js.map