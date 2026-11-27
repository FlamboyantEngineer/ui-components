import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import type { LinkedChartDifferential } from './chart-differentials.js';
import { LinkedLineChart } from './linked-line-chart.js';
import type { LinkedChartMeasurementContext } from './linked-measurements.js';

const channel = {
  id: 1,
  label: 'Signal',
  unit: 'V',
  samples: [
    { x: 1, y: 2 },
    { x: 10, y: 4 },
    { x: 100, y: 20 },
  ],
  yRange: [1, 25] as const,
};
const annotation = { type: 'point', channelId: 1, id: 2 } as const;
const pairs: readonly LinkedChartDifferential[] = [
  { id: 1, label: 'Delay', axis: 'x', from: { type: 'cursor', name: 'A' }, to: annotation },
  {
    id: '1',
    label: 'Amplitude',
    axis: 'y',
    channelId: 1,
    from: { type: 'marker', id: 'probe' },
    to: annotation,
  },
];
it('UIC-CHART-15.4 follows named points, cursors, markers and missing targets across host updates', async () => {
  const user = userEvent.setup();
  const changed = vi.fn();
  const measure = vi.fn((_context: LinkedChartMeasurementContext) => []);
  const view = (points: { id: number; x: number; y: number; label: string }[], marker: number) => (
    <LinkedLineChart
      label="Capture"
      channels={[
        { ...channel, points },
        { ...channel, id: '1', label: 'Other' },
      ]}
      xScale="log"
      defaultCursors={[1, 10]}
      markers={[{ id: 'probe', value: marker, label: 'Probe' }]}
      differentialCursors={pairs}
      onDifferentialCursorsChange={changed}
      measurements={measure}
    />
  );
  const { rerender } = render(view([{ ...annotation, x: 10, y: 8, label: 'Peak' }], 10));
  const delta = () => measure.mock.lastCall?.[0].differentials.map((r) => r.delta);
  expect(delta()).toEqual([9, 4]);
  const lane = within(screen.getByRole('region', { name: 'Signal' }));
  const from = lane.getByRole('slider', { name: 'Delay · Start' });
  expect(from).toHaveAttribute('data-snapped', 'true');
  const a = lane.getByRole('slider', { name: 'A' });
  a.focus();
  await user.keyboard('{End}');
  expect(delta()).toEqual([-90, 4]);
  rerender(view([{ ...annotation, x: 20, y: 3, label: 'Renamed' }], 100));
  expect(delta()).toEqual([-80, -17]);
  expect(screen.getAllByRole('slider', { name: 'Amplitude · End' })).toHaveLength(1);
  rerender(view([], 1));
  expect(delta()).toEqual([null, null]);
  expect(screen.queryByRole('slider', { name: 'Amplitude · End' })).not.toBeInTheDocument();
  expect(screen.getByRole('row', { name: /Amplitude/ })).toHaveTextContent('No data');
  rerender(view([{ ...annotation, x: 10, y: 8, label: 'Peak' }], 10));
  expect(delta()).toEqual([-90, 4]);
  expect(changed).not.toHaveBeenCalled();
  from.focus();
  await user.keyboard('{Home}');
  expect(changed).toHaveBeenLastCalledWith([{ ...pairs[0], from: 1 }, pairs[1]]);
  expect(from).toHaveAttribute('aria-valuenow', '100');
});
it('UIC-CHART-15.4 measures source units on logarithmic scales and detaches one free endpoint', async () => {
  const user = userEvent.setup();
  const start = { ...channel, yScale: 'log' as const };
  const pair = {
    id: 'p',
    label: 'Level',
    axis: 'y' as const,
    channelId: 1,
    from: { type: 'sample' as const, channelId: 1, x: 10 },
    to: 20,
  };
  const measure = vi.fn((_context: LinkedChartMeasurementContext) => []);
  const view = (samples: typeof channel.samples, range: readonly [number, number]) => (
    <LinkedLineChart
      label="Plot"
      channels={[{ ...start, samples }]}
      xScale="log"
      visibleRange={range}
      defaultDifferentialCursors={[pair]}
      measurements={measure}
    />
  );
  const { rerender } = render(view(start.samples, [1, 100]));
  const read = () => measure.mock.lastCall?.[0].differentials[0];
  expect(read()?.delta).toBe(16);
  rerender(
    view(
      [
        { x: 1, y: 1 },
        { x: 10, y: 8 },
        { x: 100, y: 20 },
      ],
      [25, 100],
    ),
  );
  expect(read()?.delta).toBe(12);
  const handle = screen.getByRole('slider', { name: 'Level · Start' });
  const row = screen.getByRole('row', { name: /Level/ });
  await user.click(within(row).getAllByRole('cell').at(-1) ?? row);
  expect(handle).toHaveAttribute('data-highlighted', 'true');
  handle.focus();
  await user.keyboard('{End}');
  expect(handle).not.toHaveAttribute('data-snapped');
  expect(read()?.delta).toBe(-5);
  expect(read()?.cursor.to).toBe(20);
  await user.keyboard('{Delete}');
  expect(screen.queryByRole('row', { name: /Level/ })).not.toBeInTheDocument();
});

