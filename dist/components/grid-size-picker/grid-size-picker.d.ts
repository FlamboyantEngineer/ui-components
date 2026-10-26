import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type GridSize } from './grid-size.js';
export type { GridSize } from './grid-size.js';
export interface GridSizePickerProps extends BaseProps, AriaLabellingProps {
    /** Called with the size of the cell the reader presses, or of the focused cell on Enter or Space. */
    onSelect: (size: GridSize) => void;
    /** The most rows the grid grows to. Defaults to 10. */
    maxRows?: number | undefined;
    /** The most columns the grid grows to. Defaults to 10. */
    maxColumns?: number | undefined;
    /** The rows shown before the grid grows one row past the previewed size. Defaults to 5. */
    minRows?: number | undefined;
    /** The columns shown before the grid grows one column past the previewed size. Defaults to 5. */
    minColumns?: number | undefined;
    /** Leaves the grid out of the tab order and ignores presses and keys. */
    isDisabled?: boolean | undefined;
    /** Focuses the first cell when the picker mounts. */
    autoFocus?: boolean | undefined;
}
/**
 * Chooses a number of rows and columns, as for a new table, from a grid of cells: hovering or
 * focusing a cell previews its size, shown in a readout such as `3 × 4`, and the grid grows one row
 * and column past the preview up to its maximum. Arrow keys, Home and End move the preview; a press
 * chooses the pressed cell, and Enter or Space the focused one.
 */
export declare function GridSizePicker({ onSelect, maxRows, maxColumns, minRows, minColumns, isDisabled, autoFocus, className, id, ...rest }: GridSizePickerProps): import("react").JSX.Element;
//# sourceMappingURL=grid-size-picker.d.ts.map