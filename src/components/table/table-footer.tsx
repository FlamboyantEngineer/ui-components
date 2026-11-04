'use client';

import type { JSX, ReactNode } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { Cell, Row, TableFooter as AriaTableFooter } from '../../primitives/index.js';
import { readOwn } from '../../utils/read-own.js';
import { tableHooks as hooks } from './table-hooks.js';
import type { TableRow } from './table-rows.js';
import { renderCellElement, renderNamedRow } from './table-spanning-row.js';
import {
  actionsColumnId,
  countTableColumns,
  getCellWrap,
  getColumnPin,
  getPinStyle,
  selectionColumnId,
  type TableStructure,
} from './table-structure.js';
import type { TablePinOffsets } from './use-pinned-offsets.js';

interface TableFooterProps<T> {
  structure: TableStructure<T>;
  /** Every row the table presents, across pages. */
  rows: readonly T[];
  pinOffsets: TablePinOffsets;
  trailingContent?: ReactNode;
  showSummary: boolean;
}

/** The key of the summary row, kept out of row actions, selection and moves. */
const footerRowId = 'ui-table-footer';

type RowElementProps = JSX.IntrinsicElements['tr' | 'div'];

/**
 * React Aria numbers a tree grid's summary row among the tree's rows with a negative position,
 * which is not a valid one: the row draws without a position in the tree. It is named "Summary",
 * not by its row header cell, which a column without a footer leaves empty.
 */
function createFooterRow(isVirtualized: boolean, name: string) {
  const renderRow = renderNamedRow(isVirtualized, name);
  return ({ 'aria-posinset': _position, 'aria-setsize': _size, ...props }: RowElementProps) =>
    renderRow(props);
}

/** Whether any drawn column has a summary cell. */
export function hasTableFooter<T>(structure: TableStructure<T>): boolean {
  return structure.columns.some((column) => column.renderFooter !== undefined);
}

/**
 * The summary row under the rows: each data column's `renderFooter` from the rows the table
 * presents, and empty cells under the selection and actions columns.
 */
function TableSummaryRow<T extends TableRow>({
  structure,
  rows,
  pinOffsets,
}: Pick<TableFooterProps<T>, 'structure' | 'rows' | 'pinOffsets'>) {
  const strings = useUiStrings();
  const selectionPin = getColumnPin(structure, 'selection');
  const actionsPin = getColumnPin(structure, 'actions');
  return (
    <Row
      id={footerRowId}
      textValue={strings.summary}
      // Focusable so its content stays reachable, never selectable.
      isDisabled
      disabledBehavior="selection"
      className={hooks.slotClass('footer-row')}
      render={createFooterRow(structure.isVirtualized, strings.summary)}
    >
      {structure.hasSelection ? (
        <Cell
          style={getPinStyle(selectionPin, readOwn(pinOffsets, selectionColumnId))}
          {...hooks.slot('footer-cell', { kind: 'selection', pinned: selectionPin })}
        />
      ) : null}
      {structure.columns.map((column) => {
        const pin = getColumnPin(structure, column);
        return (
          <Cell
            key={column.id}
            style={getPinStyle(pin, readOwn(pinOffsets, column.id))}
            {...hooks.slot('footer-cell', {
              kind: 'data',
              align: column.align ?? 'start',
              wrap: getCellWrap(structure, column),
              column: column.id,
              pinned: pin,
            })}
          >
            {column.renderFooter?.(rows)}
          </Cell>
        );
      })}
      {structure.hasActions ? (
        <Cell
          style={getPinStyle(actionsPin, readOwn(pinOffsets, actionsColumnId))}
          {...hooks.slot('footer-cell', { kind: 'actions', pinned: actionsPin })}
        />
      ) : null}
    </Row>
  );
}

/** Summary cells and optional ordinary actions remain outside the table's selectable rows. */
export function TableFooter<T extends TableRow>(props: TableFooterProps<T>) {
  const strings = useUiStrings();
  const { structure, trailingContent } = props;
  return (
    <AriaTableFooter className={hooks.slotClass('footer')}>
      {props.showSummary && hasTableFooter(structure) ? <TableSummaryRow {...props} /> : null}
      {trailingContent !== undefined ? (
        <Row
          id="ui-table-action"
          textValue={strings.actions}
          isDisabled
          disabledBehavior="selection"
          className={hooks.slotClass('action-row')}
          render={createFooterRow(structure.isVirtualized, strings.actions)}
        >
          <Cell
            colSpan={countTableColumns(structure)}
            className={hooks.slotClass('action-cell')}
            render={renderCellElement(structure.isVirtualized)}
          >
            {trailingContent}
          </Cell>
        </Row>
      ) : null}
    </AriaTableFooter>
  );
}
