'use client';

import type { CSSProperties, ReactNode } from 'react';
import { measuredProperty } from '../../core/hooks.js';
import { Button as AriaButton, Cell, type CellRenderProps } from '../../primitives/index.js';
import { readOwn } from '../../utils/read-own.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { DragHandle } from '../drag-handle/drag-handle.js';
import { useExpandGlyph } from '../expand-toggle/expand-toggle.js';
import { Icon } from '../icon/icon.js';
import { TableCellEditorView } from './table-cell-editor.js';
import { placeInBounds } from './table-cell-range.js';
import { tableHooks as hooks } from './table-hooks.js';
import type { TableCellsView, TableRowModel } from './table-row-model.js';
import { getCellValue, type TableColumn, type TableRow } from './table-rows.js';
import { renderCellElement } from './table-spanning-row.js';
import { getCellWrap, getColumnPin, getPinStyle } from './table-structure.js';
import { isEditingCell } from './use-cell-editing.js';

function renderCellContent<T extends TableRow>(row: T, column: TableColumn<T>): ReactNode {
  if (column.renderCell) return column.renderCell(row);
  const value = getCellValue(row, column);
  return typeof value === 'string' || typeof value === 'number' ? value : null;
}

/**
 * The expand button of a row with child or detail rows, named by React Aria after the row
 * (`Expand <row>`, `Collapse <row>`), or a spacer holding its place.
 */
export function TableExpandButton({
  hasChildItems,
  isExpanded,
}: {
  hasChildItems: boolean;
  isExpanded: boolean;
}) {
  const glyph = useExpandGlyph(isExpanded);
  if (!hasChildItems) return <span {...hooks.slot('expand-spacer')} aria-hidden="true" />;
  return (
    <AriaButton slot="chevron" className={hooks.slotClass('expand')}>
      <Icon icon={glyph} size="sm" />
    </AriaButton>
  );
}

/** Where a cell sits in spreadsheet mode's selected cells and in a dragged fill. */
function describeRangeCell<T extends TableRow>(
  view: TableCellsView<T> | null,
  row: T,
  column: TableColumn<T>,
) {
  const at = {
    row: view?.grid.rowIndex.get(toCollectionKey(row.id)) ?? -1,
    column: view?.grid.columnIndex.get(column.id) ?? -1,
  };
  const place = placeInBounds(view?.bounds ?? null, at);
  const isFillTarget = !place.isInRange && placeInBounds(view?.fillBounds ?? null, at).isInRange;
  const hasFillHandle = view?.mode === 'range' && view.canFill && place.isCorner;
  return { ...place, isFillTarget, hasFillHandle };
}

/** One data cell: its drag handle, expand button, value or editor, and range marks. */
export function TableDataCell<T extends TableRow>(props: {
  row: T;
  column: TableColumn<T>;
  isFirst: boolean;
  model: TableRowModel<T>;
}) {
  const { row, column, isFirst, model } = props;
  const pin = getColumnPin(model.structure, column);
  const pinStyle = getPinStyle(pin, readOwn(model.pinOffsets, column.id));
  const isTree = model.structure.treeColumn === column.id;
  const isEditing = isEditingCell(model.editing.editing, row, column.id);
  const range = describeRangeCell(model.cells, row, column);
  const style = isTree
    ? ({ level }: CellRenderProps): CSSProperties => ({
        ...pinStyle,
        ...measuredProperty('table-level', String(level)),
      })
    : pinStyle;
  return (
    <Cell
      style={style}
      render={renderCellElement(model.structure.isVirtualized, range.isInRange)}
      {...hooks.slot('cell', {
        kind: 'data',
        align: column.align ?? 'start',
        wrap: getCellWrap(model.structure, column),
        column: column.id,
        pinned: pin,
        editing: isEditing,
        inRange: range.isInRange,
        rangeTop: range.isTop,
        rangeBottom: range.isBottom,
        rangeStart: range.isStart,
        rangeEnd: range.isEnd,
        fillTarget: range.isFillTarget,
      })}
    >
      {(values) => (
        <>
          {model.isReorderable && isFirst && (!model.hideFixedHandles || model.isMovable(row)) ? (
            <DragHandle
              className={hooks.slotClass('drag-handle')}
              isDisabled={!model.isMovable(row)}
            />
          ) : null}
          {isTree ? <TableExpandButton {...values} /> : null}
          {isEditing ? (
            <TableCellEditorView
              row={row}
              column={column}
              editing={model.editing}
              movesOnCommit={model.cells !== null}
            />
          ) : (
            renderCellContent(row, column)
          )}
          {range.hasFillHandle ? (
            <span className={hooks.slotClass('fill-handle')} aria-hidden="true" />
          ) : null}
        </>
      )}
    </Cell>
  );
}
