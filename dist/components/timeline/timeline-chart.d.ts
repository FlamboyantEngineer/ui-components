import type { Key } from '../../core/props.js';
import { type TimelineAxis, type TimelineItem, type TimelineItemChange, type TimelineScale } from './timeline-geometry.js';
import type { TimelineLayout } from './timeline-layout.js';
import type { VisibleRow } from './timeline-rows.js';
/** How the chart selects items, edits them and expands groups. */
export interface TimelineChartActions {
    isSelectable: boolean;
    selectedKeys: ReadonlySet<Key>;
    onToggleSelection: (id: Key) => void;
    isEditable: (item: TimelineItem) => boolean;
    onDraft: (change: TimelineItemChange | null) => void;
    onCommit: (change: TimelineItemChange) => void;
    onExpandedChange: (id: Key, isExpanded: boolean) => void;
}
export interface TimelineChartProps {
    axis: TimelineAxis;
    scale: TimelineScale;
    rows: readonly VisibleRow[];
    layout: TimelineLayout;
    rowHeight: number;
    today: string;
    actions: TimelineChartActions;
}
/**
 * The scrolling chart: a viewport holding the pinned corner, time scale and row list around the
 * rows of bars, milestones and dependency connectors.
 */
export declare function TimelineChart({ axis, scale, rows, layout, rowHeight, today, actions, }: TimelineChartProps): import("react").JSX.Element;
//# sourceMappingURL=timeline-chart.d.ts.map