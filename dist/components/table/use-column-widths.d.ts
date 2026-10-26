import type { Key } from '../../core/props.js';
import { type TableColumnSizing, type TableColumnWidths } from './column-sizing.js';
export interface ColumnWidthsOptions {
    columns: readonly TableColumnSizing[];
    /** Storage key for the widths a resize leaves; without it they last while the table is mounted. */
    persistKey?: string | undefined;
    onColumnWidthsChange?: ((widths: TableColumnWidths) => void) | undefined;
}
export interface ColumnWidths {
    /** Widths set by resizing, by column id: live during a gesture, then the stored ones. */
    widths: TableColumnWidths;
    onResize: (widths: Map<Key, unknown>) => void;
    onResizeEnd: (widths: Map<Key, unknown>) => void;
}
/**
 * Column widths for a resizable table: previewed live while a column is being resized, then kept
 * (and persisted under `persistKey`) and reported once when the gesture ends.
 */
export declare function useColumnWidths(options: ColumnWidthsOptions): ColumnWidths;
//# sourceMappingURL=use-column-widths.d.ts.map