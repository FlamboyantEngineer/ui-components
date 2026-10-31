'use client';

import { useId } from 'react';
import { useLocale } from '../../primitives/index.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { measuredProperty } from '../../core/hooks.js';
import type { Key } from '../../core/props.js';
import { ExpandToggle } from '../expand-toggle/expand-toggle.js';
import {
  resolveScaleCells,
  timelineScales,
  toInlineStart,
  type TimelineAxis,
  type TimelineItem,
  type TimelineItemChange,
  type TimelineScale,
} from './timeline-geometry.js';
import { TimelineHeader } from './timeline-header.js';
import { timelineHooks as hooks } from './timeline-hooks.js';
import { TimelineItemButton } from './timeline-item.js';
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

interface TimelineChartProps {
  axis: TimelineAxis;
  scale: TimelineScale;
  rows: readonly VisibleRow[];
  layout: TimelineLayout;
  rowHeight: number;
  /** The day the today marker marks, or `null` for no marker. */
  today: string | null;
  actions: TimelineChartActions;
}

interface RowListProps {
  rows: readonly VisibleRow[];
  rowHeight: number;
  labelId: (index: number) => string;
  onExpandedChange: (id: Key, isExpanded: boolean) => void;
}

/** The row names at the start, pinned to the viewport's start while the chart scrolls sideways. */
function TimelineRowList({ rows, rowHeight, labelId, onExpandedChange }: RowListProps) {
  const isRtl = useLocale().direction === 'rtl';
  return (
    <div
      {...hooks.slot('list')}
      style={{ position: 'sticky', ...toInlineStart(0, isRtl), zIndex: 1 }}
    >
      {rows.map(({ row, level, hasChildren, isExpanded }, index) => (
        <div
          key={toKeyIdentity(row.id)}
          {...hooks.slot('row-label', { group: hasChildren, expanded: isExpanded })}
          style={{ height: rowHeight, ...measuredProperty('timeline-level', String(level)) }}
        >
          <ExpandToggle
            className={hooks.slotClass('toggle')}
            isExpandable={hasChildren}
            isExpanded={isExpanded}
            label={row.label}
            onExpandedChange={(next) => onExpandedChange(row.id, next)}
          />
          <span {...hooks.slot('row-name')} id={labelId(index)}>
            {row.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Gridlines at the starts of the scale's units and the today marker, behind the rows. */
function TimelineGuides({
  axis,
  scale,
  today,
}: Pick<TimelineChartProps, 'axis' | 'scale' | 'today'>) {
  const isRtl = useLocale().direction === 'rtl';
  const plan = timelineScales[scale];
  const majorStarts = new Set(resolveScaleCells(axis, plan.major).map((cell) => cell.start));
  const isTodayShown = today !== null && today >= axis.range.start && today <= axis.range.end;
  return (
    <>
      {resolveScaleCells(axis, plan.minor).map((cell) => (
        <span
          key={cell.start}
          {...hooks.slot('gridline', { major: majorStarts.has(cell.start) })}
          style={{ position: 'absolute', top: 0, bottom: 0, ...toInlineStart(cell.left, isRtl) }}
          aria-hidden="true"
        />
      ))}
      {isTodayShown ? (
        <span
          {...hooks.slot('today')}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            ...toInlineStart(axis.scale.map(today) + axis.dayWidth / 2, isRtl),
          }}
          aria-hidden="true"
        />
      ) : null}
    </>
  );
}

/** The dependency connectors, drawn behind the items. */
function TimelineConnectors({
  axis,
  layout,
  height,
}: {
  axis: TimelineAxis;
  layout: TimelineLayout;
  height: number;
}) {
  const isRtl = useLocale().direction === 'rtl';
  return (
    <svg
      {...hooks.slot('connectors')}
      width={axis.width}
      height={height}
      style={{ position: 'absolute', top: 0, ...toInlineStart(0, isRtl), pointerEvents: 'none' }}
      aria-hidden="true"
      focusable="false"
    >
      {/* Paths run from the axis's start; right to left they are mirrored onto the flipped axis. */}
      <g transform={isRtl ? `translate(${axis.width} 0) scale(-1 1)` : undefined}>
        {layout.connectors.map((connector) => (
          <path
            key={connector.key}
            {...hooks.slot('connector', { conflict: connector.hasConflict })}
            d={connector.path}
            fill="none"
          />
        ))}
      </g>
    </svg>
  );
}

/**
 * The scrolling chart: a viewport holding the pinned corner, time scale and row list around the
 * rows of bars, milestones and dependency connectors.
 */
export function TimelineChart({
  axis,
  scale,
  rows,
  layout,
  rowHeight,
  today,
  actions,
}: TimelineChartProps) {
  const isRtl = useLocale().direction === 'rtl';
  const baseId = useId();
  const labelId = (index: number) => `${baseId}-row-${index}`;
  return (
    <div {...hooks.slot('viewport')}>
      <div {...hooks.slot('canvas')} style={{ gridTemplateColumns: `auto ${axis.width}px` }}>
        <div
          {...hooks.slot('corner')}
          style={{ position: 'sticky', top: 0, ...toInlineStart(0, isRtl), zIndex: 3 }}
        />
        <TimelineHeader axis={axis} scale={scale} />
        <TimelineRowList
          rows={rows}
          rowHeight={rowHeight}
          labelId={labelId}
          onExpandedChange={actions.onExpandedChange}
        />
        <div
          {...hooks.slot('body')}
          style={{
            position: 'relative',
            zIndex: 0,
            width: axis.width,
            height: rows.length * rowHeight,
          }}
        >
          <TimelineGuides axis={axis} scale={scale} today={today} />
          <TimelineConnectors axis={axis} layout={layout} height={rows.length * rowHeight} />
          {rows.map(({ row }, index) => (
            <div
              key={toKeyIdentity(row.id)}
              {...hooks.slot('row')}
              role="group"
              aria-labelledby={labelId(index)}
              style={{ position: 'relative', height: rowHeight }}
            >
              {layout.rowItems.get(row.id)?.map((placed) => (
                <TimelineItemButton
                  key={toKeyIdentity(placed.item.id)}
                  placed={placed}
                  predecessors={layout.predecessors.get(placed.item.id)}
                  scale={scale}
                  dayWidth={axis.dayWidth}
                  isEditable={actions.isEditable(placed.item)}
                  selection={{
                    isSelectable: actions.isSelectable,
                    isSelected: actions.selectedKeys.has(placed.item.id),
                    onToggle: actions.onToggleSelection,
                  }}
                  onDraft={actions.onDraft}
                  onCommit={actions.onCommit}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
