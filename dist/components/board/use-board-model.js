import { useId, useMemo } from 'react';
import { createBoardLayout, getCellCards } from './board-moves.js';
import { useCollapsedKeys } from './use-board-collapse.js';
function sum(values) {
    let total = 0;
    for (const value of values)
        total += value;
    return total;
}
function useLaneKeys(lanes) {
    return useMemo(() => (lanes ? lanes.map((lane) => lane.id) : [null]), [lanes]);
}
/** The board's cells, counts and collapsed columns and lanes, from its props. */
export function useBoardModel(props) {
    const { columns, lanes, items, getColumn, getLane, persistKey } = props;
    const baseId = useId();
    const collapsedColumns = useCollapsedKeys({
        value: props.collapsedColumns,
        defaultValue: props.defaultCollapsedColumns,
        onChange: props.onCollapsedColumnsChange,
        storageKey: persistKey && `${persistKey}:columns`,
    });
    const collapsedLanes = useCollapsedKeys({
        value: props.collapsedLanes,
        defaultValue: props.defaultCollapsedLanes,
        onChange: props.onCollapsedLanesChange,
        storageKey: persistKey && `${persistKey}:lanes`,
    });
    const columnKeys = useMemo(() => columns.map((column) => column.id), [columns]);
    const laneKeys = useLaneKeys(lanes);
    const layout = useMemo(() => createBoardLayout({
        columns: columnKeys,
        lanes: laneKeys,
        collapsedColumns: collapsedColumns.keys,
        items,
        getKey: (item) => item.id,
        getColumn,
        getLane: lanes ? getLane : undefined,
    }), [columnKeys, laneKeys, lanes, collapsedColumns.keys, items, getColumn, getLane]);
    const itemsByKey = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
    const countColumn = (column) => sum([...(layout.cells.get(column)?.values() ?? [])].map((keys) => keys.length));
    return {
        columns,
        columnKeys,
        layout,
        itemsByKey,
        collapsedColumns,
        collapsedLanes,
        columnTitleId: (index) => `${baseId}-column-${index}`,
        laneTitleId: (index) => `${baseId}-lane-${index}`,
        countColumn,
        countLane: (lane) => sum(columnKeys.map((column) => getCellCards(layout, { column, lane }).length)),
        isOverLimit: (column) => column.limit !== undefined && countColumn(column.id) > column.limit,
        getCellItems: (column, lane) => getCellCards(layout, { column, lane }).flatMap((key) => itemsByKey.get(key) ?? []),
    };
}
//# sourceMappingURL=use-board-model.js.map