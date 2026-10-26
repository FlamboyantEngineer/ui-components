import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { useUiStrings } from '../../core/provider.js';
import { ExpandToggle } from '../expand-toggle/expand-toggle.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { BoardCell } from './board-cell.js';
import { boardHooks as hooks } from './board-hooks.js';
/** One cell per column of a lane, or of a board without lanes. */
export function BoardCells({ model, lane, laneTitleId, options, }) {
    return (_jsx("div", { ...hooks.slot('cells'), children: model.columns.map((column, index) => (_jsx(BoardCell, { address: { column: column.id, lane }, items: model.getCellItems(column.id, lane), isCollapsed: model.collapsedColumns.keys.has(column.id), isOverLimit: model.isOverLimit(column), labelledBy: [model.columnTitleId(index), laneTitleId].filter(Boolean).join(' '), options: options }, toKeyIdentity(column.id)))) }));
}
/**
 * A lane: a group named by its header (collapse toggle, title, card count) holding one cell per
 * column, which a collapsed lane hides.
 */
export function BoardLaneGroup({ model, lane, index, options, }) {
    const strings = useUiStrings();
    const titleId = model.laneTitleId(index);
    const isCollapsed = model.collapsedLanes.keys.has(lane.id);
    const count = model.countLane(lane.id);
    return (_jsxs("div", { role: "group", "aria-labelledby": titleId, ...hooks.slot('lane', { collapsed: isCollapsed }), children: [_jsxs("div", { ...hooks.slot('lane-header'), children: [_jsx(ExpandToggle, { isExpanded: !isCollapsed, onExpandedChange: (isExpanded) => model.collapsedLanes.setCollapsed(lane.id, !isExpanded), label: isCollapsed ? strings.expandPanel(lane.title) : strings.collapsePanel(lane.title), className: hooks.slotClass('lane-toggle') }), _jsx("span", { id: titleId, ...hooks.slot('lane-title'), children: lane.title }), _jsxs("span", { ...hooks.slot('lane-count'), children: [_jsx("span", { "aria-hidden": "true", children: count }), _jsx(VisuallyHidden, { elementType: "span", children: strings.cardCount(count) })] })] }), isCollapsed ? null : (_jsx(BoardCells, { model: model, lane: lane.id, laneTitleId: titleId, options: options }))] }));
}
//# sourceMappingURL=board-lane.js.map