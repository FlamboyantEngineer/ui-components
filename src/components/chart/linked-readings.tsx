'use client';

import type { ReactNode } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import {
  ProseTable,
  type ProseTableColumn,
  type ProseTableRow,
} from '../prose-table/prose-table.js';
import { linkedChartHooks as hooks } from './chart-hooks.js';
import type { ChartPlacement } from './chart-placement.js';
import type { ChartReferenceLine } from './chart-references.js';
import type { LinkedChartPoint } from './linked-channel.js';
import { type DrawnChannel, readCursors, readDisplayedSample } from './linked-model.js';

interface ReadingPosition {
  key: string;
  label: string;
  x: number;
  point?: { lane: DrawnChannel; value: LinkedChartPoint };
  fixed?: boolean;
}

function getPositions(
  placement: ChartPlacement,
  references: readonly ChartReferenceLine[],
  lanes: readonly DrawnChannel[],
): ReadingPosition[] {
  const named = (mark: ChartReferenceLine, fixed: boolean) => ({
    key: (fixed ? 'fixed:' : 'mark:') + toKeyIdentity(mark.id),
    label: mark.label,
    x: mark.value,
    fixed,
  });
  return [
    { key: 'a', label: 'A', x: placement.cursors[0] },
    { key: 'b', label: 'B', x: placement.cursors[1] },
    ...references.filter((r) => Number.isFinite(r.value)).map((r) => named(r, true)),
    ...placement.markers.map((m) => named(m, false)),
    ...lanes.flatMap((lane) =>
      lane.points.map((value) => ({
        key: JSON.stringify([toKeyIdentity(lane.channel.id), toKeyIdentity(value.id)]),
        label: value.label,
        x: value.x,
        fixed: true,
        point: { lane, value },
      })),
    ),
  ];
}

function readingRow(key: string, contents: readonly ReactNode[]): ProseTableRow {
  return { key, cells: contents.map((content, index) => ({ key: String(index), content })) };
}

function sampleCell(lane: DrawnChannel, mark: ReadingPosition, formatX: (x: number) => string) {
  const write = lane.channel.formatY ?? String;
  if (mark.point) return mark.point.lane === lane ? write(mark.point.value.y) : '—';
  const sample = readDisplayedSample(lane, mark.x);
  if (sample?.y == null) return null;
  return (
    <>
      {write(sample.y)}
      {sample.x !== mark.x && <small {...hooks.slot('sample-x')}>@ {formatX(sample.x)}</small>}
    </>
  );
}

export function LinkedReadings({
  lanes,
  placement,
  references,
  formatX,
  xLabel,
}: {
  lanes: readonly DrawnChannel[];
  placement: ChartPlacement;
  references: readonly ChartReferenceLine[];
  formatX: (x: number) => string;
  xLabel: string;
}) {
  const s = useUiStrings();
  const header: ProseTableColumn[] = [
    { key: 'mark', content: s.chartPoint, isRowHeader: true },
    { key: 'position', content: xLabel, align: 'end' },
    ...lanes.map(({ channel }) => ({
      key: 'channel:' + toKeyIdentity(channel.id),
      align: 'end' as const,
      content: channel.label + (channel.unit ? ' (' + channel.unit + ')' : ''),
    })),
  ];
  const [a, b] = placement.cursors;
  const readout = readCursors(lanes, placement.cursors);
  const totals = (measure: 'deltaY' | 'peakToPeak') =>
    readout.channels.map((reading, index) => {
      const value = reading[measure];
      return value === null ? s.noData : (lanes[index]?.channel.formatY ?? String)(value);
    });
  const rows = getPositions(placement, references, lanes).map((mark) =>
    readingRow(mark.key, [
      <>
        {mark.label}
        {mark.fixed && (
          <>
            {' '}
            <small {...hooks.slot('fixed-label')}>{s.chartFixed}</small>
          </>
        )}
      </>,
      formatX(mark.x),
      ...lanes.map((lane) => sampleCell(lane, mark, formatX) ?? s.noData),
    ]),
  );
  return (
    <div {...hooks.slot('measurements')}>
      <ProseTable
        aria-label={s.chartReadings}
        caption={
          <>
            {s.chartReadings} <small>|Δx| = {formatX(readout.deltaX)}</small>
          </>
        }
        header={header}
        rows={rows}
        footer={[
          readingRow('delta', ['B − A', formatX(b - a), ...totals('deltaY')]),
          readingRow('p2p', [s.chartPeakAmplitude, s.chartVisibleRange, ...totals('peakToPeak')]),
        ]}
      />
    </div>
  );
}
