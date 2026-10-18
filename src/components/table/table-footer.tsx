import type { JSX } from 'react';
import { Cell, Row, TableFooter as AriaTableFooter } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { tableHooks as hooks } from './table-hooks.js';
import type { TableRow } from './table-rows.js';
import {
  actionsColumnId,
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
}

/** The key of the summary row, kept out of row actions, selection and moves. */
export const footerRowId = 'ui-table-footer';

type RowElementProps = JSX.IntrinsicElements['tr' | 'div'];

/**
 * React Aria numbers a tree grid's summary row among the tree's rows with a negative position,
 * which is not a valid one: the row draws without a position in the tree.
 */
function createFooterRow(isVirtualized: boolean) {
  return ({ 'aria-posinset': _position, 'aria-setsize': _size, ...props }: RowElementProps) =>
    isVirtualized ? (
      <div {...(props as JSX.IntrinsicElements['div'])} />
    ) : (
      <tr {...(props as JSX.IntrinsicElements['tr'])} />
    );
}

/** Whether any drawn column has a summary cell. */
export function hasTableFooter<T>(structure: TableStructure<T>): boolean {
  return structure.columns.some((column) => column.renderFooter !== undefined);
}

/**
 * The summary row under the rows: each data column's `renderFooter` from the rows the table
 * presents, and empty cells under the selection and actions columns.
 */
export function TableFooter<T extends TableRow>({
  structure,
  rows,
  pinOffsets,
}: TableFooterProps<T>) {
  const strings = useUiStrings();
  const selectionPin = getColumnPin(structure, 'selection');
  const actionsPin = getColumnPin(structure, 'actions');
  return (
    <AriaTableFooter className={hooks.slotClass('footer')}>
      <Row
        id={footerRowId}
        textValue={strings.summary}
        // Focusable so its content stays reachable, never selectable.
        isDisabled
        disabledBehavior="selection"
        className={hooks.slotClass('footer-row')}
        render={createFooterRow(structure.isVirtualized)}
      >
        {structure.hasSelection ? (
          <Cell
            style={getPinStyle(selectionPin, pinOffsets[selectionColumnId])}
            {...hooks.slot('footer-cell', { kind: 'selection', pinned: selectionPin })}
          />
        ) : null}
        {structure.columns.map((column) => {
          const pin = getColumnPin(structure, column);
          return (
            <Cell
              key={column.id}
              style={getPinStyle(pin, pinOffsets[column.id])}
              {...hooks.slot('footer-cell', {
                kind: 'data',
                align: column.align ?? 'start',
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
            style={getPinStyle(actionsPin, pinOffsets[actionsColumnId])}
            {...hooks.slot('footer-cell', { kind: 'actions', pinned: actionsPin })}
          />
        ) : null}
      </Row>
    </AriaTableFooter>
  );
}
