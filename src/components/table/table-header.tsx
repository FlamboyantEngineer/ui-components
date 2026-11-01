'use client';

import { CheckGlyph, MinusGlyph } from '../../core/glyphs.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { useContext, useLayoutEffect, type ReactNode } from 'react';
import {
  Checkbox as AriaCheckbox,
  Column,
  TableColumnResizeStateContext,
  TableHeader as AriaTableHeader,
  TableStateContext,
} from '../../primitives/index.js';
import type { SortDescriptor } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Icon } from '../icon/icon.js';
import { useScrollRegionHeaderRef } from '../scroll-region/scroll-region.js';
import { getColumnSizing, resolveColumnWidth, type TableColumnWidths } from './column-sizing.js';
import { DataColumn, type TableColumnHeaderState } from './table-column.js';
import type { TableColumnGroup } from './table-columns.js';
import { createGroupedHeader, hasGroupRow } from './table-group-header.js';
import { tableHooks as hooks } from './table-hooks.js';
import type { TableColumn, TableColumnPin } from './table-rows.js';
import {
  actionsColumnId,
  getColumnPin,
  getPinStyle,
  getRowHeaderColumns,
  selectionColumnId,
  type TableStructure,
} from './table-structure.js';
import type { TableColumnDrag } from './use-column-reorder.js';
import { computePinOffsets, type TablePinOffsets } from './use-pinned-offsets.js';
import { readOwn } from '../../utils/read-own.js';

/** What the header row shows: widths, groups, pins, the sort, drops and filters. */
export interface TableHeaderModel<T> {
  widths: TableColumnWidths;
  contentWidths: Readonly<Record<string, number>>;
  /** Group headers drawn in a row above the column headers; empty draws none. */
  groups: readonly TableColumnGroup[];
  /** A virtualized table's row height, which its group header row takes. */
  rowHeight: number;
  pinOffsets: TablePinOffsets;
  /** Takes the pinned offsets the header measures. */
  onPinOffsets: (offsets: TablePinOffsets) => void;
  /** The sorted columns in priority order. */
  sort: readonly SortDescriptor[];
  /** Several columns can sort at once, so sorted headers show their priority. */
  isMultipleSort: boolean;
  /** The shared column drag, or null while no column reorders. */
  columnDrag: TableColumnDrag | null;
  /** The filter button of a filterable column, else null. */
  renderFilter: (column: TableColumn<T>) => ReactNode;
  isFiltered: (column: TableColumn<T>) => boolean;
}

interface TableHeaderProps<T> {
  structure: TableStructure<T>;
  model: TableHeaderModel<T>;
}

const selectionColumnWidth = 44;

/** The pin of every drawn column, fixed ones included, by column key. */
function collectPins<T>(structure: TableStructure<T>): Record<string, TableColumnPin | undefined> {
  // No prototype: a column id such as `__proto__` is a key like any other.
  const pins: Record<string, TableColumnPin | undefined> = Object.create(null) as Record<
    string,
    TableColumnPin | undefined
  >;
  pins[selectionColumnId] = getColumnPin(structure, 'selection');
  pins[actionsColumnId] = getColumnPin(structure, 'actions');
  for (const column of structure.columns) pins[column.id] = getColumnPin(structure, column);
  return pins;
}

/**
 * Reports the pinned offsets from React Aria's column widths. It renders inside the header, so it
 * follows every layout React Aria draws, live during a resize.
 */
function PinnedOffsetsProbe({
  pins,
  onMeasure,
}: {
  pins: Readonly<Record<string, TableColumnPin | undefined>>;
  onMeasure: (offsets: TablePinOffsets) => void;
}) {
  const state = useContext(TableStateContext);
  const layout = useContext(TableColumnResizeStateContext);
  const offsets = computePinOffsets(
    (state?.collection.columns ?? []).map((column) => ({
      key: String(fromCollectionKey(column.key)),
      width: layout?.getColumnWidth(column.key) ?? 0,
      pin: readOwn(pins, String(fromCollectionKey(column.key))),
    })),
  );
  useLayoutEffect(() => onMeasure(offsets));
  return null;
}

