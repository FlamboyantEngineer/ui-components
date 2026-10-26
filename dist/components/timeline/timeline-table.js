import { jsx as _jsx } from "react/jsx-runtime";
import { useDateFormatter, useNumberFormatter } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { clamp } from '../../utils/clamp.js';
import { Table } from '../table/table.js';
import { readTimelineItem } from './timeline-geometry.js';
import { timelineHooks as hooks } from './timeline-hooks.js';
import { flattenTimelineRows } from './timeline-rows.js';
function toEntries(rows, items) {
    const rowOrder = flattenTimelineRows(rows);
    const rowIndex = new Map(rowOrder.map((entry, index) => [entry.row.id, index]));
    return items
        .flatMap((item) => {
        const read = readTimelineItem(item);
        const index = rowIndex.get(item.rowId);
        if (!read || index === undefined)
            return [];
        const progress = read.kind === 'bar' ? item.progress : undefined;
        const entry = { id: item.id, name: item.label, row: rowOrder[index].row.label, progress };
        return [
            { index, entry: { ...entry, start: read.start, end: read.kind === 'bar' ? read.end : '' } },
        ];
    })
        .sort((a, b) => a.index - b.index || a.entry.start.localeCompare(b.entry.start))
        .map(({ entry }) => entry);
}
function useColumns() {
    const strings = useUiStrings();
    const days = useDateFormatter({ dateStyle: 'medium', timeZone: 'UTC' });
    const percent = useNumberFormatter({ style: 'percent' });
    const day = (date) => (date ? days.format(new Date(date)) : '');
    return [
        { id: 'name', header: strings.timelineItemColumn, isRowHeader: true, allowsSorting: true },
        { id: 'row', header: strings.timelineRowColumn, allowsSorting: true },
        {
            id: 'start',
            header: strings.timelineStartColumn,
            allowsSorting: true,
            renderCell: (entry) => day(entry.start),
        },
        {
            id: 'end',
            header: strings.timelineEndColumn,
            allowsSorting: true,
            renderCell: (entry) => day(entry.end),
        },
        {
            id: 'progress',
            header: strings.timelineProgressColumn,
            align: 'end',
            getValue: (entry) => entry.progress ?? null,
            renderCell: (entry) => entry.progress === undefined ? '' : percent.format(clamp(entry.progress, 0, 1)),
        },
    ];
}
/**
 * The table view of a timeline's items, in row order and then by first day: the same items and
 * selection as the chart, read as a sortable table.
 */
export function TimelineTable({ label, labelledBy, rows, items, selectionMode, selectedKeys, onSelectionChange, }) {
    return (_jsx(Table, { className: hooks.slotClass('table'), "aria-label": label, "aria-labelledby": labelledBy, columns: useColumns(), rows: toEntries(rows, items), selectionMode: selectionMode, selectedKeys: selectedKeys, onSelectionChange: onSelectionChange }));
}
//# sourceMappingURL=timeline-table.js.map