'use client';

import type { KeyboardEvent } from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { clamp } from '../../utils/clamp.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import type { LinearScale } from '../../utils/linear-scale.js';
import { capturePointer } from '../../utils/pointer-drag.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import type { MenuEntry } from '../menu/menu.js';
import { linkedChartHooks as hooks } from './chart-hooks.js';
import type { ChartReferenceLine } from './chart-references.js';
import type { NumericViewport } from './chart-viewport.js';
import { cursorSnapRadius, readCursorSample, snapCursorX } from './cursor-sampling.js';
import { differentialMenu } from './differential-menu.js';
import { findNearestSample } from './linked-channel.js';
import type { DrawnChannel } from './linked-model.js';
import type { useChartCursors } from './use-chart-cursors.js';
import type { useChartDifferentials } from './use-chart-differentials.js';
import type { useReadingSelection } from './use-reading-selection.js';

export interface ChartPlacement extends ReturnType<typeof useChartCursors> {
  differentials: ReturnType<typeof useChartDifferentials>;
  selection: ReturnType<typeof useReadingSelection>;
  markers: readonly ChartReferenceLine[];
  addMarker: (x: number) => void;
  setMarker: (key: Key, x: number) => void;
  removeMarker: (key: Key) => void;
}

interface MovableMark {
  id: string;
  label: string;
  x: number;
  kind: 'cursor' | 'marker';
  tone?: ChartReferenceLine['tone'];
  move: (x: number) => void;
  rename?: ((label: string) => void) | undefined;
  remove?: (() => void) | undefined;
}

export function getChartMarks(
  placement: ChartPlacement,
  lanes: readonly DrawnChannel[],
): MovableMark[] {
  const { cursorList, moveCursor, deleteCursor, markers, setMarker, removeMarker } = placement;
  return [
    ...cursorList.map((c) => ({
      id: 'cursor:' + c.name,
      label: c.label ?? c.name,
      x: c.x,
      kind: 'cursor' as const,
      move: (x: number) => moveCursor(c.name, snapCursorX(lanes, x)),
      rename: (label: string) => placement.renameCursor(c.name, label),
      remove: () => deleteCursor(c.name),
    })),
    ...markers.map((m) => ({
      id: toKeyIdentity(m.id),
      label: m.label,
      x: m.value,
      kind: 'marker' as const,
      tone: m.tone,
      move: (x: number) => setMarker(m.id, x),
      remove: () => removeMarker(m.id),
    })),
  ];
}

export function moveMarkByKey(
  e: KeyboardEvent,
  mark: {
    kind?: 'cursor' | 'marker';
    value: number;
    move: (v: number) => void;
    remove?: (() => void) | undefined;
  },
  axis: LinearScale,
) {
  if (isComposingKey(e.nativeEvent) || e.ctrlKey || e.altKey || e.metaKey) return;
  const low = Math.min(...axis.range),
    high = Math.max(...axis.range);
  const span = axis.range[1] - axis.range[0];
  const minimum = mark.kind === 'cursor' ? cursorSnapRadius + 1 : 0;
  const step = Math.sign(span) * Math.max(minimum, Math.abs(span) * (e.shiftKey ? 0.1 : 0.01));
  const pos = axis.map(mark.value);
  switch (e.key) {
    case 'ArrowLeft':
    case 'ArrowDown':
      mark.move(axis.invert(clamp(pos - step, low, high)));
      break;
    case 'ArrowRight':
    case 'ArrowUp':
      mark.move(axis.invert(clamp(pos + step, low, high)));
      break;
    case 'Home':
      mark.move(axis.domain[0]);
      break;
    case 'End':
      mark.move(axis.domain[1]);
      break;
    case 'Delete':
      if (!mark.remove) return;
      mark.remove();
      break;
    default:
      return;
  }
  e.preventDefault();
  e.stopPropagation();
}

/** A slider percentage stays a valid ARIA decimal even when the data uses scientific notation. */
export function markPercent(axis: LinearScale, value: number) {
  const [start, end] = axis.range;
  return Math.round((10000 * (axis.map(value) - start)) / (end - start)) / 100;
}

