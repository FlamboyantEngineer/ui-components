'use client';

import type { ReactNode } from 'react';
import { useUiStrings } from '../../core/provider.js';
import type { ScaleInterval } from '../../utils/linear-scale.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { InlineEdit } from '../inline-edit/inline-edit.js';
import {
  ProseTable,
  type ProseTableColumn,
  type ProseTableRow,
} from '../prose-table/prose-table.js';
import { linkedChartHooks as hooks } from './chart-hooks.js';
import { type ChartPlacement, getChartMarks } from './chart-placement.js';
import { ChartPositionEdit } from './chart-position-edit.js';
import type { ChartReferenceLine } from './chart-references.js';
import { CursorRowMenu } from './cursor-row-menu.js';
import type { LinkedChartPoint } from './linked-channel.js';
import type { measurementRows } from './linked-measurements.js';
import { type DrawnChannel, type LinkedChartReadout, readDisplayedSample } from './linked-model.js';
import { pointKey } from './linked-points.js';

interface ReadingPosition {
  key: string;
  label: string;
  x: number;
  point?: { lane: DrawnChannel; value: LinkedChartPoint };
  fixed?: boolean;
  mark?: ReturnType<typeof getChartMarks>[number];
}

function getPositions(
  placement: ChartPlacement,
  references: readonly ChartReferenceLine[],
  lanes: readonly DrawnChannel[],
): ReadingPosition[] {
  return [
    ...getChartMarks(placement).map((mark) => ({
      key: mark.id,
      label: mark.label,
      x: mark.x,
      mark,
    })),
    ...references
      .filter((r) => Number.isFinite(r.value))
      .map((r) => ({
        key: 'x:' + toKeyIdentity(r.id),
        x: r.value,
        label: r.label,
        fixed: true,
      })),
    ...lanes.flatMap((lane) =>
      lane.points.map((value) => ({
        key: pointKey(lane.channel.id, value.id),
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
      {(mark.mark || sample.x !== mark.x) && (
        <small {...hooks.slot('sample-x')}>
          {sample.x !== mark.x ? '@ ' + formatX(sample.x) : null}
        </small>
      )}
    </>
  );
}

function positionName(mark: ReadingPosition, s: ReturnType<typeof useUiStrings>) {
  if (mark.mark?.rename) {
    const shown = s.chartCursor(mark.label);
    return (
      <InlineEdit
        {...hooks.slot('mark-name', { 'mark-id': mark.mark.id, 'display-value': shown })}
        label={s.chartCursorName}
        value={mark.label}
        renderValue={() => shown}
        onSave={mark.mark.rename}
      />
    );
  }
  return (
    <>
      {mark.mark ? (
        <span
          {...hooks.slot('mark-name', { 'mark-id': mark.mark.id })}
          tabIndex={0}
          aria-haspopup="menu"
        >
          {mark.label}
        </span>
      ) : (
        mark.label
      )}
      {mark.fixed && (
        <>
          {' '}
          <small {...hooks.slot('fixed-label')}>{s.chartFixed}</small>
        </>
      )}
    </>
  );
}

function ReadingTarget({ selected, children }: { selected: boolean; children: ReactNode }) {
  return (
    <button type="button" {...hooks.slot('row-action')} aria-pressed={selected}>
      {children}
    </button>
  );
}

function columns(
  lanes: readonly DrawnChannel[],
  s: ReturnType<typeof useUiStrings>,
  { xLabel, hasMeasurements }: { xLabel: string; hasMeasurements: boolean },
): ProseTableColumn[] {
  return [
    {
      key: 'mark',
      content: hasMeasurements ? s.chartMeasurement : s.chartPoint,
      isRowHeader: true,
    },
    {
      key: 'position',
      content: hasMeasurements ? xLabel + ' / ' + s.chartAmount : xLabel,
      align: 'end',
    },
    ...lanes.map(({ channel }) => ({
      key: 'channel:' + toKeyIdentity(channel.id),
      align: 'end' as const,
      content: channel.label + (channel.unit ? ' (' + channel.unit + ')' : ''),
    })),
  ];
}

interface LinkedReadingsProps {
  lanes: readonly DrawnChannel[];
  placement: ChartPlacement;
  references: readonly ChartReferenceLine[];
  formatX: (x: number) => string;
  xLabel: string;
  extent: ScaleInterval;
  xUnits?: Readonly<Record<string, number>> | undefined;
  extra: ReturnType<typeof measurementRows>;
  readout: LinkedChartReadout;
}

function positionRows(
  { placement, references, lanes, formatX, xUnits, extent }: LinkedReadingsProps,
  s: ReturnType<typeof useUiStrings>,
) {
  const { selection } = placement;
  return getPositions(placement, references, lanes).map((mark) =>
    readingRow(mark.key, [
      mark.mark ? (
        positionName(mark, s)
      ) : (
        <ReadingTarget selected={mark.key === selection.current}>
          {positionName(mark, s)}
        </ReadingTarget>
      ),
      mark.mark ? (
        <ChartPositionEdit
          label={mark.mark.kind === 'cursor' ? s.chartCursor(mark.label) : mark.label}
          x={mark.x}
          move={mark.mark.move}
          format={{ extent, formatX, units: xUnits }}
        />
      ) : (
        formatX(mark.x)
      ),
      ...lanes.map((lane) => sampleCell(lane, mark, formatX) ?? s.noData),
    ]),
  );
}

export function LinkedReadings(props: LinkedReadingsProps) {
  const { lanes, placement, formatX, xLabel, extra, readout } = props;
  const s = useUiStrings();
  const { selection } = placement;
  const [a, b] = placement.cursors;
  const totals = (measure: 'deltaY' | 'peakToPeak') =>
    readout.channels.map((reading, index) => {
      const value = reading[measure];
      return value === null ? s.noData : (lanes[index]?.channel.formatY ?? String)(value);
    });
  const rows = positionRows(props, s);
  const footer = [
    ...(placement.hasPair
      ? [readingRow('delta', [placement.differenceLabel, formatX(b - a), ...totals('deltaY')])]
      : []),
    readingRow('p2p', [s.chartPeakAmplitude, s.chartVisibleRange, ...totals('peakToPeak')]),
    ...extra,
  ].map((row) => ({
    ...row,
    cells: row.cells.map((cell, i) =>
      i
        ? cell
        : {
            ...cell,
            content: (
              <ReadingTarget selected={row.key === selection.current}>{cell.content}</ReadingTarget>
            ),
          },
    ),
  }));
  const identify = (row: ProseTableRow) => ({
    ...row,
    id: selection.rowId(row.key),
    'aria-current': row.key === selection.current || undefined,
  });
  const keys = new Map([...rows, ...footer].map((row) => [selection.rowId(row.key), row.key]));
  return (
    <CursorRowMenu
      marks={getChartMarks(placement)}
      onActivate={(id) => {
        const key = keys.get(id);
        if (key !== undefined) selection.select(key);
      }}
    >
      <ProseTable
        aria-label={s.chartReadings}
        caption={
          <>
            {s.chartReadings} {placement.hasPair && <small>|Δx| = {formatX(readout.deltaX)}</small>}
          </>
        }
        header={columns(lanes, s, { xLabel, hasMeasurements: extra.length > 0 })}
        rows={rows.map(identify)}
        footer={footer.map(identify)}
      />
    </CursorRowMenu>
  );
}
