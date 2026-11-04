'use client';

import { useState } from 'react';
import { useToday } from '../../core/clock.js';
import { useControllableState } from '../../core/controllable-state.js';
import type { AriaLabellingProps, ExpansionProps, SelectionProps } from '../../core/events.js';
import type { BaseProps, Key, RefProps, Selection, SelectionMode } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useLocale } from '../../primitives/index.js';
import { TimelineChart, type TimelineChartActions } from './timeline-chart.js';
import type {
  TimelineDependency,
  TimelineItem,
  TimelineItemChange,
  TimelineRange,
  TimelineScale,
} from './timeline-geometry.js';
import { timelineHooks as hooks } from './timeline-hooks.js';
import type { TimelineItemMenu } from './timeline-item-menu.js';
import { layoutTimeline } from './timeline-layout.js';
import type { TimelineRowColumnEntry } from './timeline-row-columns.js';
import { collectGroupKeys, flattenTimelineRows, type TimelineRow } from './timeline-rows.js';
import { TimelineTable } from './timeline-table.js';

export type {
  TimelineDependency,
  TimelineItem,
  TimelineItemChange,
  TimelineItemKind,
  TimelinePerson,
  TimelineRange,
  TimelineScale,
} from './timeline-geometry.js';
export type { TimelineItemMenu } from './timeline-item-menu.js';
export type {
  TimelineRowColumn,
  TimelineRowColumnEntry,
  TimelineRowColumnKind,
  TimelineRowContext,
} from './timeline-row-columns.js';
export type { TimelineRow } from './timeline-rows.js';

/** `chart` draws the items on the time scale; `table` lists them in a table. */
export type TimelineView = 'chart' | 'table';

export interface TimelineProps
  extends
    BaseProps,
    AriaLabellingProps,
    Pick<
      SelectionProps,
      'selectionMode' | 'selectedKeys' | 'defaultSelectedKeys' | 'onSelectionChange'
    >,
    ExpansionProps,
    RefProps<HTMLDivElement> {
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
  /**
   * The day the today marker marks (`YYYY-MM-DD`). Defaults to the current day in the provider's
   * time zone, else the browser's; a server render and its hydration draw no marker.
   */
  today?: string | undefined;
  /** The chart or the table view. Defaults to `chart`. */
  view?: TimelineView | undefined;
  /** The height of every row, in pixels. Defaults to 36. */
  rowHeight?: number | undefined;
  /** Called with an item's new days after a drag or a key moves or resizes it; without it items stay put. */
  onItemChange?: ((change: TimelineItemChange) => void) | undefined;
  /**
   * The entries of an item's context menu in the chart, or a function of the item that returns
   * them. An item without entries keeps the browser's menu. Pair an Edit entry with
   * `TimelineItemEditor`.
   */
  itemMenu?: TimelineItemMenu | undefined;
  /** Called with the key of the entry chosen in an item's menu, and that item. */
  onItemMenuAction?: ((key: Key, item: TimelineItem) => void) | undefined;
  /**
   * Properties shown beside each row's name in the chart, in this order: the built-in `duration`
   * and `dependencies`, or the host's own columns. Defaults to none, the names alone.
   */
  rowColumns?: readonly TimelineRowColumnEntry[] | undefined;
}

type StoredSelection = ReadonlySet<Key> | 'all';

function toStored(keys: Iterable<Key> | 'all' | undefined): StoredSelection | undefined {
  if (keys === undefined) return undefined;
  return keys === 'all' ? 'all' : new Set(keys);
}

/**
 * The selection as it applies now: the stored keys that name a current item, in item order, at
 * most one of them in single mode and none without selection. `all` stands for every current item.
 */
function resolveSelected(
  stored: StoredSelection,
  items: readonly TimelineItem[],
  selectionMode: SelectionMode,
): ReadonlySet<Key> {
  if (selectionMode === 'none') return new Set();
  const ids = items.map((item) => item.id);
  const present = stored === 'all' ? ids : ids.filter((id) => stored.has(id));
  return new Set(selectionMode === 'single' ? present.slice(0, 1) : present);
}

/**
 * The selected items, controlled or not, reconciled with the current items and mode, and a toggle
 * that selects or deselects one item from that reconciled selection.
 */
function useItemSelection(
  props: Pick<
    TimelineProps,
    'selectionMode' | 'selectedKeys' | 'defaultSelectedKeys' | 'onSelectionChange'
  >,
  items: readonly TimelineItem[],
) {
  const { selectionMode = 'none', onSelectionChange } = props;
  const [stored, setStored] = useControllableState<StoredSelection>(
    toStored(props.selectedKeys),
    toStored(props.defaultSelectedKeys) ?? new Set(),
    onSelectionChange
      ? (keys) => onSelectionChange(new Set(resolveSelected(keys, items, selectionMode)))
      : undefined,
  );
  const selected = resolveSelected(stored, items, selectionMode);
  const toggle = (id: Key) => {
    const isSelected = selected.has(id);
    if (selectionMode === 'single') return setStored(new Set(isSelected ? [] : [id]));
    const next = new Set(selected);
    if (isSelected) next.delete(id);
    else next.add(id);
    setStored(next);
  };
  const replace = (keys: Selection) =>
    setStored(resolveSelected(keys === 'all' ? 'all' : new Set(keys), items, selectionMode));
  return { selectionMode, selected, toggle, replace };
}

