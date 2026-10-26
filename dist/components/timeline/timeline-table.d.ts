import type { Key, Selection, SelectionMode } from '../../core/props.js';
import { type TimelineItem } from './timeline-geometry.js';
import { type TimelineRow } from './timeline-rows.js';
export interface TimelineTableProps {
    label: string | undefined;
    labelledBy: string | undefined;
    rows: readonly TimelineRow[];
    items: readonly TimelineItem[];
    selectionMode: SelectionMode;
    selectedKeys: ReadonlySet<Key>;
    onSelectionChange: (keys: Selection) => void;
}
/**
 * The table view of a timeline's items, in row order and then by first day: the same items and
 * selection as the chart, read as a sortable table.
 */
export declare function TimelineTable({ label, labelledBy, rows, items, selectionMode, selectedKeys, onSelectionChange, }: TimelineTableProps): import("react").JSX.Element;
//# sourceMappingURL=timeline-table.d.ts.map