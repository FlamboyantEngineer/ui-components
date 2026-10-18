// A traceability matrix: row items × column items with a mark in each related cell, on a grid
// that windows both axes, since React Aria's table renders every column of a row.

import { useMemo, useRef } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key, Tone } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { relationMatrixHooks as hooks } from './relation-matrix-hooks.js';
import { RelationMatrixHeader } from './relation-matrix-header.js';
import { indexRelations, type RelationMatrixRelation } from './relation-matrix-model.js';
import { RelationMatrixRow, type RelationMatrixRowContext } from './relation-matrix-row.js';
import type { MatrixPosition } from './matrix-navigation.js';
import { useMatrixNavigation } from './use-matrix-navigation.js';
import { useMatrixWindow } from './use-matrix-window.js';

/** An item on one axis of the matrix. */
export interface RelationMatrixItem {
  id: Key;
  /** The header text. */
  label: string;
}

/** A kind of relation: how its mark reads and the tone the stylesheet draws it in. */
export interface RelationMatrixKind {
  id: string;
  /** Read in place of the mark, such as `Verifies`. */
  label: string;
  /** Published as the cell's `data-tone`. Defaults to `neutral`. */
  tone?: Tone | undefined;
}

/** The cell an action happened on, with the relation it holds, if any. */
export interface RelationMatrixCell {
  row: Key;
  column: Key;
  relation: RelationMatrixRelation | null;
}

/** How the stylesheet fits long column labels: turned on their side, or cut. */
export type RelationMatrixColumnLabels = 'rotated' | 'truncated';

export interface RelationMatrixProps extends BaseProps, AriaLabellingProps {
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
  /** Renders only the rows and columns in view; the stylesheet must bound the matrix's size. */
  virtualized?: boolean | undefined;
  /** The height of every row in pixels, while virtualized. Defaults to 32. */
  rowHeight?: number | undefined;
  /** The width of every column in pixels. Defaults to 32. */
  columnWidth?: number | undefined;
}

const defaultRowHeight = 32;
const defaultColumnWidth = 32;

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
  virtualized = false,
  rowHeight = defaultRowHeight,
  columnWidth = defaultColumnWidth,
  className,
  ...rest
}: RelationMatrixProps) {
  const strings = useUiStrings();
  const root = useRef<HTMLDivElement>(null);
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
  const navigation = useMatrixNavigation({ root, ...counts, onCellAction: onCellPress });
  const view = useMatrixWindow({
    ...{ root, header, corner, virtualized, ...counts, rowHeight, columnWidth },
    focus: navigation.focus,
  });
  const context: RelationMatrixRowContext = {
    ...{ columns, indices: view.columns, tracks: view.tracks, index, kinds: kindMap },
    ...{ focus: navigation.focus, isFocusWithin: navigation.isFocusWithin },
    ...{ isActionable: Boolean(onCellAction), onCellPress, virtualized, rowHeight },
  };
  return (
    <div
      ref={root}
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
      onScroll={view.onScroll}
    >
      <RelationMatrixHeader
        {...{ headerRef: header, cornerRef: corner, columns, indices: view.columns }}
        {...{ tracks: view.tracks, index, rowsLabel: rowsLabel ?? strings.relationItems }}
        {...{ focus: navigation.focus, isFocusWithin: navigation.isFocusWithin }}
      />
      <div
        role="rowgroup"
        {...hooks.slot('body')}
        style={virtualized ? { position: 'relative', height: rows.length * rowHeight } : undefined}
      >
        {view.rows.map((rowIndex) => {
          const row = rows[rowIndex] as RelationMatrixItem;
          return <RelationMatrixRow key={row.id} row={row} rowIndex={rowIndex} context={context} />;
        })}
      </div>
    </div>
  );
}
