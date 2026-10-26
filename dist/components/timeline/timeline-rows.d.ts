import type { Key } from '../../core/props.js';
/** A row of the timeline; a row with children is a group that collapses. */
export interface TimelineRow {
    /** Identifies the row; items name it as their `rowId`. */
    id: Key;
    /** The row's name, in the row list and the table view. */
    label: string;
    /** Nested rows. */
    children?: readonly TimelineRow[] | undefined;
}
/** A row on screen, with its depth from 1 and whether it is an expanded group. */
export interface VisibleRow {
    row: TimelineRow;
    level: number;
    hasChildren: boolean;
    isExpanded: boolean;
}
/**
 * The rows on screen in display order, with their depth: the rows whose groups are all in
 * `expandedKeys`, or every row when it is not given.
 */
export declare function flattenTimelineRows(rows: readonly TimelineRow[], expandedKeys?: ReadonlySet<Key>): VisibleRow[];
/** The ids of every group, expanded by default. */
export declare function collectGroupKeys(rows: readonly TimelineRow[]): Key[];
//# sourceMappingURL=timeline-rows.d.ts.map