'use client';

import { useUiStrings } from '../../core/provider.js';
import { capturePointer } from '../../utils/pointer-drag.js';
import { differentialKey } from './chart-differentials.js';
import { linkedChartHooks as hooks } from './chart-hooks.js';
import { type ChartPlacement, markPercent, moveMarkByKey } from './chart-placement.js';
import type { DrawnChannel } from './linked-model.js';

export function getDifferentialMarks(placement: ChartPlacement, lane: DrawnChannel) {
  return placement.differentials.readings.flatMap((reading) => {
    const pair = reading.cursor;
    if (pair.axis === 'y' && pair.channelId !== lane.channel.id) return [];
    const scale = lane[pair.axis];
    const row = differentialKey(pair.id);
    return (['from', 'to'] as const).flatMap((side) => {
      const value = reading[side];
      if (value === null || value < scale.domain[0] || value > scale.domain[1]) return [];
      return [
        {
          id: row + side,
          row,
          axis: pair.axis,
          scale,
          label: pair.label,
          side,
          value,
          snapped: typeof pair[side] !== 'number',
          move: (v: number) => placement.differentials.change(pair.id, side, v),
          remove: () => placement.differentials.remove(pair.id),
        },
      ];
    });
  });
}

type Mark = ReturnType<typeof getDifferentialMarks>[number];

function handleGeometry(mark: Mark, lane: DrawnChannel) {
  const [left, right] = lane.x.range;
  const [bottom, top] = lane.y.range;
  const pos = mark.scale.map(mark.value);
  const start = mark.side === 'from';
  if (mark.axis === 'y')
    return { x: left + (start ? 15 : 34), y: pos, line: { x1: left, x2: right, y1: pos, y2: pos } };
  return { x: pos, y: bottom - (start ? 12 : 30), line: { x1: pos, x2: pos, y1: top, y2: bottom } };
}

export function DifferentialMarks({
  marks,
  lane,
  placement,
  dragged,
}: {
  marks: readonly Mark[];
  lane: DrawnChannel;
  placement: ChartPlacement;
  dragged: string | undefined;
}) {
  const strings = useUiStrings();
  const [left, right] = lane.x.range;
  const top = lane.y.range[1];
  return marks.map((mark) => {
    const horizontal = mark.axis === 'y';
    const { x, y, line } = handleGeometry(mark, lane);
    const label = mark.label + ' · ' + (mark.side === 'from' ? strings.chartFrom : strings.chartTo);
    const selected = placement.selection.current === mark.row;
    const nearRight = x > (left + right) / 2;
    const select = () => placement.selection.select(mark.row);
    return (
      <g
        key={mark.id}
        {...hooks.slot('differential', {
          axis: mark.axis,
          endpoint: mark.side,
          snapped: mark.snapped,
          highlighted: selected,
          dragging: dragged === mark.id,
          'mark-id': mark.id,
          coordinate: mark.value,
        })}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-details={placement.selection.rowId(mark.row)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={markPercent(mark.scale, mark.value)}
        aria-valuetext={
          mark.scale.format(mark.value) +
          (horizontal && lane.channel.unit ? ' ' + lane.channel.unit : '')
        }
        aria-orientation={horizontal ? 'vertical' : 'horizontal'}
        onFocus={select}
        onPointerDown={(e) => {
          if (e.button === 2) capturePointer(e);
          select();
        }}
        onClick={select}
        onKeyDown={(e) => moveMarkByKey(e, mark, mark.scale)}
      >
        <title>{label}</title>
        <line {...line} pointerEvents={mark.snapped ? 'none' : 'stroke'} />
        <rect x={x - 9} y={y - 9} width={18} height={18} fill="transparent" />
        {selected && (
          <text
            aria-hidden="true"
            pointerEvents="none"
            textAnchor={nearRight ? 'end' : 'start'}
            x={x + (nearRight ? -7 : 7)}
            y={y < top + 12 ? y + 12 : y - 5}
          >
            {label}
          </text>
        )}
        <path d={`M${x},${y - 4}l4,4 -4,4 -4,-4Z`} />
      </g>
    );
  });
}
