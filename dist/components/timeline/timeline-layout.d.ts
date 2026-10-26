import type { Key } from '../../core/props.js';
import { type ReadItem, type TimelineAxis, type TimelineDependency, type TimelineItem, type TimelineItemChange, type TimelineRange, type TimelineScale } from './timeline-geometry.js';
import type { VisibleRow } from './timeline-rows.js';
/** An item on a visible row, with its edges in pixels. */
export interface PlacedItem {
    item: TimelineItem;
    read: ReadItem;
    rowIndex: number;
    left: number;
    right: number;
}
/** The items an item depends on, and whether it starts before one of them ends. */
export interface ItemPredecessors {
    names: string[];
    hasConflict: boolean;
}
export interface TimelineConnector {
    key: string;
    path: string;
    hasConflict: boolean;
}
export interface TimelineLayout {
    /** The placed items of each visible row, by row id. */
    rowItems: Map<Key, PlacedItem[]>;
    connectors: TimelineConnector[];
    predecessors: Map<Key, ItemPredecessors>;
}
export interface TimelineLayoutOptions {
    axis: TimelineAxis;
    rows: readonly VisibleRow[];
    items: readonly TimelineItem[];
    dependencies: readonly TimelineDependency[];
    rowHeight: number;
}
/**
 * The visible rows' items, placed on the axis in their rows, the connectors between visible items,
 * and each item's predecessors. Items whose row is hidden or whose first day is not a date are left
 * out; their dependencies still count toward descriptions.
 */
export declare function resolveTimelineLayout(options: TimelineLayoutOptions): TimelineLayout;
/**
 * The axis over the timeline's range (resolved from the items as given, so a drag never shifts it)
 * and the layout of its visible rows, with a drag in progress shown in place of the item's days.
 */
export declare function layoutTimeline(options: Omit<TimelineLayoutOptions, 'axis'> & {
    draft: TimelineItemChange | null;
    range: TimelineRange | undefined;
    scale: TimelineScale;
    today: string;
    locale: string;
}): {
    axis: TimelineAxis;
    layout: TimelineLayout;
};
//# sourceMappingURL=timeline-layout.d.ts.map