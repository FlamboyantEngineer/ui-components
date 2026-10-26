import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type CellCoordinates } from '../../utils/cell-reference.js';
import { type CodeTokenizer } from '../code-editor/code-editor.js';
import type { Completions } from '../completion-list/completion-list.js';
export interface FormulaBarProps extends BaseProps, AriaLabellingProps {
    /** The active cell, by zero-based row and column; null while no cell is active. */
    cell: CellCoordinates | null;
    /** The active cell's raw content as the caller stores it, such as a formula. */
    value: string;
    /** Called with the edited content and its cell on Enter or the confirm button. */
    onCommit?: ((value: string, cell: CellCoordinates) => void) | undefined;
    /** Called with the cell a reference typed into the reference box names, on Enter. */
    onCellChange?: ((cell: CellCoordinates) => void) | undefined;
    /** The grid's row count; a typed reference below the last row is refused. */
    rowCount?: number | undefined;
    /** The grid's column count; a typed reference beyond the last column is refused. */
    columnCount?: number | undefined;
    /** The formula language: splits the content into tokens for highlighting. */
    tokenize?: CodeTokenizer | undefined;
    /** Function names or other words to complete at the caret, or a source that completes it. */
    completions?: Completions | undefined;
    /** The caller's evaluation of the content being edited, shown as its result. */
    evaluate?: ((value: string, cell: CellCoordinates) => string) | undefined;
    /** Shown while the content is empty. */
    placeholder?: string | undefined;
    /** Keeps the content readable and selectable but refuses edits. */
    isReadOnly?: boolean | undefined;
    /** Refuses focus and every edit. */
    isDisabled?: boolean | undefined;
}
/**
 * A bar above a spreadsheet grid: the active cell's A1 reference, which the reader edits to move
 * to another cell, and the cell's raw content on one line of `CodeEditor`, highlighted by the
 * caller's tokenizer. Enter or the confirm button commits the content, Escape or the cancel button
 * restores it, and the caller's evaluation shows the result; the library evaluates nothing.
 */
export declare function FormulaBar({ cell, value, onCommit, onCellChange, rowCount, columnCount, tokenize, completions, evaluate, placeholder, isReadOnly, isDisabled, className, ...rest }: FormulaBarProps): import("react").JSX.Element;
//# sourceMappingURL=formula-bar.d.ts.map