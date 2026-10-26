import { type Ref } from 'react';
import type { AriaLabellingProps, ExpansionProps, SelectionProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type TimelineDependency, type TimelineItem, type TimelineItemChange, type TimelineRange, type TimelineScale } from './timeline-geometry.js';
import { type TimelineRow } from './timeline-rows.js';
export type { TimelineDependency, TimelineItem, TimelineItemChange, TimelineItemKind, TimelineRange, TimelineScale, } from './timeline-geometry.js';
export type { TimelineRow } from './timeline-rows.js';
/** `chart` draws the items on the time scale; `table` lists them in a table. */
export type TimelineView = 'chart' | 'table';
export interface TimelineProps extends BaseProps, AriaLabellingProps, Pick<SelectionProps, 'selectionMode' | 'selectedKeys' | 'defaultSelectedKeys' | 'onSelectionChange'>, ExpansionProps {
    /** The rows, top to bottom; rows with children are groups that collapse. */
    rows: readonly TimelineRow[];
    /** The bars and milestones, each on a row. */
    items: readonly TimelineItem[];
    /** Finish-to-start dependencies, drawn as connectors between items. */
    dependencies?: readonly TimelineDependency[] | undefined;
    /** The zoom level. Defaults to `week`. */
    scale?: TimelineScale | undefined;
    /** The days shown. Defaults to the items' days widened to whole units of the scale, plus one on each side. */
    range?: TimelineRange | undefined;
    /** The day the today marker marks (`YYYY-MM-DD`). Defaults to the current day in the local time zone. */
    today?: string | undefined;
    /** The chart or the table view. Defaults to `chart`. */
    view?: TimelineView | undefined;
    /** The height of every row, in pixels. Defaults to 36. */
    rowHeight?: number | undefined;
    /** Called with an item's new days after a drag or a key moves or resizes it; without it items stay put. */
    onItemChange?: ((change: TimelineItemChange) => void) | undefined;
    /** The root element. */
    ref?: Ref<HTMLDivElement> | undefined;
}
/**
 * A Gantt-style timeline: rows of bars and milestones on a zoomable time scale, with progress,
 * dependency connectors, a today marker and collapsible row groups. Items move and resize by pointer
 * and keyboard, and the same items read as a table in the table view.
 */
export declare function Timeline({ rows, items, dependencies, scale, range, today, view, rowHeight, onItemChange, expandedKeys, defaultExpandedKeys, onExpandedChange, className, ...rest }: TimelineProps): import("react").JSX.Element;
//# sourceMappingURL=timeline.d.ts.map