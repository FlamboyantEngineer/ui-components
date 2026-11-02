'use client';

import {
  SortAscendingGlyph,
  SortDescendingGlyph,
  SortNoneGlyph,
  type GlyphComponent,
} from '../../core/glyphs.js';
import { isValidElement, useId, type JSX, type ReactNode, type SyntheticEvent } from 'react';
import { Column, ColumnResizer } from '../../primitives/index.js';
import type { SortDirection } from '../../core/props.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { useUiStrings } from '../../core/provider.js';
import { Icon } from '../icon/icon.js';
import { getColumnBounds, type TableColumnWidths } from './column-sizing.js';
import { tableHooks as hooks } from './table-hooks.js';
import { getColumnText } from './table-columns.js';
import { useColumnDrag } from './use-column-drag.js';
import type { TableColumnDrag } from './use-column-reorder.js';
import type { TableColumn, TableColumnPin } from './table-rows.js';
import { getPinStyle } from './table-structure.js';
import { FreeControls } from '../../utils/free-controls.js';
import { TableColumnResizer } from './table-column-resizer.js';
import { keepTextControlKeys } from '../../utils/text-control-keys.js';
import { isInteractiveTarget } from '../../utils/is-interactive-target.js';

/** What a data column header shows beyond the column's own declaration. */
export interface TableColumnHeaderState {
  width: TableColumnWidths[string];
  sizing: 'content' | 'flex' | 'fixed';
  isVirtualized: boolean;
  isRowHeader: boolean;
  pin: TableColumnPin | undefined;
  /** The pinned header's distance from its edge, in pixels. */
  pinOffset: number | undefined;
  /** Previews and keeps a static table's resize; a virtualized table's goes through React Aria. */
  onResize: (width: number) => void;
  onResizeEnd: (width: number) => void;
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

/** A nested control starts no press on the sortable header around it. */
function stopControlPress(event: SyntheticEvent<HTMLElement>) {
  if (isInteractiveTarget(event.target, event.currentTarget)) event.stopPropagation();
}

function TableColumnLabel({ children }: { children: ReactNode }) {
  return (
    <span
      onPointerDown={stopControlPress}
      onMouseDown={stopControlPress}
      onTouchStart={stopControlPress}
      onClick={stopControlPress}
    >
      <FreeControls>{children}</FreeControls>
    </span>
  );
}

/** Leaves a nested field's caret and input keys to the field before grid capture runs. */
function renderColumnElement(isVirtualized: boolean) {
  return (props: JSX.IntrinsicElements['th' | 'div']) => {
    const keyed = keepTextControlKeys(props);
    return isVirtualized ? (
      <div {...(keyed as JSX.IntrinsicElements['div'])} />
    ) : (
      <th {...(keyed as JSX.IntrinsicElements['th'])} />
    );
  };
}

/**
 * A resizable column's resizer: the table's own over a static table's CSS grid tracks, React
 * Aria's over a virtualized table's measured layout.
 */
function ColumnResize<T>({
  column,
  state,
  columnLabelId,
}: {
  column: TableColumn<T>;
  state: TableColumnHeaderState;
  columnLabelId: string;
}) {
  const strings = useUiStrings();
  if (state.isVirtualized) {
    return <ColumnResizer className={hooks.slotClass('resizer')} aria-label={strings.resize} />;
  }
  return (
    <TableColumnResizer
      label={strings.resize}
      columnLabelId={columnLabelId}
      width={typeof state.width === 'number' ? state.width : null}
      {...getColumnBounds(column)}
      onResize={state.onResize}
      onResizeEnd={state.onResizeEnd}
    />
  );
}

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
  const labelId = useId();
  const hasControls =
    column.allowsResizing === true || state.filter !== null || isValidElement(column.header);
  const isReorderable = column.allowsReordering === true;
  const {
    ref: dragRef,
    targetProps,
    sourceProps,
    dropPosition,
    isDragging,
  } = useColumnDrag({
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
      render={renderColumnElement(state.isVirtualized)}
      width={state.width}
      {...getColumnBounds(column)}
      // Focusable children: focus the header itself so Enter still sorts.
      focusMode={hasControls ? 'cell' : undefined}
      style={getPinStyle(state.pin, state.pinOffset)}
      {...hooks.slot('column', {
        kind: 'data',
        align: column.align ?? 'start',
        column: column.id,
        sizing: state.sizing,
        pinned: state.pin,
        sortPriority: state.sortPriority,
        filtered: state.isFiltered,
        dropPosition: dropPosition ?? undefined,
        dragging: isDragging,
        allowsReordering: column.allowsReordering,
      })}
    >
      <div ref={dragRef} {...targetProps} {...hooks.slot('column-content')}>
        <span id={labelId} {...(isReorderable ? sourceProps : {})} {...hooks.slot('column-label')}>
          <TableColumnLabel>{column.header}</TableColumnLabel>
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
        <ColumnResize column={column} state={state} columnLabelId={labelId} />
      ) : null}
      {state.probe}
    </Column>
  );
}
