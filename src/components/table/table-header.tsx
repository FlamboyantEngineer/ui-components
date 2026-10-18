import { useContext, useLayoutEffect, type JSX, type ReactNode } from 'react';
import {
  Checkbox as AriaCheckbox,
  Column,
  TableColumnResizeStateContext,
  TableHeader as AriaTableHeader,
  TableStateContext,
  type SortDescriptor,
} from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { Icon } from '../icon/icon.js';
import { resolveColumnWidth, type TableColumnWidths } from './column-sizing.js';
import { DataColumn, type TableColumnHeaderState } from './table-column.js';
import { groupColumnCells, type TableColumnGroup } from './table-columns.js';
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
import type { TableColumnDropTarget } from './use-column-reorder.js';
import { computePinOffsets, type TablePinOffsets } from './use-pinned-offsets.js';

/** What the header row shows: widths, groups, pins, the sort, drops and filters. */
export interface TableHeaderModel<T> {
  widths: TableColumnWidths;
  /** Group headers drawn in a row above the column headers; empty draws none. */
  groups: readonly TableColumnGroup[];
  pinOffsets: TablePinOffsets;
  /** Takes the pinned offsets the header measures. */
  onPinOffsets: (offsets: TablePinOffsets) => void;
  /** The sorted columns in priority order. */
  sort: readonly SortDescriptor[];
  /** Several columns can sort at once, so sorted headers show their priority. */
  isMultipleSort: boolean;
  dropTarget: TableColumnDropTarget | null;
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
  const pins: Record<string, TableColumnPin | undefined> = {
    [selectionColumnId]: getColumnPin(structure, 'selection'),
    [actionsColumnId]: getColumnPin(structure, 'actions'),
  };
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
      key: String(column.key),
      width: layout?.getColumnWidth(column.key) ?? 0,
      pin: pins[String(column.key)],
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

/** What one data column header shows, from the header model. */
function getHeaderState<T>(
  column: TableColumn<T>,
  { structure, model }: TableHeaderProps<T>,
): TableColumnHeaderState {
  const pin = getColumnPin(structure, column);
  const sortIndex = model.sort.findIndex((descriptor) => descriptor.column === column.id);
  const isDropTarget = model.dropTarget?.id === column.id;
  return {
    width: resolveColumnWidth(column, model.widths[column.id]),
    isRowHeader: getRowHeaderColumns(structure.columns).includes(column),
    pin,
    pinOffset: pin ? model.pinOffsets[column.id] : undefined,
    sortDirection: model.sort[sortIndex]?.direction,
    sortPriority: model.isMultipleSort && sortIndex !== -1 ? sortIndex + 1 : undefined,
    dropPosition: isDropTarget ? model.dropTarget?.position : undefined,
    isFiltered: model.isFiltered(column),
    filter: model.renderFilter(column),
    probe: null,
  };
}

/** Whether the header draws a group row: groups exist and the table is not virtualized. */
export function hasGroupRow<T>(structure: TableStructure<T>, groups: readonly unknown[]): boolean {
  return groups.length > 0 && !structure.isVirtualized;
}

/**
 * The widths of React Aria's columns as layout tracks. A fixed table layout takes its column widths
 * from its first row, which a group row would otherwise decide.
 */
function TableColumnTracks() {
  const state = useContext(TableStateContext);
  const layout = useContext(TableColumnResizeStateContext);
  return (
    <colgroup>
      {(state?.collection.columns ?? []).map((column) => (
        <col key={column.key} style={{ width: layout?.getColumnWidth(column.key) }} />
      ))}
    </colgroup>
  );
}

/** The grid's `table` element with column tracks first, for a table with a group row. */
export function renderTableWithTracks(
  props: JSX.IntrinsicElements['table'] | JSX.IntrinsicElements['div'],
) {
  // Groups draw only in a table element, so the props are a `table`'s.
  return (
    <table {...(props as JSX.IntrinsicElements['table'])}>
      <TableColumnTracks />
      {props.children}
    </table>
  );
}

/** A header element that draws the group header row above React Aria's column row. */
function createGroupedHeader<T>({ structure, model }: TableHeaderProps<T>) {
  const cells = groupColumnCells(structure.columns, model.groups, {
    leading: Number(structure.hasSelection),
    trailing: Number(structure.hasActions),
  });
  // Groups draw only in a table element, so the props are a `thead`'s.
  return (props: JSX.IntrinsicElements['thead'] | JSX.IntrinsicElements['div']) => (
    <thead {...(props as JSX.IntrinsicElements['thead'])}>
      <tr role="row">
        {cells.map(({ key, group, span }) =>
          group ? (
            <th
              key={key}
              role="columnheader"
              scope="colgroup"
              colSpan={span}
              className={hooks.slotClass('column-group')}
            >
              {group.header}
            </th>
          ) : (
            <td
              key={key}
              colSpan={span}
              aria-hidden="true"
              {...hooks.slot('column-group', { ungrouped: true })}
            />
          ),
        )}
      </tr>
      {props.children}
    </thead>
  );
}

/**
 * The header: an optional row of group headers, then the select-all checkbox, the data columns and
 * the actions column. A virtualized table positions its header rows itself and draws no groups.
 */
export function TableHeader<T>(props: TableHeaderProps<T>) {
  const strings = useUiStrings();
  const { structure, model } = props;
  const hasGroups = hasGroupRow(structure, model.groups);
  const selectionPin = getColumnPin(structure, 'selection');
  const actionsPin = getColumnPin(structure, 'actions');
  const pins = collectPins(structure);
  const probe = Object.values(pins).some(Boolean) ? (
    <PinnedOffsetsProbe pins={pins} onMeasure={model.onPinOffsets} />
  ) : null;
  return (
    <AriaTableHeader
      className={hooks.slotClass('header')}
      render={hasGroups ? createGroupedHeader(props) : undefined}
    >
      {structure.hasSelection ? (
        <FixedColumn
          id={selectionColumnId}
          kind="selection"
          width={selectionColumnWidth}
          pin={selectionPin}
          pinOffset={model.pinOffsets[selectionColumnId]}
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
          pinOffset={model.pinOffsets[actionsColumnId]}
        >
          <span {...hooks.slot('column-label')}>{strings.rowActions}</span>
        </FixedColumn>
      ) : null}
    </AriaTableHeader>
  );
}