it('UIC-CHART-15.4 clips reversed differential fills and omits zero, missing and offscreen intervals', () => {
  const view = (from: number, to: number) => (
    <LinkedLineChart
      label="Capture"
      channels={[channel, { ...channel, id: 'other', label: 'Other' }]}
      visibleRange={[25, 75]}
      differentialCursors={[
        { id: 'span', label: 'Interval', axis: 'x', from, to },
        { id: 'level', label: 'Levels', axis: 'y', channelId: 1, from: 25, to: 1 },
        {
          id: 'gone',
          label: 'Unavailable',
          axis: 'y',
          channelId: 1,
          from: 1,
          to: { type: 'point', channelId: 1, id: 'absent' },
        },
      ]}
    />
  );
  const { rerender } = render(view(80, 20));
  const lane = screen.getByRole('region', { name: 'Signal' });
  const band = (key: string) =>
    lane.querySelector('.ui-linked-line-chart__delta-band[data-key="' + key + '"]');
  expect(band('span')).toBeVisible();
  expect(band('level')).toBeVisible();
  expect(band('gone')).toBeNull();
  for (const attr of ['x', 'y', 'width', 'height'])
    expect(band('span')).toHaveAttribute(attr, band('level')?.getAttribute(attr));
  expect(
    screen
      .getByRole('region', { name: 'Other' })
      .querySelectorAll('.ui-linked-line-chart__delta-band'),
  ).toHaveLength(1);
  rerender(view(25, 25));
  expect(band('span')).toBeNull();
  rerender(view(80, 90));
  expect(band('span')).toBeNull();
  rerender(view(20, 50));
  expect(Number(band('span')?.getAttribute('width'))).toBeCloseTo(
    Number(band('level')?.getAttribute('width')) / 2,
  );
});

it('UIC-CHART-15.4 follows an interpolated cursor amplitude and its acquired neighbor', () => {
  const measure = vi.fn((_context: LinkedChartMeasurementContext) => []);
  const view = (x: number) => (
    <LinkedLineChart
      label="Capture"
      channels={[channel]}
      cursors={[x, 100]}
      differentialCursors={[
        {
          id: 1,
          axis: 'y',
          channelId: 1,
          label: 'Height',
          from: 0,
          to: { type: 'cursor', name: 'A' },
        },
      ]}
      measurements={measure}
    />
  );
  const { rerender } = render(view(5.5));
  const reading = () => measure.mock.lastCall?.[0];
  expect(reading()?.differentials[0]?.delta).toBeCloseTo(3);
  expect(reading()?.sampleAt(1, 5.5)?.y).toBe(reading()?.differentials[0]?.to);
  rerender(view(10));
  expect(reading()?.differentials[0]?.delta).toBe(4);
  expect(reading()?.sampleAt(1, 10)).toBe(channel.samples[1]);
});
