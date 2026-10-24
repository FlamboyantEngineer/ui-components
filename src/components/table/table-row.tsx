import type { CSSProperties, JSX, ReactNode } from 'react';
import {
  Button as AriaButton,
  Cell,
  Collection,
  Row,
  type CellRenderProps,
} from '../../primitives/index.js';
import { measuredProperty, pickDataAttributes } from '../../core/hooks.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { DragHandle } from '../drag-handle/drag-handle.js';
import type { TableRowAttributes } from './table.js';
import { useExpandGlyph } from '../expand-toggle/expand-toggle.js';
import { Icon } from '../icon/icon.js';
import { TableCellEditorView } from './table-cell-editor.js';
import { TableCheckbox } from './table-header.js';
import { tableHooks as hooks } from './table-hooks.js';
import { getCellValue, getRowText, type TableColumn, type TableRow } from './table-rows.js';
import {
  actionsColumnId,
  countTableColumns,
  getColumnPin,
  getPinStyle,
  getRowHeaderColumns,
  selectionColumnId,
  type TableStructure,
} from './table-structure.js';
import type { TableNode } from './table-tree.js';
import { placeInBounds } from './table-cell-range.js';
import type { TableGroup } from './table-groups.js';
import { isEditingCell, type CellEditing } from './use-cell-editing.js';
import type { CellSelection } from './use-cell-selection.js';
import type { TableDragTrigger } from './use-table-reorder.js';
import type { TablePinOffsets } from './use-pinned-offsets.js';

/** What every row and cell of a table renders from. */
export interface TableRowModel<T> {
  structure: TableStructure<T>;
  renderRowActions?: ((row: T) => ReactNode) | undefined;
  renderRowDetail?: ((row: T) => ReactNode) | undefined;
  getRowAttributes?: ((row: T) => TableRowAttributes) | undefined;
  /** Draws drag handles; `isMovable` tells which are enabled. */
  isReorderable: boolean;
  isMovable: (row: T) => boolean;
  dragTrigger: TableDragTrigger;
  pinOffsets: TablePinOffsets;
  editing: Pick<CellEditing<T>, 'editing' | 'commit' | 'cancel' | 'release' | 'dismiss'>;
  renderGroupLabel?: ((group: TableGroup<T>) => ReactNode) | undefined;
  /** Spreadsheet mode's selected cells, or null without it. */
  cells: TableCellsView<T> | null;
}

/** What spreadsheet mode draws on the cells. */
export interface TableCellsView<T> extends Pick<
  CellSelection<T>,
  'mode' | 'grid' | 'bounds' | 'fillBounds'
> {
  /** The selected cells include an editable one, so the corner cell holds a fill handle. */
  canFill: boolean;
}

type CellElementProps = JSX.IntrinsicElements['td' | 'div'];

/** Cell elements marked selected for assistive technology, inside a range of selected cells. */
const selectedCells = {
  td: (props: CellElementProps) => (
    <td {...(props as JSX.IntrinsicElements['td'])} aria-selected="true" />
  ),
  div: (props: CellElementProps) => (
    <div {...(props as JSX.IntrinsicElements['div'])} aria-selected="true" />
  ),
};

/** The key prefix of detail rows, kept out of row actions, selection and moves. */
export const detailRowPrefix = 'ui-table-detail:';

function renderCellContent<T extends TableRow>(row: T, column: TableColumn<T>): ReactNode {
  if (column.renderCell) return column.renderCell(row);
  const value = getCellValue(row, column);
  return typeof value === 'string' || typeof value === 'number' ? value : null;
}

/** A row element without React Aria's `draggable`, so only its handle starts a pointer drag. */
function createHandleRow(isVirtualized: boolean) {
  return ({ draggable: _draggable, ...props }: JSX.IntrinsicElements['tr' | 'div']) =>
    isVirtualized ? (
      <div {...(props as JSX.IntrinsicElements['div'])} />
    ) : (
      <tr {...(props as JSX.IntrinsicElements['tr'])} />
    );
}

/**
 * The expand button of a row with child or detail rows, named by React Aria after the row
 * (`Expand <row>`, `Collapse <row>`), or a spacer holding its place.
 */
export function TableExpandButton({
  hasChildItems,
  isExpanded,
}: {
  hasChildItems: boolean;
  isExpanded: boolean;
}) {
  const glyph = useExpandGlyph(isExpanded);
  if (!hasChildItems) return <span {...hooks.slot('expand-spacer')} aria-hidden="true" />;
  return (
    <AriaButton slot="chevron" className={hooks.slotClass('expand')}>
      <Icon glyph={glyph} size="sm" />
    </AriaButton>
  );
}

/** Where a cell sits in spreadsheet mode's selected cells and in a dragged fill. */
function describeRangeCell<T extends TableRow>(
  view: TableCellsView<T> | null,
  row: T,
  column: TableColumn<T>,
) {
  const at = {
    row: view?.grid.rowIndex.get(toCollectionKey(row.id)) ?? -1,
    column: view?.grid.columnIndex.get(column.id) ?? -1,
  };
  const place = placeInBounds(view?.bounds ?? null, at);
  const isFillTarget = !place.isInRange && placeInBounds(view?.fillBounds ?? null, at).isInRange;
  const hasFillHandle = view?.mode === 'range' && view.canFill && place.isCorner;
  return { ...place, isFillTarget, hasFillHandle };
}

