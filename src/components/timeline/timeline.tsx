'use client';

import { useState, type Ref } from 'react';
import { useLocale } from '../../primitives/index.js';
import { useToday } from '../../core/clock.js';
import { useControllableState } from '../../core/controllable-state.js';
import type { AriaLabellingProps, ExpansionProps, SelectionProps } from '../../core/events.js';
import type { BaseProps, Key, Selection } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { requireDefined } from '../../utils/require-defined.js';
import { TimelineChart, type TimelineChartActions } from './timeline-chart.js';
import {
  type TimelineDependency,
  type TimelineItem,
  type TimelineItemChange,
  type TimelineRange,
  type TimelineScale,
} from './timeline-geometry.js';
import { timelineHooks as hooks } from './timeline-hooks.js';
import { layoutTimeline } from './timeline-layout.js';
import { collectGroupKeys, flattenTimelineRows, type TimelineRow } from './timeline-rows.js';
import { TimelineTable } from './timeline-table.js';

export type {
  TimelineDependency,
  TimelineItem,
  TimelineItemChange,
  TimelineItemKind,
  TimelineRange,
  TimelineScale,
} from './timeline-geometry.js';
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
    ExpansionProps {
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
  /** The root element. */
  ref?: Ref<HTMLDivElement> | undefined;
}

function toKeySet(keys: Iterable<Key> | 'all' | undefined, items: readonly TimelineItem[]) {
  if (keys === undefined) return undefined;
  return new Set<Key>(keys === 'all' ? items.map((item) => item.id) : keys);
}

/** The selected items, controlled or not, and a toggle that selects or deselects one item. */
function useItemSelection(
  props: Pick<
    TimelineProps,
    'selectionMode' | 'selectedKeys' | 'defaultSelectedKeys' | 'onSelectionChange'
  >,
  items: readonly TimelineItem[],
) {
  const { selectionMode = 'none', onSelectionChange } = props;
  const [selected, setSelected] = useControllableState<ReadonlySet<Key>>(
    toKeySet(props.selectedKeys, items),
    toKeySet(props.defaultSelectedKeys, items) ?? new Set(),
    onSelectionChange ? (keys) => onSelectionChange(new Set(keys)) : undefined,
  );
  const toggle = (id: Key) => {
    const isSelected = selected.has(id);
    if (selectionMode === 'single') return setSelected(new Set(isSelected ? [] : [id]));
    const next = new Set(selected);
    if (isSelected) next.delete(id);
    else next.add(id);
    setSelected(next);
  };
  const replace = (keys: Selection) => setSelected(requireDefined(toKeySet(keys, items)));
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
  const actions: TimelineChartActions = {
    isSelectable: selection.selectionMode !== 'none',
    selectedKeys: selection.selected,
    onToggleSelection: selection.toggle,
    isEditable: (item) => onItemChange !== undefined && !item.isReadOnly,
    onDraft: setDraft,
    onCommit: (change) => onItemChange?.(change),
    onExpandedChange: expansion.change,
  };
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
        />
      ) : null}
    </div>
  );
}
