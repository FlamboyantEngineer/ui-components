'use client';

import { useId } from 'react';
import { useLocale } from '../../primitives/index.js';
import { isElement } from '../../utils/is-element.js';
import { ChartAxis } from './chart-axis.js';
import { chartHooks, linkedChartHooks as hooks } from './chart-hooks.js';
import type { ChartBox } from './chart-layout.js';
import {
  type ChartPlacement,
  getChartMarks,
  MovableChartMarks,
  usePlacementMenu,
} from './chart-placement.js';
import { type ChartReferenceLine, ChartReferences, placeReferences } from './chart-references.js';
import { type NumericViewport, ViewportSurface } from './chart-viewport.js';
import type { DrawnChannel } from './linked-model.js';

interface LaneProps {
  lane: DrawnChannel;
  placement: ChartPlacement;
  width: number;
  height: number;
  view: NumericViewport;
  references: readonly ChartReferenceLine[];
  showX: boolean;
}

function useLaneReferences(
  lane: DrawnChannel,
  references: readonly ChartReferenceLine[],
  plot: ChartBox,
) {
  const { direction } = useLocale();
  const layout = { plot, isRtl: direction === 'rtl' };
  const { x, y, channel } = lane;
  const markers = placeReferences(
    references,
    { map: x.map, format: x.format, direction: 'x' },
    layout,
  );
  const threshold = channel.threshold;
  if (threshold === undefined) return markers;
  const level = placeReferences(
    [{ id: 'threshold', label: y.format(threshold), value: threshold }],
    { map: y.map, format: y.format, direction: 'y' },
    layout,
  );
  return [...markers, ...level];
}

export function LinkedLane({ lane, placement, width, height, view, references, showX }: LaneProps) {
  const clip = useId();
  const { channel, y } = lane;
  const { axis } = view;
  const marks = getChartMarks(placement);
  const getItems = usePlacementMenu(lane, placement, view);
  const [left, right] = axis.range;
  const [bottom, top] = y.range;
  const plot = { top, bottom, left, right };
  const fixed = useLaneReferences(lane, references, plot);
  return (
    <section
      {...hooks.slot('channel', { key: channel.id, 'y-scale': channel.yScale ?? 'linear' })}
      aria-label={channel.label}
    >
      <span>
        {channel.label}
        {channel.unit ? ' (' + channel.unit + ')' : ''}
      </span>
      <ViewportSurface
        view={view}
        label={channel.label}
        getItems={getItems}
        startMark={(target) => {
          const id = isElement(target)
            ? target.closest('[data-mark-id]')?.getAttribute('data-mark-id')
            : null;
          return marks.find((m) => m.id === id);
        }}
      >
        <svg
          {...chartHooks.slot('plot')}
          role="group"
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
        >
          <defs>
            <clipPath id={clip}>
              <rect x={left} y={top} width={right - left} height={bottom - top} />
            </clipPath>
          </defs>
          <ChartAxis
            position="left"
            offset={left}
            range={y.range}
            ticks={y.ticks()}
            gridLength={right - left}
          />
          {showX ? (
            <ChartAxis position="bottom" offset={bottom} range={axis.range} ticks={axis.ticks()} />
          ) : null}
          <g clipPath={`url(#${clip})`} aria-hidden="true">
            {lane.band ? <path {...hooks.slot('envelope')} d={lane.band} /> : null}
            {lane.reference ? (
              <path {...hooks.slot('comparison')} d={lane.reference} fill="none" />
            ) : null}
            <path {...hooks.slot('line')} d={lane.line.path} fill="none" />
          </g>
          <ChartReferences placed={fixed} />
          <MovableChartMarks marks={marks} view={view} lane={lane} />
        </svg>
      </ViewportSurface>
    </section>
  );
}
