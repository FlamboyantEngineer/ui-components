// Places the timeline's items on its visible rows and draws its dependencies (specs/TIMELINE.md).

import type { Key } from '../../core/props.js';
import { requireDefined } from '../../utils/require-defined.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import {
  createTimelineAxis,
  isDependencyConflict,
  isInTimelineRange,
  type ReadItem,
  readTimelineItem,
  resolveConnectorPath,
  resolveItemSpan,
  resolveTimelineRange,
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

interface TimelineConnector {
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

interface TimelineLayoutOptions {
  axis: TimelineAxis;
  rows: readonly VisibleRow[];
  items: readonly TimelineItem[];
  dependencies: readonly TimelineDependency[];
  rowHeight: number;
  /** A drag in progress, read in place of its item's days; the item itself stays the source. */
  draft?: TimelineItemChange | null | undefined;
}

interface ReadTimelineEntry {
  item: TimelineItem;
  read: ReadItem | null;
  /** The item's own days without a draft, which decide whether the range shows it. */
  source: ReadItem | null;
}

function placeItems(
  axis: TimelineAxis,
  rows: readonly VisibleRow[],
  items: ReadonlyMap<Key, ReadTimelineEntry>,
): Map<Key, PlacedItem> {
  const rowIndex = new Map(rows.map((entry, index) => [entry.row.id, index]));
  const placed = new Map<Key, PlacedItem>();
  for (const { item, read, source } of items.values()) {
    const index = rowIndex.get(item.rowId);
    // A drag out of the range keeps its item, held at the range's end, until it is released.
    if (!read || !source || index === undefined || !isInTimelineRange(axis, source)) continue;
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
  const { axis, rows, items, dependencies, rowHeight, draft } = options;
  const readEntry = (item: TimelineItem) => {
    const source = readTimelineItem(item);
    const isDrafted = draft && item.id === draft.id;
    return { item, source, read: isDrafted ? readTimelineItem({ ...item, ...draft }) : source };
  };
  const indexed = new Map(items.map((item) => [item.id, readEntry(item)]));
  const placed = placeItems(axis, rows, indexed);
  const rowItems = new Map<Key, PlacedItem[]>(rows.map((entry) => [entry.row.id, []]));
  for (const entry of placed.values()) requireDefined(rowItems.get(entry.item.rowId)).push(entry);
  const centre = (entry: PlacedItem) => entry.rowIndex * rowHeight + rowHeight / 2;
  const connectors = dependencies.flatMap(({ from, to }) => {
    const [source, target] = [placed.get(from), placed.get(to)];
    if (!source || !target) return [];
    const points = { x1: source.right, y1: centre(source), x2: target.left, y2: centre(target) };
    return [
      {
        key: JSON.stringify([toKeyIdentity(from), toKeyIdentity(to)]),
        path: resolveConnectorPath({ ...points, rowHeight }),
        hasConflict: isDependencyConflict(source.read, target.read),
      },
    ];
  });
  return { rowItems, connectors, predecessors: collectPredecessors(indexed, dependencies) };
}

/**
 * The axis over the timeline's range (resolved from the items as given, so a drag never shifts it)
 * and the layout of its visible rows, with a drag in progress shown in place of the item's days.
 * `null` while the range cannot be resolved (`resolveTimelineRange`).
 */
export function layoutTimeline(
  options: Omit<TimelineLayoutOptions, 'axis'> & {
    draft: TimelineItemChange | null;
    range: TimelineRange | undefined;
    scale: TimelineScale;
    today: string | null;
    locale: string;
  },
): { axis: TimelineAxis; layout: TimelineLayout } | null {
  const { items, range, scale, today, locale } = options;
  const resolved = resolveTimelineRange({ range, items, scale, today, locale });
  if (!resolved) return null;
  const axis = createTimelineAxis(resolved, scale, locale);
  return {
    axis,
    layout: resolveTimelineLayout({ ...options, axis }),
  };
}
