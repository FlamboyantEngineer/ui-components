'use client';

import { type CSSProperties, memo, type ReactNode } from 'react';
import { measuredProperty } from '../../core/hooks.js';
import { Button as AriaButton, Cell, type CellRenderProps } from '../../primitives/index.js';
import { readOwn } from '../../utils/read-own.js';
import { DragHandle } from '../drag-handle/drag-handle.js';
import { useExpandGlyph } from '../expand-toggle/expand-toggle.js';
import { Icon } from '../icon/icon.js';
import { TableCellEditorView } from './table-cell-editor.js';
import { tableHooks as hooks } from './table-hooks.js';
import type { TableRowModel } from './table-row-model.js';
import { getCellValue, type TableColumn, type TableRow } from './table-rows.js';
import { renderCellElement } from './table-spanning-row.js';
import { getCellWrap, getColumnPin, getPinStyle } from './table-structure.js';
import { isEditingCell } from './use-cell-editing.js';

/**
 * A cell's content: the column's `renderCell`, or its value as text. React Aria calls a cell's
 * children again on every change of the table's state, such as focus or selection moving, so the
 * content draws again only when the row or the column object changes.
 */
const TableCellContent = memo(function TableCellContent({
  row,
  column,
}: {
  row: TableRow;
  column: TableColumn<TableRow>;
}): ReactNode {
  if (column.renderCell) return column.renderCell(row);
  const value = getCellValue(row, column);
  return typeof value === 'string' || typeof value === 'number' ? value : null;
});

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
  const style = isTree
    ? ({ level }: CellRenderProps): CSSProperties => ({
        ...pinStyle,
        ...measuredProperty('table-level', String(level)),
      })
    : pinStyle;
  return (
    <Cell
      style={style}
      render={renderCellElement(model.structure.isVirtualized)}
      {...hooks.slot('cell', {
        kind: 'data',
        align: column.align ?? 'start',
        wrap: getCellWrap(model.structure, column),
        column: column.id,
        pinned: pin,
        editing: isEditing,
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
            <TableCellEditorView row={row} column={column} editing={model.editing} />
          ) : (
            <TableCellContent row={row} column={column as TableColumn<TableRow>} />
          )}
        </>
      )}
    </Cell>
  );
}
