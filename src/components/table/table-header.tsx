import type { ReactNode } from 'react';
import {
  Checkbox as AriaCheckbox,
  Column,
  ColumnResizer,
  TableHeader as AriaTableHeader,
  type SortDirection,
} from 'react-aria-components';
import type { GlyphName } from '../../core/glyphs.js';
import { useUiStrings } from '../../core/provider.js';
import { Icon } from '../icon/icon.js';
import { getColumnBounds, resolveColumnWidth, type TableColumnWidths } from './column-sizing.js';
import { tableHooks as hooks } from './table-hooks.js';
import type { TableColumn } from './table-rows.js';

/** Which columns a table draws around its data columns. */
export interface TableStructure<T> {
  columns: readonly TableColumn<T>[];
  hasSelection: boolean;
  hasActions: boolean;
  actionsColumnWidth: number;
}

interface TableHeaderProps<T> {
  structure: TableStructure<T>;
  widths: TableColumnWidths;
}

const selectionColumnWidth = 44;
const sortGlyphs: Readonly<Record<SortDirection | 'none', GlyphName>> = {
  ascending: 'sort-ascending',
  descending: 'sort-descending',
  none: 'sort-none',
};

/** The accessible name of a column. */
function getColumnText<T>(column: TableColumn<T>): string {
  if (column.textValue) return column.textValue;
  const { header } = column;
  return typeof header === 'string' || typeof header === 'number' ? String(header) : column.id;
}

/** The columns that name a row: those marked `isRowHeader`, else the first. */
export function getRowHeaderColumns<T>(
  columns: readonly TableColumn<T>[],
): readonly TableColumn<T>[] {
  const marked = columns.filter((column) => column.isRowHeader);
  return marked.length > 0 ? marked : columns.slice(0, 1);
}

/** The number of columns a row spans: data columns plus the selection and actions columns. */
export function countTableColumns<T>(structure: TableStructure<T>): number {
  return structure.columns.length + Number(structure.hasSelection) + Number(structure.hasActions);
}

function FixedColumn({
  id,
  kind,
  width,
  children,
}: {
  id: string;
  kind: 'selection' | 'actions';
  width: number;
  children: ReactNode;
}) {
  return (
    <Column
      id={id}
      width={width}
      minWidth={width}
      maxWidth={width}
      {...hooks.slot('column', { kind })}
    >
      {children}
    </Column>
  );
}

function DataColumn<T>({
  column,
  width,
  isRowHeader,
}: {
  column: TableColumn<T>;
  width: TableColumnWidths[string];
  isRowHeader: boolean;
}) {
  const strings = useUiStrings();
  const text = getColumnText(column);
  return (
    <Column
      id={column.id}
      textValue={text}
      isRowHeader={isRowHeader}
      allowsSorting={column.allowsSorting}
      width={width}
      {...getColumnBounds(column)}
      // A resizer is a focusable child: focus the header itself so Enter still sorts.
      focusMode={column.allowsResizing ? 'cell' : undefined}
      {...hooks.slot('column', { kind: 'data', align: column.align ?? 'start', column: column.id })}
    >
      {({ sortDirection }) => (
        <>
          <span {...hooks.slot('column-label')}>{column.header}</span>
          {column.allowsSorting ? (
            <Icon
              glyph={sortGlyphs[sortDirection ?? 'none']}
              size="sm"
              className={hooks.slotClass('sort-icon')}
            />
          ) : null}
          {column.allowsResizing ? (
            <ColumnResizer className={hooks.slotClass('resizer')} aria-label={strings.resize} />
          ) : null}
        </>
      )}
    </Column>
  );
}

/** The selection checkbox of a row, or the select-all checkbox of the header. */
export function TableCheckbox() {
  return (
    <AriaCheckbox slot="selection" className={hooks.slotClass('checkbox')}>
      {({ isSelected, isIndeterminate }) => {
        const glyph = isIndeterminate ? 'minus' : isSelected ? 'check' : null;
        return (
          <span {...hooks.slot('checkbox-box')}>
            {glyph ? <Icon glyph={glyph} size="sm" /> : null}
          </span>
        );
      }}
    </AriaCheckbox>
  );
}

/** The header row: the select-all checkbox, the data columns and the actions column. */
export function TableHeader<T>({ structure, widths }: TableHeaderProps<T>) {
  const strings = useUiStrings();
  const { columns } = structure;
  const rowHeaders = getRowHeaderColumns(columns);
  return (
    <AriaTableHeader className={hooks.slotClass('header')}>
      {structure.hasSelection ? (
        <FixedColumn id="ui-table-selection" kind="selection" width={selectionColumnWidth}>
          <TableCheckbox />
        </FixedColumn>
      ) : null}
      {columns.map((column) => (
        <DataColumn
          key={column.id}
          column={column}
          width={resolveColumnWidth(column, widths[column.id])}
          isRowHeader={rowHeaders.includes(column)}
        />
      ))}
      {structure.hasActions ? (
        <FixedColumn id="ui-table-actions" kind="actions" width={structure.actionsColumnWidth}>
          <span {...hooks.slot('column-label')}>{strings.rowActions}</span>
        </FixedColumn>
      ) : null}
    </AriaTableHeader>
  );
}
