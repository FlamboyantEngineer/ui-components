import type { ReactNode } from 'react';
import { Column, ColumnResizer, type SortDirection } from '../../primitives/index.js';
import type { GlyphName } from '../../core/glyphs.js';
import { useUiStrings } from '../../core/provider.js';
import { Icon } from '../icon/icon.js';
import { getColumnBounds, type TableColumnSize } from './column-sizing.js';
import { tableHooks as hooks } from './table-hooks.js';
import type { TableColumn, TableColumnPin } from './table-rows.js';
import { getPinStyle } from './table-structure.js';

/** What a data column header shows beyond the column's own declaration. */
export interface TableColumnHeaderState {
  width: TableColumnSize;
  isRowHeader: boolean;
  pin: TableColumnPin | undefined;
  /** The pinned header's distance from its edge, in pixels. */
  pinOffset: number | undefined;
  sortDirection: SortDirection | undefined;
  /** The column's place in a sort by several columns, from 1. */
  sortPriority: number | undefined;
  /** Where a dragged column would land beside this one. */
  dropPosition: 'before' | 'after' | undefined;
  isFiltered: boolean;
  /** The filter button, for a filterable column. */
  filter: ReactNode;
  /** Measures the drawn columns from inside the header; the first data column holds it. */
  probe: ReactNode;
}

const sortGlyphs: Readonly<Record<SortDirection | 'none', GlyphName>> = {
  ascending: 'sort-ascending',
  descending: 'sort-descending',
  none: 'sort-none',
};

/** The accessible name of a column. */
export function getColumnText<T>(column: TableColumn<T>): string {
  if (column.textValue) return column.textValue;
  const { header } = column;
  return typeof header === 'string' || typeof header === 'number' ? String(header) : column.id;
}

/**
 * One data column header: its label, which drags a reorderable column, the sort glyph, the filter
 * button and the resizer, with its pin, sort, filter and drop states.
 */
export function DataColumn<T>({
  column,
  state,
}: {
  column: TableColumn<T>;
  state: TableColumnHeaderState;
}) {
  const strings = useUiStrings();
  const hasControls = column.allowsResizing === true || state.filter !== null;
  return (
    <Column
      id={column.id}
      textValue={getColumnText(column)}
      isRowHeader={state.isRowHeader}
      allowsSorting={column.allowsSorting}
      width={state.width}
      {...getColumnBounds(column)}
      // Focusable children: focus the header itself so Enter still sorts.
      focusMode={hasControls ? 'cell' : undefined}
      style={getPinStyle(state.pin, state.pinOffset)}
      {...hooks.slot('column', {
        kind: 'data',
        align: column.align ?? 'start',
        column: column.id,
        pinned: state.pin,
        sortPriority: state.sortPriority,
        filtered: state.isFiltered,
        dropPosition: state.dropPosition,
        allowsReordering: column.allowsReordering,
      })}
    >
      <span {...hooks.slot('column-label')} draggable={column.allowsReordering || undefined}>
        {column.header}
      </span>
      {column.allowsSorting ? (
        <Icon
          glyph={sortGlyphs[state.sortDirection ?? 'none']}
          size="sm"
          className={hooks.slotClass('sort-icon')}
        />
      ) : null}
      {state.filter}
      {column.allowsResizing ? (
        <ColumnResizer className={hooks.slotClass('resizer')} aria-label={strings.resize} />
      ) : null}
      {state.probe}
    </Column>
  );
}