function FixedColumn({
  id,
  kind,
  width,
  pin,
  pinOffset,
  children,
}: {
  id: string;
  kind: 'selection' | 'actions';
  width: number;
  pin: TableColumnPin | undefined;
  pinOffset: number | undefined;
  children: ReactNode;
}) {
  return (
    <Column
      id={id}
      width={width}
      minWidth={width}
      maxWidth={width}
      style={getPinStyle(pin, pinOffset)}
      {...hooks.slot('column', { kind, pinned: pin })}
    >
      {children}
    </Column>
  );
}

/** The selection checkbox of a row, or the select-all checkbox of the header. */
export function TableCheckbox() {
  return (
    <AriaCheckbox slot="selection" className={hooks.slotClass('checkbox')}>
      {({ isSelected, isIndeterminate }) => {
        const glyph = isIndeterminate ? MinusGlyph : isSelected ? CheckGlyph : null;
        return (
          <span {...hooks.slot('checkbox-box')}>
            {glyph ? <Icon icon={glyph} size="sm" /> : null}
          </span>
        );
      }}
    </AriaCheckbox>
  );
}

/** What one data column header shows, from the header model. */
function getHeaderState<T>(
  column: TableColumn<T>,
  { structure, model }: TableHeaderProps<T>,
): TableColumnHeaderState {
  const pin = getColumnPin(structure, column);
  const sortIndex = model.sort.findIndex((descriptor) => descriptor.column === column.id);
  return {
    width: resolveColumnWidth(
      column,
      readOwn(model.widths, column.id),
      readOwn(model.contentWidths, column.id),
    ),
    sizing: getColumnSizing(column, readOwn(model.widths, column.id)),
    isVirtualized: structure.isVirtualized,
    isRowHeader: getRowHeaderColumns(structure.columns).includes(column),
    pin,
    pinOffset: pin ? readOwn(model.pinOffsets, column.id) : undefined,
    sortDirection: model.sort[sortIndex]?.direction,
    sortPriority: model.isMultipleSort && sortIndex !== -1 ? sortIndex + 1 : undefined,
    drag: model.columnDrag,
    isFiltered: model.isFiltered(column),
    filter: model.renderFilter(column),
    probe: null,
  };
}

/**
 * The header: an optional row of group headers, then the select-all checkbox, the data columns and
 * the actions column.
 */
export function TableHeader<T>(props: TableHeaderProps<T>) {
  const strings = useUiStrings();
  const headerRef = useScrollRegionHeaderRef();
  const { structure, model } = props;
  const hasGroups = hasGroupRow(model.groups);
  const selectionPin = getColumnPin(structure, 'selection');
  const actionsPin = getColumnPin(structure, 'actions');
  const pins = collectPins(structure);
  const probe = Object.values(pins).some(Boolean) ? (
    <PinnedOffsetsProbe pins={pins} onMeasure={model.onPinOffsets} />
  ) : null;
  return (
    <AriaTableHeader
      ref={headerRef}
      className={hooks.slotClass('header')}
      render={hasGroups ? createGroupedHeader(props) : undefined}
    >
      {structure.hasSelection ? (
        <FixedColumn
          id={selectionColumnId}
          kind="selection"
          width={selectionColumnWidth}
          pin={selectionPin}
          pinOffset={readOwn(model.pinOffsets, selectionColumnId)}
        >
          <TableCheckbox />
        </FixedColumn>
      ) : null}
      {structure.columns.map((column, index) => (
        <DataColumn
          key={column.id}
          column={column}
          state={{ ...getHeaderState(column, props), probe: index === 0 ? probe : null }}
        />
      ))}
      {structure.hasActions ? (
        <FixedColumn
          id={actionsColumnId}
          kind="actions"
          width={structure.actionsColumnWidth}
          pin={actionsPin}
          pinOffset={readOwn(model.pinOffsets, actionsColumnId)}
        >
          <span {...hooks.slot('column-label')}>{strings.rowActions}</span>
        </FixedColumn>
      ) : null}
    </AriaTableHeader>
  );
}
