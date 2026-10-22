// Places the timeline's items on its visible rows and draws its dependencies (specs/TIMELINE.md).

import type { Key } from '../../core/props.js';
import {
  createTimelineAxis,
  isDependencyConflict,
  readTimelineItem,
  resolveConnectorPath,
  resolveItemSpan,
  resolveTimelineRange,
  type ReadItem,
  type TimelineAxis,
  type TimelineDependency,
  type TimelineItem,
  type TimelineItemChange,
  type TimelineRange,
  type TimelineScale,
} from './timeline-geometry.js';
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

interface ReadTimelineEntry {
  item: TimelineItem;
  read: ReadItem | null;
}

function placeItems(
  axis: TimelineAxis,
  rows: readonly VisibleRow[],
  items: ReadonlyMap<Key, ReadTimelineEntry>,
): Map<Key, PlacedItem> {
  const rowIndex = new Map(rows.map((entry, index) => [entry.row.id, index]));
  const placed = new Map<Key, PlacedItem>();
  for (const { item, read } of items.values()) {
    const index = rowIndex.get(item.rowId);
    if (!read || index === undefined) continue;
    placed.set(item.id, { item, read, rowIndex: index, ...resolveItemSpan(axis, read) });
  }
  return placed;
}

function collectPredecessors(
  items: ReadonlyMap<Key, ReadTimelineEntry>,
  dependencies: readonly TimelineDependency[],
): Map<Key, ItemPredecessors> {
  const result = new Map<Key, ItemPredecessors>();
  for (const { from, to } of dependencies) {
    const source = items.get(from);
    const target = items.get(to);
    if (!source?.read || !target?.read) continue;
    const entry = result.get(to) ?? { names: [], hasConflict: false };
    entry.names.push(source.item.label);
    entry.hasConflict ||= isDependencyConflict(source.read, target.read);
    result.set(to, entry);
  }
  return result;
}

/**
 * The visible rows' items, placed on the axis in their rows, the connectors between visible items,
 * and each item's predecessors. Items whose row is hidden or whose first day is not a date are left
 * out; their dependencies still count toward descriptions.
 */
export function resolveTimelineLayout(options: TimelineLayoutOptions): TimelineLayout {
  const { axis, rows, items, dependencies, rowHeight } = options;
  const indexed = new Map(items.map((item) => [item.id, { item, read: readTimelineItem(item) }]));
  const placed = placeItems(axis, rows, indexed);
  const rowItems = new Map<Key, PlacedItem[]>(rows.map((entry) => [entry.row.id, []]));
  for (const entry of placed.values()) rowItems.get(entry.item.rowId)!.push(entry);
  const centre = (entry: PlacedItem) => entry.rowIndex * rowHeight + rowHeight / 2;
  const connectors = dependencies.flatMap(({ from, to }) => {
    const [source, target] = [placed.get(from), placed.get(to)];
    if (!source || !target) return [];
    const points = { x1: source.right, y1: centre(source), x2: target.left, y2: centre(target) };
    return [
      {
        key: `${from}>${to}`,
        path: resolveConnectorPath({ ...points, rowHeight }),
        hasConflict: isDependencyConflict(source.read, target.read),
      },
    ];
  });
  return { rowItems, connectors, predecessors: collectPredecessors(indexed, dependencies) };
}

function applyDraft(items: readonly TimelineItem[], draft: TimelineItemChange | null) {
  if (!draft) return items;
  return items.map((item) => (item.id === draft.id ? { ...item, ...draft } : item));
}

/**
 * The axis over the timeline's range (resolved from the items as given, so a drag never shifts it)
 * and the layout of its visible rows, with a drag in progress shown in place of the item's days.
 */
export function layoutTimeline(
  options: Omit<TimelineLayoutOptions, 'axis'> & {
    draft: TimelineItemChange | null;
    range: TimelineRange | undefined;
    scale: TimelineScale;
    today: string;
    locale: string;
  },
): { axis: TimelineAxis; layout: TimelineLayout } {
  const { items, draft, range, scale, today, locale } = options;
  const axis = createTimelineAxis(
    resolveTimelineRange({ range, items, scale, today, locale }),
    scale,
    locale,
  );
  return {
    axis,
    layout: resolveTimelineLayout({ ...options, axis, items: applyDraft(items, draft) }),
  };
}
