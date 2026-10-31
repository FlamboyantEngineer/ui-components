'use client';

import {
  SortAscendingGlyph,
  SortDescendingGlyph,
  SortNoneGlyph,
  type GlyphComponent,
} from '../../core/glyphs.js';
import type { ReactNode } from 'react';
import { Column, ColumnResizer } from '../../primitives/index.js';
import type { SortDirection } from '../../core/props.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { useUiStrings } from '../../core/provider.js';
import { Icon } from '../icon/icon.js';
import { getColumnBounds, type TableColumnSize } from './column-sizing.js';
import { tableHooks as hooks } from './table-hooks.js';
import { getColumnText } from './table-columns.js';
import { useColumnDrag } from './use-column-drag.js';
import type { TableColumnDrag } from './use-column-reorder.js';
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
  /** The table's shared column drag, or null while no column reorders. */
  drag: TableColumnDrag | null;
  isFiltered: boolean;
  /** The filter button, for a filterable column. */
  filter: ReactNode;
  /** Measures the drawn columns from inside the header; the first data column holds it. */
  probe: ReactNode;
}

const sortGlyphs: Readonly<Record<SortDirection | 'none', GlyphComponent>> = {
  ascending: SortAscendingGlyph,
  descending: SortDescendingGlyph,
  none: SortNoneGlyph,
};

/**
 * One data column header: its content (the label, which drags a reorderable column, the sort glyph
 * and the filter button), which takes another column dropped on it, and the resizer, with its pin,
 * sort, filter and drop states.
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
  const isReorderable = column.allowsReordering === true;
  const drag = useColumnDrag({
    id: column.id,
    textValue: getColumnText(column),
    allowsReordering: isReorderable,
    drag: state.drag,
  });
  return (
    <Column
      id={toCollectionKey(column.id)}
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
        dropPosition: drag.dropPosition ?? undefined,
        dragging: drag.isDragging,
        allowsReordering: column.allowsReordering,
      })}
    >
      <div ref={drag.ref} {...drag.targetProps} {...hooks.slot('column-content')}>
        <span {...(isReorderable ? drag.sourceProps : {})} {...hooks.slot('column-label')}>
          {column.header}
        </span>
        {column.allowsSorting ? (
          <Icon
            icon={sortGlyphs[state.sortDirection ?? 'none']}
            size="sm"
            className={hooks.slotClass('sort-icon')}
          />
        ) : null}
        {state.filter}
      </div>
      {column.allowsResizing ? (
        <ColumnResizer className={hooks.slotClass('resizer')} aria-label={strings.resize} />
      ) : null}
      {state.probe}
    </Column>
  );
}