export function MovableChartMarks({
  draggedMark,
  selection,
  marks,
  view,
  lane,
}: {
  selection: ChartPlacement['selection'];
  draggedMark: string | undefined;
  marks: readonly MovableMark[];
  view: NumericViewport;
  lane: DrawnChannel;
}) {
  const bottom = lane.y.range[0];
  return (
    <>
      {marks
        .filter((m) => m.x >= view.axis.domain[0] && m.x <= view.axis.domain[1])
        .map((m) => {
          const x = view.axis.map(m.x);
          const sample = readCursorSample(lane, m.x);
          const reading =
            sample?.y != null
              ? (sample.interpolated ? '≈ ' : '') +
                (lane.channel.formatY ?? String)(sample.y) +
                ' ' +
                (lane.channel.unit ?? '')
              : '';
          const position = markPercent(view.axis, m.x);
          return (
            <g
              key={m.id}
              {...hooks.slot(m.kind, {
                dragging: draggedMark === m.id,
                highlighted:
                  selection.current === m.id ||
                  (selection.current === 'delta' && (m.id === 'cursor:A' || m.id === 'cursor:B')),
                'mark-id': m.id,
                coordinate: m.x,
                tone: m.tone,
              })}
              role="slider"
              aria-label={m.label}
              aria-details={selection.rowId(m.id)}
              onFocus={() => selection.select(m.id)}
              onPointerDown={(event) => {
                // The contextmenu event can round a fractional pointer position onto a nearby legend.
                if (event.button === 2) capturePointer(event);
                selection.select(m.id);
              }}
              onClick={() => selection.select(m.id)}
              tabIndex={0}
              aria-valuenow={position}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={[view.writeX(m.x), reading.trim()].filter(Boolean).join(', ')}
              onKeyDown={(e) => moveMarkByKey(e, { ...m, value: m.x }, view.axis)}
            >
              <rect x={x - 8} y={0} width={16} height={bottom} fill="transparent" />
              <line x1={x} x2={x} y1={10} y2={bottom} />
              {sample?.y != null && sample.y >= lane.y.domain[0] && sample.y <= lane.y.domain[1] ? (
                <circle cx={x} cy={lane.y.map(sample.y)} r={3} />
              ) : null}
              <text x={x} y={9} textAnchor="middle">
                {m.label}
              </text>
            </g>
          );
        })}
    </>
  );
}

export function usePlacementMenu(
  lane: DrawnChannel,
  placement: ChartPlacement,
  view: NumericViewport,
) {
  const s = useUiStrings();
  return (at: number, target?: string): MenuEntry[] => {
    const { measurements: m } = lane;
    const sources = [
      ['position', s.chartHere, at],
      ['sample', s.chartNearest, findNearestSample(lane.line.displayed, at, view.axis)?.x],
      ['min', s.chartMinimum, m.min],
      ['max', s.chartMaximum, m.max],
      ['rising', s.chartRising, m.rising],
      ['falling', s.chartFalling, m.falling],
      ['outside', s.chartOutside, m.outside],
    ] as const;
    const entries = (prefix: string, move: (x: number, source: string) => void) =>
      sources.map(([id, label, value]) => ({
        id: prefix + '-' + id,
        label,
        isDisabled: value === undefined,
        onAction: () => {
          if (value !== undefined) move(value, id);
        },
      }));
    const hit = placement.cursorList.find((c) => 'cursor:' + c.name === target);
    return [
      ...(hit
        ? [
            {
              id: 'delete-cursor',
              label: s.chartDeleteCursor,
              onAction: () => placement.deleteCursor(hit.name),
            },
          ]
        : []),
      {
        id: 'insert-cursor',
        label: s.chartInsertCursor,
        onAction: () => placement.insertCursor(snapCursorX([lane], at)),
      },
      ...placement.cursorList.map((c) => ({
        id: 'place:' + c.name,
        label: s.chartCursor(c.label ?? c.name),
        items: entries('place:' + c.name, (x, source) =>
          placement.moveCursor(c.name, source === 'position' ? snapCursorX([lane], x) : x),
        ),
      })),
      { id: 'marker', label: s.chartAddMarker, items: entries('marker', placement.addMarker) },
      ...placement.markers.map((marker) => ({
        id: 'edit-' + toKeyIdentity(marker.id),
        label: marker.label,
        items: entries('edit-' + toKeyIdentity(marker.id), (x) =>
          placement.setMarker(marker.id, x),
        ),
      })),
      ...differentialMenu({ model: placement.differentials, lane, at, strings: s }, target),
      {
        id: 'zoom-cursors',
        label: s.chartZoomCursors,
        isDisabled: !placement.hasPair || placement.cursors[0] === placement.cursors[1],
        onAction: () =>
          view.change([Math.min(...placement.cursors), Math.max(...placement.cursors)]),
      },
      {
        id: 'p2p',
        label: s.chartPeakPair,
        isDisabled: m.min === undefined || m.max === undefined,
        onAction: () => {
          if (m.min !== undefined && m.max !== undefined) placement.setCursors([m.min, m.max]);
        },
      },
    ];
  };
}
