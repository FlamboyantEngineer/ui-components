import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key, Tone } from '../../core/props.js';
import { type RelationMatrixRelation } from './relation-matrix-model.js';
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
/**
 * A matrix of row items × column items: a grid with a header row pinned to the top and a row
 * header column pinned to the start, each header with its relation count (rows and columns without
 * one publish `data-uncovered`), and a mark in each related cell by its relation's kind. Arrow
 * keys, PageUp, PageDown, Home and End move between cells; with `onCellAction`, a press or Enter on
 * a cell reports it so the owner can add or remove the relation. `virtualized` windows both axes.
 */
export declare function RelationMatrix({ rows, columns, relations, kinds, rowsLabel, columnLabels, onCellAction, virtualized, rowHeight, columnWidth, className, ...rest }: RelationMatrixProps): import("react").JSX.Element;
//# sourceMappingURL=relation-matrix.d.ts.map