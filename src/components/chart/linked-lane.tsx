'use client';

import { useId } from 'react';
import { useLocale } from '../../primitives/index.js';
import { isElement } from '../../utils/is-element.js';
import { ChartAxis } from './chart-axis.js';
import { chartHooks, linkedChartHooks as hooks } from './chart-hooks.js';
import type { ChartBox } from './chart-layout.js';
import type { ChartHiddenKeysProps } from './chart-legend.js';
import {
  type ChartPlacement,
  getChartMarks,
  MovableChartMarks,
  usePlacementMenu,
} from './chart-placement.js';
import { type ChartReferenceLine, ChartReferences, placeReferences } from './chart-references.js';
import { type NumericViewport, ViewportSurface } from './chart-viewport.js';
import { LinkedTraces, useLinkedLegend } from './linked-legend.js';
import type { DrawnChannel } from './linked-model.js';
import { ChannelPoints } from './linked-points.js';
import { type ChartLegendPlacement, PlotWithLegend } from './plot-with-legend.js';

interface LaneProps {
  visibility: ChartHiddenKeysProps;
  lane: DrawnChannel;
  placement: ChartPlacement;
  width: number;
  height: number;
  view: NumericViewport;
  references: readonly ChartReferenceLine[];
  showX: boolean;
  legendPlacement: ChartLegendPlacement;
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

function markAt(target: EventTarget, marks: ReturnType<typeof getChartMarks>) {
  const id = isElement(target)
    ? target.closest('[data-mark-id]')?.getAttribute('data-mark-id')
    : null;
  return marks.find((mark) => mark.id === id);
}

function LaneAxes({ lane, plot, showX }: { lane: DrawnChannel; plot: ChartBox; showX: boolean }) {
  return (
    <>
      <ChartAxis
        position="left"
        offset={plot.left}
        range={lane.y.range}
        ticks={lane.y.ticks()}
        gridLength={plot.right - plot.left}
      />
      {showX ? (
        <ChartAxis
          position="bottom"
          offset={plot.bottom}
          range={lane.x.range}
          ticks={lane.x.ticks()}
        />
      ) : null}
    </>
  );
}

export function LinkedLane({
  lane,
  placement,
  width,
  height,
  view,
  references,
  showX,
  legendPlacement,
  visibility,
}: LaneProps) {
  const clip = useId();
  const { channel, y } = lane;
  const { axis } = view;
  const layers = useLinkedLegend(channel, visibility);
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
      <PlotWithLegend legend={layers.legend} placement={legendPlacement}>
        <ViewportSurface
          view={view}
          label={channel.label}
          getItems={getItems}
          startMark={(target) => markAt(target, marks)}
        >
          {(draggedMark) => (
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
              <LaneAxes lane={lane} plot={plot} showX={showX} />
              <LinkedTraces
                lane={lane}
                layers={layers}
                level={fixed.filter((r) => r.axis === 'y')}
                clip={`url(#${clip})`}
              />
              <ChartReferences placed={fixed.filter((r) => r.axis === 'x')} />
              <MovableChartMarks
                selection={placement.selection}
                marks={marks}
                view={view}
                lane={lane}
                draggedMark={draggedMark}
              />
              <ChannelPoints lane={lane} selection={placement.selection} />
            </svg>
          )}
        </ViewportSurface>
      </PlotWithLegend>
    </section>
  );
}
