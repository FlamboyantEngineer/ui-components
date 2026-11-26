import type { ReactNode } from 'react';
import type { Key } from '../../core/props.js';
import type { ScaleInterval } from '../../utils/linear-scale.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import type { ChartReferenceLine } from './chart-references.js';
import type { LinkedChartChannel, LinkedChartSample } from './linked-channel.js';
import { type DrawnChannel, type LinkedChartReadout, readDisplayedSample } from './linked-model.js';
import type { LinkedChartCursor } from './use-chart-cursors.js';

/** One host-calculated result. The host formats values in the units of its measurement. */
export interface LinkedChartMeasurementRow {
  id: Key;
  label: string;
  value?: ReactNode;
  valuesByChannel?: ReadonlyMap<Key, ReactNode> | undefined;
}

export interface LinkedChartMeasurementContext {
  /** Original host data, including samples omitted from the drawing. */
  channels: readonly LinkedChartChannel[];
  cursors: readonly LinkedChartCursor[];
  markers: readonly ChartReferenceLine[];
  xReferences: readonly ChartReferenceLine[];
  visibleRange: ScaleInterval;
  /** Readings for A and B when both exist. */
  pair: LinkedChartReadout | null;
  nearestDisplayedSample: (channelId: Key, x: number) => LinkedChartSample | null;
}

export type LinkedChartMeasurements =
  | readonly LinkedChartMeasurementRow[]
  | ((context: LinkedChartMeasurementContext) => readonly LinkedChartMeasurementRow[]);

export function measurementRows(
  measurements: LinkedChartMeasurements | undefined,
  lanes: readonly DrawnChannel[],
  context: Omit<LinkedChartMeasurementContext, 'channels' | 'nearestDisplayedSample'>,
) {
  const rows =
    typeof measurements === 'function'
      ? measurements({
          ...context,
          channels: lanes.map((lane) => lane.channel),
          nearestDisplayedSample: (channelId, x) => {
            const lane = lanes.find((candidate) => candidate.channel.id === channelId);
            return lane ? readDisplayedSample(lane, x) : null;
          },
        })
      : measurements;
  return (rows ?? []).map((row) => ({
    key: 'measurement:' + toKeyIdentity(row.id),
    cells: [
      { key: 'label', content: row.label },
      { key: 'value', content: row.value },
      ...lanes.map(({ channel }) => ({
        key: toKeyIdentity(channel.id),
        content: row.valuesByChannel?.get(channel.id),
      })),
    ],
  }));
}
