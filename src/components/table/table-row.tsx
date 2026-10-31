'use client';

import type { JSX, ReactNode } from 'react';
import { Cell, Collection, Row } from '../../primitives/index.js';
import { pickDataAttributes } from '../../core/hooks.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import type { TableRowAttributes } from './table.js';
import { TableDataCell } from './table-data-cell.js';
import { TableCheckbox } from './table-header.js';
import { tableHooks as hooks } from './table-hooks.js';
import type { TableRowModel } from './table-row-model.js';
import { getRowText, type TableRow } from './table-rows.js';
import { renderCellElement, TableSpanningRow } from './table-spanning-row.js';
import {
  actionsColumnId,
  countTableColumns,
  getColumnPin,
  getPinStyle,
  getRowHeaderColumns,
  selectionColumnId,
} from './table-structure.js';
import type { TableNode } from './table-tree.js';

/** A row's caller attributes: `false` leaves an attribute out, unlike a root `data-*` prop. */
function toRowAttributes(attributes: TableRowAttributes | undefined) {
  const shown = Object.entries(attributes ?? {}).filter(([, value]) => value !== false);
  return pickDataAttributes(Object.fromEntries(shown));
}

/** The key prefix of detail rows, kept out of row actions, selection and moves. */
const detailRowPrefix = 'ui-table-detail:';

/** A row element without React Aria's `draggable`, so only its handle starts a pointer drag. */
function createHandleRow(isVirtualized: boolean) {
  return ({ draggable: _draggable, ...props }: JSX.IntrinsicElements['tr' | 'div']) =>
    isVirtualized ? (
      <div {...(props as JSX.IntrinsicElements['div'])} />
    ) : (
      <tr {...(props as JSX.IntrinsicElements['tr'])} />
    );
}

/** A full-width row under its parent, holding the parent's detail content. */
function TableDetailRow<T extends TableRow>(props: {
  row: T;
  model: TableRowModel<T>;
  children: ReactNode;
}) {
  const { row, model } = props;
  // Focusable so controls in the detail stay reachable, never selectable.
  return (
    <TableSpanningRow
      id={`${detailRowPrefix}${toCollectionKey(row.id)}`}
      textValue={getRowText(row, getRowHeaderColumns(model.structure.columns))}
      isVirtualized={model.structure.isVirtualized}
      colSpan={countTableColumns(model.structure)}
      rowHooks={{ className: hooks.slotClass('detail-row') }}
      cellClassName={hooks.slotClass('detail-cell')}
    >
      {props.children}
    </TableSpanningRow>
  );
}

/** One row with its cells, then its detail row and its child rows. */
export function TableDataRow<T extends TableRow>({
  id,
  node,
  model,
}: {
  id: string;
  node: TableNode<T>;
  model: TableRowModel<T>;
}) {
  const { row } = node;
  const { structure, renderRowActions } = model;
  const detail = model.renderRowDetail?.(row);
  const selectionPin = getColumnPin(structure, 'selection');
  const actionsPin = getColumnPin(structure, 'actions');
  return (
    <Row
      {...toRowAttributes(model.getRowAttributes?.(row))}
      id={id}
      textValue={getRowText(row, getRowHeaderColumns(structure.columns))}
      {...hooks.slot('row')}
      render={model.dragTrigger === 'handle' ? createHandleRow(structure.isVirtualized) : undefined}
    >
      {structure.hasSelection ? (
        <Cell
          style={getPinStyle(selectionPin, model.pinOffsets[selectionColumnId])}
          render={renderCellElement(structure.isVirtualized)}
          {...hooks.slot('cell', { kind: 'selection', pinned: selectionPin })}
        >
          <TableCheckbox />
        </Cell>
      ) : null}
      {structure.columns.map((column, index) => (
        <TableDataCell
          key={column.id}
          row={row}
          column={column}
          isFirst={index === 0}
          model={model}
        />
      ))}
      {structure.hasActions && renderRowActions ? (
        <Cell
          style={getPinStyle(actionsPin, model.pinOffsets[actionsColumnId])}
          render={renderCellElement(structure.isVirtualized)}
          {...hooks.slot('cell', { kind: 'actions', pinned: actionsPin })}
        >
          {renderRowActions(row)}
        </Cell>
      ) : null}
      {isEmptyNode(detail) ? null : (
        <TableDetailRow row={row} model={model}>
          {detail}
        </TableDetailRow>
      )}
      {node.children.length > 0 ? (
        <Collection items={node.children} dependencies={[model]}>
          {(child) => <TableDataRow id={toCollectionKey(child.id)} node={child} model={model} />}
        </Collection>
      ) : null}
    </Row>
  );
}
