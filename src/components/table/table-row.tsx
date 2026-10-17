import type { CSSProperties, JSX, ReactNode } from 'react';
import {
  Button as AriaButton,
  Cell,
  Collection,
  Row,
  type CellRenderProps,
} from 'react-aria-components';
import { measuredProperty } from '../../core/hooks.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { DragHandle } from '../drag-handle/drag-handle.js';
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
import { isEditingCell, type CellEditing } from './use-cell-editing.js';
import type { TableDragTrigger } from './use-table-reorder.js';
import type { TablePinOffsets } from './use-pinned-offsets.js';

/** What every row and cell of a table renders from. */
export interface TableRowModel<T> {
  structure: TableStructure<T>;
  renderRowActions?: ((row: T) => ReactNode) | undefined;
  renderRowDetail?: ((row: T) => ReactNode) | undefined;
  /** Draws drag handles; `isMovable` tells which are enabled. */
  isReorderable: boolean;
  isMovable: (row: T) => boolean;
  dragTrigger: TableDragTrigger;
  pinOffsets: TablePinOffsets;
  editing: Pick<CellEditing<T>, 'editing' | 'commit' | 'cancel' | 'release'>;
}

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
function TableExpandButton({ hasChildItems, isExpanded }: CellRenderProps) {
  const glyph = useExpandGlyph(isExpanded);
  if (!hasChildItems) return <span {...hooks.slot('expand-spacer')} aria-hidden="true" />;
  return (
    <AriaButton slot="chevron" className={hooks.slotClass('expand')}>
      <Icon glyph={glyph} size="sm" />
    </AriaButton>
  );
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
  const style = isTree
    ? ({ level }: CellRenderProps): CSSProperties => ({
        ...pinStyle,
        ...measuredProperty('table-level', String(level)),
      })
    : pinStyle;
  return (
    <Cell
      style={style}
      {...hooks.slot('cell', {
        kind: 'data',
        align: column.align ?? 'start',
        column: column.id,
        pinned: pin,
        editing: isEditing,
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
            <TableCellEditorView row={row} column={column} editing={model.editing} />
          ) : (
            renderCellContent(row, column)
          )}
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
      id={`${detailRowPrefix}${String(row.id)}`}
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
  node,
  model,
}: {
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
      id={row.id}
      textValue={getRowText(row, getRowHeaderColumns(structure.columns))}
      className={hooks.slotClass('row')}
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
          {(child) => <TableDataRow node={child} model={model} />}
        </Collection>
      ) : null}
    </Row>
  );
}
