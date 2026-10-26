import type { RefObject } from 'react';
import type { RelationMatrixItem } from './relation-matrix.js';
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
export declare function RelationCount({ count, slot, }: {
    count: number;
    slot: 'row-count' | 'column-count';
}): import("react").JSX.Element;
/**
 * The header row, pinned to the top of the matrix: the corner header naming the row headers,
 * pinned to its start, then one column header per rendered column with its label (cut or rotated
 * by the stylesheet, shown whole in a tooltip when cut) and its relation count.
 */
export declare function RelationMatrixHeader({ headerRef, cornerRef, columns, indices, tracks, index, rowsLabel, focus, isFocusWithin, }: RelationMatrixHeaderProps): import("react").JSX.Element;
//# sourceMappingURL=relation-matrix-header.d.ts.map