/** The expanded groups, controlled or not (every group at first), and a change to one group. */
function useRowExpansion(props: ExpansionProps, rows: readonly TimelineRow[]) {
  const { expandedKeys, defaultExpandedKeys, onExpandedChange } = props;
  const [expanded, setExpanded] = useControllableState<ReadonlySet<Key>>(
    expandedKeys === undefined ? undefined : new Set(expandedKeys),
    new Set(defaultExpandedKeys ?? collectGroupKeys(rows)),
    onExpandedChange ? (keys) => onExpandedChange(new Set(keys)) : undefined,
  );
  const change = (id: Key, isExpanded: boolean) => {
    const next = new Set(expanded);
    if (isExpanded) next.add(id);
    else next.delete(id);
    setExpanded(next);
  };
  return { expanded, change };
}

const noColumns: readonly TimelineRowColumnEntry[] = [];

/** Each row's own items, in item order. */
function groupByRow(items: readonly TimelineItem[]) {
  const byRow = new Map<Key, TimelineItem[]>();
  for (const item of items) byRow.set(item.rowId, [...(byRow.get(item.rowId) ?? []), item]);
  return byRow;
}

/** How the chart selects, edits and expands, from the timeline's state and callbacks. */
function toChartActions(
  selection: ReturnType<typeof useItemSelection>,
  onExpandedChange: TimelineChartActions['onExpandedChange'],
  edits: Pick<TimelineChartActions, 'onDraft' | 'itemMenu'> & Pick<TimelineProps, 'onItemChange'>,
): TimelineChartActions {
  const { onItemChange, onDraft, itemMenu } = edits;
  return {
    isSelectable: selection.selectionMode !== 'none',
    selectedKeys: selection.selected,
    onToggleSelection: selection.toggle,
    isEditable: (item) => onItemChange !== undefined && !item.isReadOnly,
    onDraft,
    onCommit: (change) => onItemChange?.(change),
    onExpandedChange,
    itemMenu,
  };
}

/**
 * A Gantt-style timeline: rows of bars and milestones on a zoomable time scale, with progress,
 * dependency connectors, a today marker and collapsible row groups. Items move and resize by pointer
 * and keyboard, and the same items read as a table in the table view.
 */
export function Timeline({
  rows,
  items,
  dependencies = [],
  scale = 'week',
  range,
  today,
  view = 'chart',
  rowHeight = 36,
  onItemChange,
  itemMenu,
  onItemMenuAction,
  rowColumns = noColumns,
  expandedKeys,
  defaultExpandedKeys,
  onExpandedChange,
  className,
  ...rest
}: TimelineProps) {
  const strings = useUiStrings();
  const { locale } = useLocale();
  const { selectionMode, selectedKeys, defaultSelectedKeys, onSelectionChange, ...elementProps } =
    rest;
  const selection = useItemSelection(rest, items);
  const expansion = useRowExpansion({ expandedKeys, defaultExpandedKeys, onExpandedChange }, rows);
  const [draft, setDraft] = useState<TimelineItemChange | null>(null);
  const currentDay = useToday();
  const day = today ?? currentDay;
  const named = rest['aria-label'] !== undefined || rest['aria-labelledby'] !== undefined;
  const actions = toChartActions(selection, expansion.change, {
    onItemChange,
    onDraft: setDraft,
    itemMenu: { entries: itemMenu, onAction: onItemMenuAction },
  });
  const visibleRows = flattenTimelineRows(rows, expansion.expanded);
  const laidOut = layoutTimeline({
    rows: visibleRows,
    items,
    draft,
    dependencies,
    range,
    scale,
    today: day,
    locale,
    rowHeight,
  });
  return (
    <div
      role="group"
      aria-label={named ? undefined : strings.timeline}
      {...elementProps}
      {...hooks.root({ className, props: elementProps, data: { scale, view } })}
      aria-busy={(view === 'chart' && !laidOut) || undefined}
    >
      {view === 'table' ? (
        <TimelineTable
          label={rest['aria-label'] ?? (named ? undefined : strings.timeline)}
          labelledBy={rest['aria-labelledby']}
          rows={rows}
          items={items}
          selectionMode={selection.selectionMode}
          selectedKeys={selection.selected}
          onSelectionChange={selection.replace}
        />
      ) : laidOut ? (
        <TimelineChart
          axis={laidOut.axis}
          scale={scale}
          rows={visibleRows}
          layout={laidOut.layout}
          rowHeight={rowHeight}
          today={day}
          actions={actions}
          rowColumns={rowColumns}
          itemsByRow={groupByRow(items)}
        />
      ) : null}
    </div>
  );
}
