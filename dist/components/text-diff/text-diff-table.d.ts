import type { ReactNode } from 'react';
import type { DiffBlock, FoldRow, SplitRow, TextDiffLine, UnifiedRow } from './diff-rows.js';
/** The side a table draws: the old text, the new text, or both in one unified table. */
export type TableSide = 'old' | 'new' | 'both';
export interface TableOptions {
    /** Prefix of the rows' ids. */
    baseId: string;
    /** The change the reader moved to. */
    current: number | null;
    renderLineWidget: ((line: TextDiffLine) => ReactNode) | undefined;
    onExpand: (fold: FoldRow) => void;
}
/** The id of the row that draws a line on one side. */
export declare function getRowId(baseId: string, side: TableSide, key: string): string;
/** The id of a change's first row: its first added line in a split diff, when it adds any. */
export declare function getChangeRowId(baseId: string, block: Extract<DiffBlock, {
    kind: 'change';
}>, isSplit: boolean): string;
/** Both texts in one table: each change's removed lines, then its added lines. */
export declare function UnifiedTable({ rows, options }: {
    rows: UnifiedRow[];
    options: TableOptions;
}): import("react").JSX.Element;
/** One side of a split diff; a line the other side has alone leaves an empty filler row. */
export declare function SplitTable({ rows, side, options, }: {
    rows: SplitRow[];
    side: 'old' | 'new';
    options: TableOptions;
}): import("react").JSX.Element;
//# sourceMappingURL=text-diff-table.d.ts.map