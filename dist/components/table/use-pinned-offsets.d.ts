import type { TableColumnPin } from './table-rows.js';
/** How far each pinned column sits from its edge, in pixels, by column key. */
export type TablePinOffsets = Readonly<Record<string, number>>;
/** A drawn column's key, width in pixels and pin, in display order. */
export interface PinnedColumnWidth {
    key: string;
    width: number;
    pin: TableColumnPin | undefined;
}
export interface PinnedOffsets {
    offsets: TablePinOffsets;
    /** Takes freshly computed offsets, keeping the current ones when nothing moved. */
    report: (offsets: TablePinOffsets) => void;
}
/**
 * Each pinned column's distance from its edge: the summed widths of the columns pinned to the
 * same edge between it and that edge.
 */
export declare function computePinOffsets(columns: readonly PinnedColumnWidth[]): TablePinOffsets;
/** The offsets of a table's pinned columns, as the header last reported them. */
export declare function usePinnedOffsets(isActive: boolean): PinnedOffsets;
//# sourceMappingURL=use-pinned-offsets.d.ts.map