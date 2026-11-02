'use client';

// A traceability matrix: row items × column items with a mark in each related cell, on the
// library's own grid that windows both axes, since React Aria's table renders every column of a
// row. Its keyboard contract is in specs/RELATION-MATRIX.md (UIC-RELATION-MATRIX-4.2).

import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { useMemo, useRef } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { relationMatrixHooks as hooks } from './relation-matrix-hooks.js';
import { RelationMatrixHeader } from './relation-matrix-header.js';
import { indexRelations, type RelationMatrixRelation } from './relation-matrix-model.js';
import { RelationMatrixRow, type RelationMatrixRowContext } from './relation-matrix-row.js';
import type { MatrixPosition } from './matrix-navigation.js';
import { useMatrixNavigation } from './use-matrix-navigation.js';
import { useMatrixWindow } from './use-matrix-window.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
import {
  useMatrixMenu,
  type RelationMatrixAxisAction,
  type RelationMatrixAxisOperation,
  type RelationMatrixCell,
  type RelationMatrixItem,
  type RelationMatrixKind,
  type RelationMatrixMenuIcons,
} from './relation-matrix-menu.js';

export type {
  RelationMatrixAxisAction,
  RelationMatrixAxisOperation,
  RelationMatrixCell,
  RelationMatrixItem,
  RelationMatrixKind,
  RelationMatrixMenuAction,
  RelationMatrixMenuIcons,
} from './relation-matrix-menu.js';

/** How the stylesheet fits long column labels: turned on their side, or cut. */
export type RelationMatrixColumnLabels = 'rotated' | 'truncated';

export interface RelationMatrixProps
  extends BaseProps, AriaLabellingProps, RefProps<HTMLDivElement> {
  /** The row items, in order. */
  rows: readonly RelationMatrixItem[];
  /** The column items, in order. */
  columns: readonly RelationMatrixItem[];
  /** The relations between row and column items, at most one per cell. */
  relations: readonly RelationMatrixRelation[];
  /** The kinds the relations name. */
  kinds?: readonly RelationMatrixKind[] | undefined;
  /** Names the row headers' column, in the corner. Defaults to the provider's `relationItems`. */
  rowsLabel?: string | undefined;
  /** How the stylesheet fits long column labels. Defaults to `rotated`. */
  columnLabels?: RelationMatrixColumnLabels | undefined;
  /** Called when a body cell is pressed or Enter or Space is pressed on it, to add or remove a relation. */
  onCellAction?: ((cell: RelationMatrixCell) => void) | undefined;
  /**
   * Gives every body cell a context menu that sets its relation to one of `kinds` or removes it,
   * and is called with the cell and the relation it should hold (`null` to remove it).
   */
  onRelationChange?: ((cell: RelationMatrixCell) => void) | undefined;
  /**
   * Gives every row and column header a context menu that moves its item, inserts one beside it or
   * removes it, and is called with the chosen action for the owner to apply.
   */
  onAxisAction?: ((action: RelationMatrixAxisAction) => void) | undefined;
  /** The header actions `onAxisAction` offers. Defaults to all: `move`, `insert` and `remove`. */
  axisActions?: readonly RelationMatrixAxisOperation[] | undefined;
  /**
   * Icons for the menus' built-in actions, by action: a header's `move-before`, `move-after`,
   * `insert-before`, `insert-after` and `remove`, and a cell's `remove-relation`. They have none by
   * default; a cell's kinds take each kind's `glyph`.
   */
  menuIcons?: RelationMatrixMenuIcons | undefined;
  /** Renders only the rows and columns in view; the stylesheet must bound the matrix's size. */
  virtualized?: boolean | undefined;
  /** The height of every row in pixels, while virtualized. Defaults to 32. */
  rowHeight?: number | undefined;
  /** The width of every column in pixels. Defaults to 32. */
  columnWidth?: number | undefined;
}

const allAxisActions: readonly RelationMatrixAxisOperation[] = ['move', 'insert', 'remove'];
const defaultRowHeight = 32;
const defaultColumnWidth = 32;

/**
 * The body rows. A row group holds at least one row, so a matrix without rows has the header row
 * alone.
 */
