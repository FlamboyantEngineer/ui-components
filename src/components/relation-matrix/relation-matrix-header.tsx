import { toKeyIdentity } from '../../utils/to-key-identity.js';
import type { RefObject } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { TruncationTooltip } from '../truncation-tooltip/truncation-tooltip.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import type { RelationMatrixItem } from './relation-matrix.js';
import { relationMatrixHooks as hooks } from './relation-matrix-hooks.js';
import type { RelationMatrixIndex } from './relation-matrix-model.js';
import type { MatrixColumnTracks } from './matrix-window.js';
import type { MatrixPosition } from './matrix-navigation.js';

export interface RelationMatrixHeaderProps {
  headerRef: RefObject<HTMLDivElement | null>;
  cornerRef: RefObject<HTMLDivElement | null>;
  columns: readonly RelationMatrixItem[];
  /** The rendered column indices. */
  indices: readonly number[];
  tracks: MatrixColumnTracks;
  index: RelationMatrixIndex;
  rowsLabel: string;
  focus: MatrixPosition;
  /** Whether focus is in the grid, which marks the focused cell's column header current. */
  isFocusWithin: boolean;
}

/** A count shown as digits and read as the provider's `relationCount` text. */
export function RelationCount({
  count,
  slot,
}: {
  count: number;
  slot: 'row-count' | 'column-count';
}) {
  const strings = useUiStrings();
  return (
    <span {...hooks.slot(slot)}>
      <span aria-hidden="true">{count}</span>
      <VisuallyHidden elementType="span">{strings.relationCount(count)}</VisuallyHidden>
    </span>
  );
}

/**
 * The header row, pinned to the top of the matrix: the corner header naming the row headers,
 * pinned to its start, then one column header per rendered column with its label (cut or rotated
 * by the stylesheet, shown whole in a tooltip when cut) and its relation count.
 */
export function RelationMatrixHeader({
  headerRef,
  cornerRef,
  columns,
  indices,
  tracks,
  index,
  rowsLabel,
  focus,
  isFocusWithin,
}: RelationMatrixHeaderProps) {
  return (
    <div
      ref={headerRef}
      role="row"
      aria-rowindex={1}
      {...hooks.slot('header')}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 2,
        width: 'max-content',
        gridTemplateColumns: tracks.template,
      }}
    >
      <div
        ref={cornerRef}
        role="columnheader"
        aria-colindex={1}
        tabIndex={focus.row === -1 && focus.column === -1 ? 0 : -1}
        {...hooks.slot('corner')}
        style={{ position: 'sticky', insetInlineStart: 0, zIndex: 1, gridColumn: 1 }}
      >
        {rowsLabel}
      </div>
      {indices.map((columnIndex) => {
        const column = columns[columnIndex] as RelationMatrixItem;
        const count = index.countColumn(column.id);
        const isFocused = focus.row === -1 && focus.column === columnIndex;
        const isCurrent = isFocusWithin && focus.column === columnIndex;
        return (
          <div
            key={toKeyIdentity(column.id)}
            role="columnheader"
            aria-colindex={columnIndex + 2}
            tabIndex={isFocused ? 0 : -1}
            {...hooks.slot('column', { uncovered: count === 0, current: isCurrent })}
            style={{ gridColumn: tracks.lines.get(columnIndex) }}
          >
            <TruncationTooltip className={hooks.slotClass('column-label')}>
              {column.label}
            </TruncationTooltip>{' '}
            <RelationCount count={count} slot="column-count" />
          </div>
        );
      })}
    </div>
  );
}
