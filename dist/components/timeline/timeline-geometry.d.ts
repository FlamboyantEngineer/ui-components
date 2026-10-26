import type { Key, Tone } from '../../core/props.js';
import { type TimeScale, type TimeScaleUnit } from '../../utils/time-scale.js';
/** The zoom level: the calendar unit of the scale's lower header row and of a keyboard step. */
export type TimelineScale = 'day' | 'week' | 'month' | 'quarter';
/** A `bar` spans its first to its last day; a `milestone` marks one day. */
export type TimelineItemKind = 'bar' | 'milestone';
/** An item on a row: a bar or a milestone. */
export interface TimelineItem {
    /** Identifies the item. */
    id: Key;
    /** The row it sits on. */
    rowId: Key;
    /** Its name, shown on it and read as its accessible name. */
    label: string;
    /** The first day (`YYYY-MM-DD`), or a milestone's day. */
    start: string;
    /** A bar's last day, included (`YYYY-MM-DD`). Missing or before `start`, the bar lasts one day. */
    end?: string | undefined;
    /** Defaults to `bar`. */
    kind?: TimelineItemKind | undefined;
    /** How far a bar has come, from 0 to 1. */
    progress?: number | undefined;
    /** The item's tone, published for the stylesheet. Defaults to `neutral`. */
    tone?: Tone | undefined;
    /** Keeps the item from being moved or resized. */
    isReadOnly?: boolean | undefined;
}
/** An item's new days after a move or a resize. A milestone's `end` equals its `start`. */
export interface TimelineItemChange {
    id: Key;
    start: string;
    end: string;
}
/** A finish-to-start dependency: `to` follows `from`. */
export interface TimelineDependency {
    from: Key;
    to: Key;
}
/** The days a timeline shows, both included, as `YYYY-MM-DD` dates. */
export interface TimelineRange {
    start: string;
    end: string;
}
/** What a dragged pointer grabbed: the whole item, or one end of a bar. */
export type TimelineDragEdge = 'move' | 'start' | 'end';
/** An item read with its kind and a last day never before its first. */
export interface ReadItem {
    id: Key;
    kind: TimelineItemKind;
    start: string;
    end: string;
}
/** The horizontal geometry: a UTC time scale from the first day to the day after the last. */
export interface TimelineAxis {
    scale: TimeScale;
    range: TimelineRange;
    /** The day after the range's last day, where the scale ends. */
    until: string;
    dayWidth: number;
    width: number;
}
/** A cell of a scale header row: the unit's first day (or the range's) and its extent, in pixels. */
export interface TimelineScaleCell {
    start: string;
    left: number;
    width: number;
}
export interface ConnectorPoints {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    rowHeight: number;
}
interface ScalePlan {
    /** Pixels per day. */
    dayWidth: number;
    /** The unit of the upper header row. */
    major: TimeScaleUnit;
    /** The unit of the lower header row, the gridlines and a keyboard step. */
    minor: TimeScaleUnit;
}
/** The scale plans of the zoom levels. */
export declare const timelineScales: Readonly<Record<TimelineScale, ScalePlan>>;
/** Whether a text is a real `YYYY-MM-DD` date. */
export declare function isTimelineDate(text: string | undefined): text is string;
/** An item's kind and days; `null` when its first day is not a date. */
export declare function readTimelineItem(item: TimelineItem): ReadItem | null;
/**
 * The caller's range when it is readable; otherwise the items' first to last day (today when there
 * are none), widened to whole units of the scale plus one unit on each side.
 */
export declare function resolveTimelineRange(options: {
    range: TimelineRange | undefined;
    items: readonly TimelineItem[];
    scale: TimelineScale;
    today: string;
    locale: string;
}): TimelineRange;
export declare function createTimelineAxis(range: TimelineRange, scale: TimelineScale, locale: string): TimelineAxis;
/** The cells of a header row of `unit`: whole units, with partial ones at the range's ends. */
export declare function resolveScaleCells(axis: TimelineAxis, unit: TimeScaleUnit): TimelineScaleCell[];
/** A bar's left and right edges, or a milestone's day centre as both, in pixels. */
export declare function resolveItemSpan(axis: TimelineAxis, item: ReadItem): {
    left: number;
    right: number;
};
/**
 * The change an arrow key asks for: Left and Right move the item by one unit of the scale, keeping
 * a bar's length in days; with Shift they move a bar's last day, never before its first. `null`
 * for any other key, and for Shift with a milestone.
 */
export declare function resolveKeyboardChange(item: ReadItem, key: {
    key: string;
    shiftKey: boolean;
}, scale: TimelineScale): TimelineItemChange | null;
/** The change a pointer drag of `days` whole days asks for, by what it grabbed. */
export declare function resolveDragChange(item: ReadItem, edge: TimelineDragEdge, days: number): TimelineItemChange;
/** A dependency is in conflict when the item that follows starts before the one it follows ends. */
export declare function isDependencyConflict(from: ReadItem, to: ReadItem): boolean;
/**
 * An orthogonal connector from the end of one item to the start of another, ending in an arrow
 * head. When the target starts too close or before the source ends, the path steps back along the
 * boundary of the target's row.
 */
export declare function resolveConnectorPath({ x1, y1, x2, y2, rowHeight }: ConnectorPoints): string;
export {};
//# sourceMappingURL=timeline-geometry.d.ts.map