function TableDataCell<T extends TableRow>(props: {
  row: T;
  column: TableColumn<T>;
  isFirst: boolean;
  model: TableRowModel<T>;
}) {
  const { row, column, isFirst, model } = props;
  const pin = getColumnPin(model.structure, column);
  const pinStyle = getPinStyle(pin, model.pinOffsets[column.id]);
  const isTree = model.structure.treeColumn === column.id;
  const isEditing = isEditingCell(model.editing.editing, row, column.id);
  const range = describeRangeCell(model.cells, row, column);
  const style = isTree
    ? ({ level }: CellRenderProps): CSSProperties => ({
        ...pinStyle,
        ...measuredProperty('table-level', String(level)),
      })
    : pinStyle;
  return (
    <Cell
      style={style}
      render={
        range.isInRange ? selectedCells[model.structure.isVirtualized ? 'div' : 'td'] : undefined
      }
      {...hooks.slot('cell', {
        kind: 'data',
        align: column.align ?? 'start',
        column: column.id,
        pinned: pin,
        editing: isEditing,
        inRange: range.isInRange,
        rangeTop: range.isTop,
        rangeBottom: range.isBottom,
        rangeStart: range.isStart,
        rangeEnd: range.isEnd,
        fillTarget: range.isFillTarget,
      })}
    >
      {(values) => (
        <>
          {model.isReorderable && isFirst ? (
            <DragHandle
              className={hooks.slotClass('drag-handle')}
              isDisabled={!model.isMovable(row)}
            />
          ) : null}
          {isTree ? <TableExpandButton {...values} /> : null}
          {isEditing ? (
            <TableCellEditorView
              row={row}
              column={column}
              editing={model.editing}
              movesOnCommit={model.cells !== null}
            />
          ) : (
            renderCellContent(row, column)
          )}
          {range.hasFillHandle ? (
            <span className={hooks.slotClass('fill-handle')} aria-hidden="true" />
          ) : null}
        </>
      )}
    </Cell>
  );
}

/** A full-width row under its parent, holding the parent's detail content. */
function TableDetailRow<T extends TableRow>(props: {
  row: T;
  model: TableRowModel<T>;
  children: ReactNode;
}) {
  const { row, model } = props;
  return (
    <Row
      id={`${detailRowPrefix}${toCollectionKey(row.id)}`}
      textValue={getRowText(row, getRowHeaderColumns(model.structure.columns))}
      // Focusable so controls in the detail stay reachable, never selectable.
      isDisabled
      disabledBehavior="selection"
      className={hooks.slotClass('detail-row')}
    >
      <Cell colSpan={countTableColumns(model.structure)} className={hooks.slotClass('detail-cell')}>
        {props.children}
      </Cell>
    </Row>
  );
}

/** One row with its cells, then its detail row and its child rows. */
export function TableDataRow<T extends TableRow>({
  id,
  node,
  model,
}: {
  id: string;
  node: TableNode<T>;
  model: TableRowModel<T>;
}) {
  const { row } = node;
  const { structure, renderRowActions } = model;
  const detail = model.renderRowDetail?.(row);
  const selectionPin = getColumnPin(structure, 'selection');
  const actionsPin = getColumnPin(structure, 'actions');
  return (
    <Row
      {...pickDataAttributes(model.getRowAttributes?.(row) ?? {})}
      id={id}
      textValue={getRowText(row, getRowHeaderColumns(structure.columns))}
      {...hooks.slot('row')}
      render={model.dragTrigger === 'handle' ? createHandleRow(structure.isVirtualized) : undefined}
    >
      {structure.hasSelection ? (
        <Cell
          style={getPinStyle(selectionPin, model.pinOffsets[selectionColumnId])}
          {...hooks.slot('cell', { kind: 'selection', pinned: selectionPin })}
        >
          <TableCheckbox />
        </Cell>
      ) : null}
      {structure.columns.map((column, index) => (
        <TableDataCell
          key={column.id}
          row={row}
          column={column}
          isFirst={index === 0}
          model={model}
        />
      ))}
      {structure.hasActions && renderRowActions ? (
        <Cell
          style={getPinStyle(actionsPin, model.pinOffsets[actionsColumnId])}
          {...hooks.slot('cell', { kind: 'actions', pinned: actionsPin })}
        >
          {renderRowActions(row)}
        </Cell>
      ) : null}
      {isEmptyNode(detail) ? null : (
        <TableDetailRow row={row} model={model}>
          {detail}
        </TableDetailRow>
      )}
      {node.children.length > 0 ? (
        <Collection items={node.children} dependencies={[model]}>
          {(child) => <TableDataRow id={toCollectionKey(child.id)} node={child} model={model} />}
        </Collection>
      ) : null}
    </Row>
  );
}
