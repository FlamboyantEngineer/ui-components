import { useMemo } from 'react';
import type { Key } from '../../core/props.js';
import type { TimelineProps } from './timeline.js';
import {
  createTimelineAxis,
  resolveScaleCells,
  resolveTimelineRange,
  type TimelineAxis,
  type TimelineDependency,
  type TimelineItem,
  type TimelineItemChange,
  type TimelineScale,
  type TimelineScaleCells,
  timelineScales,
} from './timeline-geometry.js';
import { resolveTimelineLayout, type TimelineLayout } from './timeline-layout.js';
import { flattenTimelineRows, type VisibleRow } from './timeline-rows.js';

export interface TimelineChartModel {
  axis: TimelineAxis;
  cells: TimelineScaleCells;
  rows: readonly VisibleRow[];
  itemsByRow: ReadonlyMap<Key, readonly TimelineItem[]> | null;
  layout: TimelineLayout;
}

interface TimelineChartOptions extends Pick<TimelineProps, 'rows' | 'items' | 'range' | 'view'> {
  expanded: ReadonlySet<Key>;
  draft: TimelineItemChange | null;
  dependencies: readonly TimelineDependency[];
  scale: TimelineScale;
  today: string | null;
  locale: string;
  rowHeight: number;
  hasRowColumns: boolean;
}

/** Each row's own items, in item order. */
function groupByRow(items: readonly TimelineItem[]) {
  const byRow = new Map<Key, TimelineItem[]>();
  for (const item of items) {
    const group = byRow.get(item.rowId);
    if (group) group.push(item);
    else byRow.set(item.rowId, [item]);
  }
  return byRow;
}

/** The chart's stable scale and visible rows, derived only when the chart is shown. */
export function useTimelineChart({
  rows: sourceRows,
  items,
  range,
  view,
  expanded,
  draft,
  dependencies,
  scale,
  today,
  locale,
  rowHeight,
  hasRowColumns,
}: TimelineChartOptions): TimelineChartModel | null {
  const isChart = view === 'chart';
  const resolved = useMemo(
    () => (isChart ? resolveTimelineRange({ range, items, scale, today, locale }) : null),
    [isChart, range, items, scale, today, locale],
  );
  // A replacement range object or an item edit within the same dates keeps the drawn scale.
  const start = resolved?.start;
  const end = resolved?.end;
  const axis = useMemo(
    () => (start && end ? createTimelineAxis({ start, end }, scale, locale) : null),
    [start, end, scale, locale],
  );
  const cells = useMemo(() => {
    if (!axis) return null;
    const { major, minor } = timelineScales[scale];
    return { major: resolveScaleCells(axis, major), minor: resolveScaleCells(axis, minor) };
  }, [axis, scale]);
  const rows = useMemo(
    () => (isChart ? flattenTimelineRows(sourceRows, expanded) : []),
    [isChart, sourceRows, expanded],
  );
  const itemsByRow = useMemo(
    () => (isChart && hasRowColumns ? groupByRow(items) : null),
    [isChart, hasRowColumns, items],
  );
  const layout = useMemo(
    () => axis && resolveTimelineLayout({ axis, rows, items, dependencies, rowHeight, draft }),
    [axis, rows, items, dependencies, rowHeight, draft],
  );
  return axis && cells && layout ? { axis, cells, rows, itemsByRow, layout } : null;
}
