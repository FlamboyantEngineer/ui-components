import type { ReactNode } from 'react';
import { Button as AriaButton, Cell, Row, TableBody as AriaTableBody } from 'react-aria-components';
import { EmptyState } from '../empty-state/empty-state.js';
import { Icon } from '../icon/icon.js';
import { InlineError } from '../inline-error/inline-error.js';
import {
  countTableColumns,
  getRowHeaderColumns,
  TableCheckbox,
  type TableStructure,
} from './table-header.js';
import { tableHooks as hooks } from './table-hooks.js';
import { getCellValue, getRowText, type TableColumn, type TableRow } from './table-rows.js';

/** The notice a table shows in place of its rows. */
export type TableStatus = 'loading' | 'empty' | 'error';

/** The rows, or the notice that replaces them. */
export interface TableBodyProps<T> {
  rows: readonly T[];
  structure: TableStructure<T>;
  status: TableStatus | null;
  /** The notice's text or content. */
  message: ReactNode;
  onRetry?: (() => void | Promise<unknown>) | undefined;
  renderRowActions?: ((row: T) => ReactNode) | undefined;
  /** Draws drag handles; `isMovable` tells which are enabled. */
  isReorderable: boolean;
  isMovable: (row: T) => boolean;
}

/** The key of the notice row, kept out of row actions. */
export const stateRowId = 'ui-table-state-row';

function renderCellContent<T extends TableRow>(row: T, column: TableColumn<T>): ReactNode {
  if (column.renderCell) return column.renderCell(row);
  const value = getCellValue(row, column);
  return typeof value === 'string' || typeof value === 'number' ? value : null;
}

function TableDataRow<T extends TableRow>({ row, props }: { row: T; props: TableBodyProps<T> }) {
  const { structure, renderRowActions, isReorderable } = props;
  return (
    <Row
      id={row.id}
      textValue={getRowText(row, getRowHeaderColumns(structure.columns))}
      className={hooks.slotClass('row')}
    >
      {structure.hasSelection ? (
        <Cell {...hooks.slot('cell', { kind: 'selection' })}>
          <TableCheckbox />
        </Cell>
      ) : null}
      {structure.columns.map((column, index) => (
        <Cell
          key={column.id}
          {...hooks.slot('cell', {
            kind: 'data',
            align: column.align ?? 'start',
            column: column.id,
          })}
        >
          {isReorderable && index === 0 ? (
            <AriaButton
              slot="drag"
              className={hooks.slotClass('drag-handle')}
              isDisabled={!props.isMovable(row)}
            >
              <Icon glyph="drag-handle" size="sm" />
            </AriaButton>
          ) : null}
          {renderCellContent(row, column)}
        </Cell>
      ))}
      {renderRowActions ? (
        <Cell {...hooks.slot('cell', { kind: 'actions' })}>{renderRowActions(row)}</Cell>
      ) : null}
    </Row>
  );
}

function TableStateRow<T>({ status, props }: { status: TableStatus; props: TableBodyProps<T> }) {
  const { message, onRetry } = props;
  return (
    <Row
      id={stateRowId}
      textValue={typeof message === 'string' ? message : status}
      // Focusable so a retry button stays reachable, never selectable.
      isDisabled
      disabledBehavior="selection"
      {...hooks.slot('state-row', { variant: status })}
    >
      <Cell colSpan={countTableColumns(props.structure)} className={hooks.slotClass('state-cell')}>
        {status === 'error' ? (
          <InlineError onRetry={onRetry}>{message}</InlineError>
        ) : (
          <EmptyState variant={status} size="sm" description={message} />
        )}
      </Cell>
    </Row>
  );
}

/** The table body: one row per item, or one full-width notice row. */
export function TableBody<T extends TableRow>(props: TableBodyProps<T>) {
  const { status, rows, structure, renderRowActions, isReorderable, isMovable } = props;
  if (structure.columns.length === 0) return <AriaTableBody className={hooks.slotClass('body')} />;
  if (status) {
    return (
      <AriaTableBody className={hooks.slotClass('body')}>
        <TableStateRow status={status} props={props} />
      </AriaTableBody>
    );
  }
  return (
    <AriaTableBody
      className={hooks.slotClass('body')}
      items={rows}
      dependencies={[structure, renderRowActions, isReorderable, isMovable]}
    >
      {(row) => <TableDataRow row={row} props={props} />}
    </AriaTableBody>
  );
}
