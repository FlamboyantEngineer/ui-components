'use client';

import { useId } from 'react';
import { useLocale } from '../../primitives/index.js';
import { isElement } from '../../utils/is-element.js';
import { ChartAxis, type ChartAxisProps } from './chart-axis.js';
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
import type { LinkedChartHighlight } from './linked-measurements.js';
import type { DrawnChannel } from './linked-model.js';
import { ChannelPoints } from './linked-points.js';
import { MeasurementHighlights } from './measurement-highlights.js';
import { type ChartLegendPlacement, PlotWithLegend } from './plot-with-legend.js';

interface LaneProps {
  visibility: ChartHiddenKeysProps;
  lane: DrawnChannel;
  placement: ChartPlacement;
  width: number;
  height: number;
  view: NumericViewport;
  references: readonly ChartReferenceLine[];
  xTicks: ChartAxisProps['ticks'];
  xLabel: string;
  highlights: readonly LinkedChartHighlight[];
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

function LaneAxes({
  lane,
  plot,
  xTicks,
}: {
  lane: DrawnChannel;
  plot: ChartBox;
  xTicks: ChartAxisProps['ticks'];
}) {
  return (
    <>
      <ChartAxis
        position="left"
        offset={plot.left}
        range={lane.y.range}
        ticks={lane.y.ticks()}
        gridLength={plot.right - plot.left}
      />
      <ChartAxis position="bottom" offset={plot.bottom} range={lane.x.range} ticks={xTicks} />
    </>
  );
}

function LaneDrawing({
  settings,
  layers,
  clip,
  marks,
  draggedMark,
}: {
  settings: LaneProps;
  layers: ReturnType<typeof useLinkedLegend>;
  clip: string;
  marks: ReturnType<typeof getChartMarks>;
  draggedMark: string | undefined;
}) {
  const { lane, width, height, placement, references, view, xTicks, highlights } = settings;
  const { channel, y } = lane;
  const { axis } = view;
  const [left, right] = axis.range;
  const [bottom, top] = y.range;
  const plot = { top, bottom, left, right };
  const fixed = useLaneReferences(lane, references, plot);
  return (
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
      <LaneAxes lane={lane} plot={plot} xTicks={xTicks} />
      <LinkedTraces
        lane={lane}
        layers={layers}
        emphasized={highlights.some(
          (target) => target.type === 'channel' && target.channelId === channel.id,
        )}
        level={fixed.filter((r) => r.axis === 'y')}
        clip={`url(#${clip})`}
      />
      <ChartReferences
        placed={fixed.filter((r) => r.axis === 'x')}
        highlightedKey={placement.selection.current}
      />
      <MeasurementHighlights
        lane={lane}
        highlights={highlights}
        extrema={placement.selection.current === 'p2p'}
        clip={clip}
      />
      <MovableChartMarks
        selection={placement.selection}
        marks={marks}
        view={view}
        lane={lane}
        draggedMark={draggedMark}
      />
      <ChannelPoints lane={lane} selection={placement.selection} />
    </svg>
  );
}

export function LinkedLane(settings: LaneProps) {
  const { lane, placement, view, xLabel, legendPlacement, visibility } = settings;
  const clip = useId();
  const { channel } = lane;
  const layers = useLinkedLegend(channel, visibility);
  const marks = getChartMarks(placement);
  const getItems = usePlacementMenu(lane, placement, view);
  return (
    <section
      {...hooks.slot('channel', { key: channel.id, 'y-scale': channel.yScale ?? 'linear' })}
      aria-label={channel.label}
      aria-describedby={clip + '-x-label'}
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
            <LaneDrawing
              settings={settings}
              layers={layers}
              clip={clip}
              marks={marks}
              draggedMark={draggedMark}
            />
          )}
        </ViewportSurface>
      </PlotWithLegend>
      <div {...hooks.slot('x-label')} id={clip + '-x-label'}>
        {xLabel}
      </div>
    </section>
  );
}
