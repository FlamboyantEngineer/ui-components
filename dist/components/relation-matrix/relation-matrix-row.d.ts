import type { RelationMatrixItem, RelationMatrixKind } from './relation-matrix.js';
import type { RelationMatrixIndex } from './relation-matrix-model.js';
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
/**
 * One row of the matrix: its row header (label and relation count), pinned to the start, then a
 * cell per rendered column, marked when its row and column items are related.
 */
export declare function RelationMatrixRow({ row, rowIndex, context }: RelationMatrixRowProps): import("react").JSX.Element;
//# sourceMappingURL=relation-matrix-row.d.ts.map