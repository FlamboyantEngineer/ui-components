'use client';

import type { CSSProperties, ReactNode } from 'react';
import {
  Cell,
  Collection,
  Row,
  useNumberFormatter,
  type CellRenderProps,
} from '../../primitives/index.js';
import { measuredProperty } from '../../core/hooks.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { useUiStrings } from '../../core/provider.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import {
  aggregateCellValues,
  formatGroupValue,
  isGroupNode,
  type TableBodyNode,
  type TableGroup,
  type TableGroupNode,
} from './table-groups.js';
import { tableHooks as hooks } from './table-hooks.js';
import { TableExpandButton } from './table-data-cell.js';
import { TableDataRow } from './table-row.js';
import type { TableRowModel } from './table-row-model.js';
import { getCellValue, type TableColumn, type TableRow } from './table-rows.js';
import {
  actionsColumnId,
  getCellWrap,
  getColumnPin,
  getPinStyle,
  selectionColumnId,
} from './table-structure.js';

/** A column's cell in a group header row: its aggregate of the group's rows, if it has one. */
function renderAggregate<T extends TableRow>(
  column: TableColumn<T>,
  rows: readonly T[],
  format: Intl.NumberFormat,
): ReactNode {
  const { aggregate } = column;
  if (aggregate === undefined) return null;
  if (typeof aggregate === 'function') return aggregate(rows);
  const value = aggregateCellValues(
    rows.map((row) => getCellValue(row, column)),
    aggregate,
  );
  return value === null ? null : format.format(value);
}

/** The group's heading as text: the grouping's name and the group's value. */
function useGroupHeading<T>(group: TableGroup<T>): string {
  const strings = useUiStrings();
  const value = formatGroupValue(group.value);
  return strings.groupHeading(group.label, value === '' ? strings.emptyValue : value);
}

/** The group cell's content: the expand button, the label and the number of rows. */
function GroupLabel<T>(props: {
  values: CellRenderProps;
  group: TableGroup<T>;
  label: ReactNode;
  format: Intl.NumberFormat;
}) {
  const strings = useUiStrings();
  const count = props.group.rows.length;
  return (
    <>
      <TableExpandButton {...props.values} />
      <span className={hooks.slotClass('group-label')}>{props.label}</span>
      {/* The count reads as words; the drawn number is for the eye. */}
      <span className={hooks.slotClass('group-count')} aria-hidden="true">
        {props.format.format(count)}
      </span>{' '}
      <VisuallyHidden elementType="span">{strings.itemCount(count)}</VisuallyHidden>
    </>
  );
}

/**
 * A group header row: the expand button, label and count under the first data column, the other
 * columns' aggregates, then its rows.
 */
function TableGroupRow<T extends TableRow>({
  id,
  node,
  model,
}: {
  id: string;
  node: TableGroupNode<T>;
  model: TableRowModel<T>;
}) {
  const strings = useUiStrings();
  const format = useNumberFormatter();
  const { group } = node;
  const { structure, pinOffsets } = model;
  const heading = useGroupHeading(group);
  const firstColumn = structure.columns[0];
  const labelPin = firstColumn ? getColumnPin(structure, firstColumn) : undefined;
  const labelStyle = ({ level }: CellRenderProps): CSSProperties => ({
    ...getPinStyle(labelPin, firstColumn ? pinOffsets[firstColumn.id] : undefined),
    ...measuredProperty('table-level', String(level)),
  });
  const selectionPin = getColumnPin(structure, 'selection');
  const actionsPin = getColumnPin(structure, 'actions');
  return (
    <Row
      id={id}
      textValue={strings.labelWithCount(heading, strings.itemCount(group.rows.length))}
      // Focusable to expand and collapse, never selectable.
      isDisabled
      disabledBehavior="selection"
      className={hooks.slotClass('group-row')}
    >
      {structure.hasSelection ? (
        <Cell
          style={getPinStyle(selectionPin, pinOffsets[selectionColumnId])}
          {...hooks.slot('aggregate-cell', { kind: 'selection', pinned: selectionPin })}
        />
      ) : null}
      {/* One cell per column, as React Aria counts a parent row's cells to number its rows. */}
      <Cell
        style={labelStyle}
        {...hooks.slot('group-cell', { column: firstColumn?.id, pinned: labelPin })}
      >
        {(values) => (
          <GroupLabel
            values={values}
            group={group}
            label={model.renderGroupLabel?.(group) ?? heading}
            format={format}
          />
        )}
      </Cell>
      {structure.columns.slice(1).map((column) => {
        const pin = getColumnPin(structure, column);
        return (
          <Cell
            key={column.id}
            style={getPinStyle(pin, pinOffsets[column.id])}
            {...hooks.slot('aggregate-cell', {
              kind: 'data',
              align: column.align ?? 'start',
              wrap: getCellWrap(structure, column),
              column: column.id,
              pinned: pin,
            })}
          >
            {renderAggregate(column, group.rows, format)}
          </Cell>
        );
      })}
      {structure.hasActions ? (
        <Cell
          style={getPinStyle(actionsPin, pinOffsets[actionsColumnId])}
          {...hooks.slot('aggregate-cell', { kind: 'actions', pinned: actionsPin })}
        />
      ) : null}
      <Collection items={node.children} dependencies={[model]}>
        {(child) => renderBodyNode(child, model)}
      </Collection>
    </Row>
  );
}

/** A node of the table body: a group header row with its contents, or a row with its own. */
export function renderBodyNode<T extends TableRow>(
  node: TableBodyNode<T>,
  model: TableRowModel<T>,
): ReactNode {
  return isGroupNode(node) ? (
    <TableGroupRow id={toCollectionKey(node.id)} node={node} model={model} />
  ) : (
    <TableDataRow id={toCollectionKey(node.id)} node={node} model={model} />
  );
}