function RelationMatrixBody({
  rows,
  rowIndices,
  context,
}: {
  rows: readonly RelationMatrixItem[];
  rowIndices: readonly number[];
  context: RelationMatrixRowContext;
}) {
  if (rows.length === 0) return null;
  const { virtualized, rowHeight } = context;
  return (
    <div
      role="rowgroup"
      {...hooks.slot('body')}
      style={virtualized ? { position: 'relative', height: rows.length * rowHeight } : undefined}
    >
      {rowIndices.map((rowIndex) => {
        const row = rows[rowIndex] as RelationMatrixItem;
        return <RelationMatrixRow key={toKeyIdentity(row.id)} {...{ row, rowIndex, context }} />;
      })}
    </div>
  );
}

/**
 * A matrix of row items × column items: a grid with a header row pinned to the top and a row
 * header column pinned to the start, each header with its relation count (rows and columns without
 * one publish `data-uncovered`), and a mark in each related cell by its relation's kind. Arrow
 * keys, PageUp, PageDown, Home and End move between cells; with `onCellAction`, a press or Enter on
 * a cell reports it so the owner can add or remove the relation. `virtualized` windows both axes.
 */
export function RelationMatrix({
  rows,
  columns,
  relations,
  kinds,
  rowsLabel,
  columnLabels = 'rotated',
  onCellAction,
  onRelationChange,
  onAxisAction,
  axisActions = allAxisActions,
  menuIcons,
  virtualized = false,
  rowHeight = defaultRowHeight,
  columnWidth = defaultColumnWidth,
  className,
  ref,
  ...rest
}: RelationMatrixProps) {
  const strings = useUiStrings();
  const [root, setRoot] = useForwardedRef(ref);
  const header = useRef<HTMLDivElement>(null);
  const corner = useRef<HTMLDivElement>(null);
  const index = useMemo(
    () => indexRelations(relations, { rows, columns }),
    [relations, rows, columns],
  );
  const kindMap = useMemo(() => new Map(kinds?.map((kind) => [kind.id, kind])), [kinds]);
  const onCellPress = ({ row, column }: MatrixPosition) => {
    const rowItem = rows[row];
    const columnItem = columns[column];
    if (!onCellAction || !rowItem || !columnItem) return;
    const relation = index.get(rowItem.id, columnItem.id) ?? null;
    onCellAction({ row: rowItem.id, column: columnItem.id, relation });
  };
  const counts = { rowCount: rows.length, columnCount: columns.length };
  const rowIds = useMemo(() => rows.map((row) => toKeyIdentity(row.id)), [rows]);
  const columnIds = useMemo(() => columns.map((column) => toKeyIdentity(column.id)), [columns]);
  const navigation = useMatrixNavigation({ root, rowIds, columnIds, onCellAction: onCellPress });
  const view = useMatrixWindow({
    ...{ root, header, corner, virtualized, ...counts, rowHeight, columnWidth },
    focus: navigation.focus,
  });
  const menus = useMatrixMenu(
    { root, rows, columns, index, kinds, onRelationChange, onAxisAction, axisActions, menuIcons },
    { ownRef: setRoot, onKeyDown: navigation.gridProps.onKeyDown },
  );
  const context: RelationMatrixRowContext = {
    ...{ columns, indices: view.columns, tracks: view.tracks, index, kinds: kindMap },
    ...{ focus: navigation.focus, isFocusWithin: navigation.isFocusWithin },
    ...{ isActionable: Boolean(onCellAction), onCellPress, virtualized, rowHeight },
  };
  return (
    <div
      role="grid"
      aria-rowcount={rows.length + 1}
      aria-colcount={columns.length + 1}
      {...rest}
      {...hooks.root({
        className,
        props: rest,
        data: { columnLabels, virtualized, actionable: Boolean(onCellAction) },
      })}
      {...navigation.gridProps}
      {...menus.targetProps}
      onScroll={view.onScroll}
    >
      <RelationMatrixHeader
        {...{ headerRef: header, cornerRef: corner, columns, indices: view.columns }}
        {...{ tracks: view.tracks, index, rowsLabel: rowsLabel ?? strings.relationItems }}
        {...{ focus: navigation.focus, isFocusWithin: navigation.isFocusWithin }}
      />
      <RelationMatrixBody {...{ rows, rowIndices: view.rows, context }} />
      {menus.menu}
    </div>
  );
}
