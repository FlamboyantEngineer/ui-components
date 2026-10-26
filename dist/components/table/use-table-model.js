import { useMemo } from 'react';
import { createCellGrid } from './table-cell-range.js';
import { useCellSelection } from './use-cell-selection.js';
/** What every row and cell renders from, kept stable while its parts are. */
export function useRowModel(options, parts) {
    const { renderRowActions, renderRowDetail, getRowAttributes, reorder, renderGroupLabel } = options;
    const { structure, status, reordering, isGrouped, pinOffsets, cells } = parts;
    const { editing, commit, cancel, release, dismiss } = parts.editing;
    return useMemo(() => ({
        structure,
        renderRowActions,
        renderRowDetail,
        getRowAttributes,
        renderGroupLabel,
        isReorderable: reorder !== undefined && status === null && !isGrouped,
        isMovable: reordering.isMovable,
        dragTrigger: reorder?.dragTrigger ?? 'row',
        pinOffsets,
        editing: { editing, commit, cancel, release, dismiss },
        cells,
    }), [
        structure,
        renderRowActions,
        renderRowDetail,
        getRowAttributes,
        renderGroupLabel,
        reorder,
        status,
        isGrouped,
        reordering.isMovable,
        pinOffsets,
        editing,
        commit,
        cancel,
        release,
        dismiss,
        cells,
    ]);
}
/** Spreadsheet mode's view of the cells, for the visible rows and the drawn columns. */
export function useCellsView(options, parts) {
    const { rows, structure, isRowDisabled } = parts;
    const grid = useMemo(() => createCellGrid(rows, structure.columns), [rows, structure.columns]);
    const selection = useCellSelection({ ...options, grid, isRowDisabled });
    const { mode, bounds, fillBounds } = selection;
    const canFill = bounds !== null &&
        grid.columns.slice(bounds.start, bounds.end + 1).some((column) => column.allowsEditing);
    const view = useMemo(() => (mode === 'none' ? null : { mode, grid, bounds, fillBounds, canFill }), [mode, grid, bounds, fillBounds, canFill]);
    return { view, rootProps: selection.rootProps };
}
/** The selection bar's props, when the table draws one: multiple selection with bulk actions. */
export function resolveSelectionBar(options, parts) {
    const { selectionActions, onCellsChange, selectionMode } = options;
    const { selection, columns } = parts;
    const canEdit = columns.some((column) => column.bulkEdit !== undefined);
    if (selectionMode !== 'multiple' || (!selectionActions && !canEdit))
        return null;
    return {
        actions: selectionActions ?? [],
        columns,
        rows: selection.selectedRows,
        onClearSelection: () => selection.setSelection(new Set()),
        onEdit: (edits) => {
            if (edits.length > 0)
                onCellsChange?.(edits);
        },
    };
}
//# sourceMappingURL=use-table-model.js.map