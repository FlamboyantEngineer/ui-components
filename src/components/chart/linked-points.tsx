'use client';

import type { Key } from '../../core/props.js';
import { usePress } from '../../primitives/index.js';
import { linkedChartHooks as hooks } from './chart-hooks.js';
import type { LinkedChartPoint } from './linked-channel.js';
import type { DrawnChannel } from './linked-model.js';
import type { useReadingSelection } from './use-reading-selection.js';

export function pointKey(channel: Key, point: Key) {
  return JSON.stringify([channel, point]);
}

function PointButton({
  point,
  lane,
  selection,
}: {
  point: LinkedChartPoint;
  lane: DrawnChannel;
  selection: ReturnType<typeof useReadingSelection>;
}) {
  const key = pointKey(lane.channel.id, point.id);
  const { pressProps } = usePress({
    onPress: (event) => selection.select(key, event.target.ownerDocument),
  });
  const [left, right] = lane.x.range;
  const [bottom, top] = lane.y.range;
  const x = lane.x.map(point.x);
  const y = lane.y.map(point.y);
  if (!(x >= left && x <= right && y >= top && y <= bottom)) return null;
  const end = x > (left + right) / 2;
  const selected = selection.current === key;
  return (
    <g
      {...pressProps}
      {...hooks.slot('point', { key: point.id, highlighted: selected })}
      role="button"
      tabIndex={0}
      aria-label={point.label}
      aria-pressed={selected}
      aria-details={selection.rowId(key)}
    >
      <rect x={x - 12} y={y - 12} width={24} height={24} fill="transparent" />
      <circle cx={x} cy={y} r={3.5} />
      <text
        x={x + (end ? -7 : 7)}
        y={y < top + 14 ? y + 14 : y - 6}
        textAnchor={end ? 'end' : 'start'}
      >
        {point.label}
      </text>
    </g>
  );
}

export function ChannelPoints({
  lane,
  selection,
}: {
  lane: DrawnChannel;
  selection: ReturnType<typeof useReadingSelection>;
}) {
  return lane.points.map((point) => (
    <PointButton
      key={pointKey(lane.channel.id, point.id)}
      point={point}
      lane={lane}
      selection={selection}
    />
  ));
}
