import type { useUiStrings } from '../../core/provider.js';
import { differentialKey, endpointLabel } from './chart-differentials.js';
import { linkedChartHooks as hooks } from './chart-hooks.js';
import type { ChartPlacement } from './chart-placement.js';
import { readingRow } from './linked-measurements.js';
import type { DrawnChannel } from './linked-model.js';

export function differentialRows(
  {
    placement,
    formatX,
    lanes,
  }: {
    placement: ChartPlacement;
    formatX: (value: number) => string;
    lanes: readonly DrawnChannel[];
  },
  s: ReturnType<typeof useUiStrings>,
) {
  return placement.differentials.readings.map(({ cursor, from, to, delta }) => {
    const result = (format: (n: number) => string) => {
      const show = (v: number | null) => (v === null ? s.noData : format(v));
      const span = show(from) + ' → ' + show(to);
      return (
        <span {...hooks.slot('delta-value')} title={show(delta) + ' (' + span + ')'}>
          {show(delta)}
          <small {...hooks.slot('sample-x')}>{span}</small>
        </span>
      );
    };
    const sourceName = (end: typeof cursor.from) =>
      endpointLabel(end, placement.differentials.sources, s);
    const name = (
      <>
        {cursor.label}
        <small {...hooks.slot('sample-x')}>
          {sourceName(cursor.from)} → {sourceName(cursor.to)}
        </small>
      </>
    );
    return readingRow(differentialKey(cursor.id), [
      name,
      cursor.axis === 'x' ? result(formatX) : '—',
      ...lanes.map((lane) =>
        cursor.axis === 'y' && cursor.channelId === lane.channel.id
          ? result(lane.channel.formatY ?? String)
          : '—',
      ),
    ]);
  });
}
