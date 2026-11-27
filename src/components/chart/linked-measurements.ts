import type { ReactNode } from 'react';
import type { Key } from '../../core/props.js';
import type { ScaleInterval } from '../../utils/linear-scale.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import type { ProseTableRow } from '../prose-table/prose-table.js';
import type { LinkedChartDifferentialReading } from './chart-differentials.js';
import type { ChartReferenceLine } from './chart-references.js';
import { type LinkedChartCursorSample, readCursorSample } from './cursor-sampling.js';
import type { LinkedChartChannel, LinkedChartSample } from './linked-channel.js';
import { type DrawnChannel, type LinkedChartReadout, readDisplayedSample } from './linked-model.js';
import type { LinkedChartCursor } from './use-chart-cursors.js';

/** Source geometry to emphasize while a measurement row is current. An interval can span all channels. */
export type LinkedChartHighlight =
  | { type: 'sample'; channelId: Key; x: number; y: number }
  | { type: 'interval'; channelId?: Key; from: number; to: number }
  | { type: 'channel'; channelId: Key };

/** One host-calculated result. The host formats values in the units of its measurement. */
export interface LinkedChartMeasurementRow {
  id: Key;
  label: string;
  value?: ReactNode;
  valuesByChannel?: ReadonlyMap<Key, ReactNode> | undefined;
  /** Defaults to the channels with values, or the entire capture for a scalar result. */
  highlights?: readonly LinkedChartHighlight[] | undefined;
}

export interface LinkedChartMeasurementContext {
  differentials: readonly LinkedChartDifferentialReading[];
  /** Original host data, including samples omitted from the drawing. */
  channels: readonly LinkedChartChannel[];
  cursors: readonly LinkedChartCursor[];
  markers: readonly ChartReferenceLine[];
  xReferences: readonly ChartReferenceLine[];
  visibleRange: ScaleInterval;
  /** Readings for A and B when both exist. */
  pair: LinkedChartReadout | null;
  /** Read the same acquired or interpolated value as the cursor table at this coordinate. */
  sampleAt: (channelId: Key, x: number) => LinkedChartCursorSample | null;
  nearestDisplayedSample: (channelId: Key, x: number) => LinkedChartSample | null;
}

export type LinkedChartMeasurements =
  | readonly LinkedChartMeasurementRow[]
  | ((context: LinkedChartMeasurementContext) => readonly LinkedChartMeasurementRow[]);

export function measurementRows(
  measurements: LinkedChartMeasurements | undefined,
  lanes: readonly DrawnChannel[],
  context: Omit<LinkedChartMeasurementContext, 'channels' | 'nearestDisplayedSample' | 'sampleAt'>,
) {
  const rows =
    typeof measurements === 'function'
      ? measurements({
          ...context,
          channels: lanes.map((lane) => lane.channel),
          sampleAt: (channelId, x) => {
            const lane = lanes.find((candidate) => candidate.channel.id === channelId);
            return lane ? readCursorSample(lane, x) : null;
          },
          nearestDisplayedSample: (channelId, x) => {
            const lane = lanes.find((candidate) => candidate.channel.id === channelId);
            return lane ? readDisplayedSample(lane, x) : null;
          },
        })
      : measurements;
  return (rows ?? []).map((row) => ({
    key: 'measurement:' + toKeyIdentity(row.id),
    highlights:
      row.highlights ??
      lanes
        .filter(({ channel }) => !row.valuesByChannel || row.valuesByChannel.has(channel.id))
        .map(({ channel }): LinkedChartHighlight => ({ type: 'channel', channelId: channel.id })),
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

export function readingRow(key: string, contents: readonly ReactNode[]): ProseTableRow {
  return { key, cells: contents.map((content, index) => ({ key: String(index), content })) };
}
