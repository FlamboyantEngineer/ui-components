import { toKeyIdentity } from '../../utils/to-key-identity.js';
import type { CSSProperties } from 'react';
import { Glyph, useUiStrings } from '../../core/provider.js';
import type { Tone } from '../../core/props.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import type { RelationMatrixItem, RelationMatrixKind } from './relation-matrix.js';
import { RelationCount } from './relation-matrix-header.js';
import { relationMatrixHooks as hooks } from './relation-matrix-hooks.js';
import type { RelationMatrixIndex, RelationMatrixRelation } from './relation-matrix-model.js';
import type { MatrixColumnTracks } from './matrix-window.js';
import type { MatrixPosition } from './matrix-navigation.js';

/** What every row of a matrix shares. */
export interface RelationMatrixRowContext {
  columns: readonly RelationMatrixItem[];
  /** The rendered column indices. */
  indices: readonly number[];
  tracks: MatrixColumnTracks;
  index: RelationMatrixIndex;
  kinds: ReadonlyMap<string, RelationMatrixKind>;
  focus: MatrixPosition;
  isFocusWithin: boolean;
  /** Whether a press on a body cell is an action. */
  isActionable: boolean;
  onCellPress: (position: MatrixPosition) => void;
  virtualized: boolean;
  rowHeight: number;
}

export interface RelationMatrixRowProps {
  row: RelationMatrixItem;
  rowIndex: number;
  context: RelationMatrixRowContext;
}

interface CellProps {
  relation: RelationMatrixRelation | undefined;
  position: MatrixPosition;
  gridColumn: number | undefined;
  context: RelationMatrixRowContext;
}

/** A related cell's mark: a glyph, read as its kind's label (or the provider's `related` text). */
function RelationMark({ label }: { label: string }) {
  return (
    <span {...hooks.slot('mark')}>
      <Glyph name="check" />
      <VisuallyHidden elementType="span">{label}</VisuallyHidden>
    </span>
  );
}

function RelationMatrixCell({ relation, position, gridColumn, context }: CellProps) {
  const strings = useUiStrings();
  const kind = relation?.kind === undefined ? undefined : context.kinds.get(relation.kind);
  const isFocused = context.focus.row === position.row && context.focus.column === position.column;
  const tone: Tone | undefined = relation ? (kind?.tone ?? 'neutral') : undefined;
  return (
    <div
      role="gridcell"
      aria-colindex={position.column + 2}
      tabIndex={isFocused ? 0 : -1}
      {...hooks.slot('cell', { related: Boolean(relation), kind: relation?.kind, tone })}
      style={{ gridColumn }}
      onClick={context.isActionable ? () => context.onCellPress(position) : undefined}
    >
      {relation ? <RelationMark label={kind?.label ?? strings.related} /> : null}
    </div>
  );
}

function rowStyle(context: RelationMatrixRowContext, rowIndex: number): CSSProperties {
  const style: CSSProperties = {
    width: 'max-content',
    gridTemplateColumns: context.tracks.template,
  };
  if (!context.virtualized) return style;
  return {
    ...style,
    position: 'absolute',
    top: rowIndex * context.rowHeight,
    insetInlineStart: 0,
    height: context.rowHeight,
  };
}

/**
 * One row of the matrix: its row header (label and relation count), pinned to the start, then a
 * cell per rendered column, marked when its row and column items are related.
 */
export function RelationMatrixRow({ row, rowIndex, context }: RelationMatrixRowProps) {
  const { columns, indices, tracks, index, focus, isFocusWithin } = context;
  const count = index.countRow(row.id);
  const isHeaderFocused = focus.row === rowIndex && focus.column === -1;
  return (
    <div
      role="row"
      aria-rowindex={rowIndex + 2}
      {...hooks.slot('row', { uncovered: count === 0 })}
      style={rowStyle(context, rowIndex)}
    >
      <div
        role="rowheader"
        aria-colindex={1}
        tabIndex={isHeaderFocused ? 0 : -1}
        {...hooks.slot('row-header', {
          uncovered: count === 0,
          current: isFocusWithin && focus.row === rowIndex,
        })}
        style={{ position: 'sticky', insetInlineStart: 0, zIndex: 1, gridColumn: 1 }}
      >
        <span {...hooks.slot('row-label')}>{row.label}</span>{' '}
        <RelationCount count={count} slot="row-count" />
      </div>
      {indices.map((columnIndex) => {
        const column = columns[columnIndex] as RelationMatrixItem;
        return (
          <RelationMatrixCell
            key={toKeyIdentity(column.id)}
            relation={index.get(row.id, column.id)}
            position={{ row: rowIndex, column: columnIndex }}
            gridColumn={tracks.lines.get(columnIndex)}
            context={context}
          />
        );
      })}
    </div>
  );
}
