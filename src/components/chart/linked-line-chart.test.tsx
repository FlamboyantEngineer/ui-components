import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { LinkedLineChart } from './linked-line-chart.js';
import type {
  LinkedChartMeasurementContext,
  LinkedChartMeasurements,
} from './linked-measurements.js';

const voltage = {
  id: 'v',
  label: 'Voltage',
  unit: 'V',
  samples: [
    { x: 0, y: 2 },
    { x: 2, y: 5, lower: 0, upper: 4 },
    { x: 4, y: 1 },
  ],
  threshold: 3,
};
const current = {
  id: 'i',
  label: 'Current',
  unit: 'A',
  samples: [
    { x: 0.1, y: 300 },
    { x: 3.6, y: 500 },
  ],
};
it('UIC-CHART-15.2 reports two independent displayed samples and delta in source units', async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  render(
    <LinkedLineChart
      label="Signals"
      channels={[voltage, current]}
      cursors={[0, 3]}
      onCursorsChange={change}
      xReferences={[{ id: 1, label: 'Start', value: 0 }]}
    />,
  );
  const lane = screen.getByRole('region', { name: 'Voltage' });
  const cursor = within(lane).getByRole('slider', { name: 'B' });
  cursor.focus();
  await user.keyboard('{End}');
  expect(change).toHaveBeenCalledWith([0, 4], {
    deltaX: 4,
    channels: [
      {
        channelId: 'v',
        samples: [voltage.samples[0], voltage.samples[2]],
        deltaY: -1,
        peakToPeak: 4,
      },
      {
        channelId: 'i',
        samples: [current.samples[0], current.samples[1]],
        deltaY: 200,
        peakToPeak: 200,
      },
    ],
  });
  expect(cursor).toHaveAttribute('data-coordinate', '3');
  expect(screen.getByRole('figure')).toHaveAccessibleDescription(/Start/);
  expectHooksMatchSpec(document.body, 'CHART', {
    slots: ['ui-linked-line-chart__line', 'ui-linked-line-chart__cursor'],
  });
});

it('UIC-CHART-15.3 places peak-to-peak cursors and an out-of-band marker through the channel menu', async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  render(<LinkedLineChart label="Trace" channels={[voltage]} onMarkersChange={change} />);
  const lane = within(screen.getByRole('region', { name: 'Voltage' })).getByRole('group', {
    name: 'Voltage',
  });
  lane.focus();
  await user.keyboard('{Shift>}{F10}{/Shift}');
  await user.click(
    await screen.findByRole('menuitem', { name: 'Place cursors at minimum and maximum' }),
  );
  expect(screen.getByRole('slider', { name: 'A' })).toHaveAttribute('data-coordinate', '4');
  expect(screen.getByRole('slider', { name: 'B' })).toHaveAttribute('data-coordinate', '2');
  lane.focus();
  await user.keyboard('{Shift>}{F10}{/Shift}');
  await user.click(await screen.findByRole('menuitem', { name: 'Add marker' }));
  await user.click(await screen.findByRole('menuitem', { name: 'First sample outside band' }));
  expect(change).toHaveBeenCalledWith([expect.objectContaining({ value: 2 })]);
  expect(screen.getByRole('slider', { name: 'Marker 1' })).toHaveAttribute('data-coordinate', '2');
  expect(screen.getByRole('rowheader', { name: 'Marker 1' })).toBeVisible();
  screen.getByText('Marker 1', { selector: '[data-mark-id]' }).focus();
  await user.keyboard('{Shift>}{F10}{/Shift}');
  await user.click(await screen.findByRole('menuitem', { name: 'Remove Marker 1' }));
  expect(change).toHaveBeenLastCalledWith([]);
});

it('UIC-CHART-15.1 retains an empty capture until asynchronous samples arrive', () => {
  const { rerender } = render(
    <LinkedLineChart label="Capture" channels={[{ ...voltage, samples: [] }]} />,
  );
  expect(screen.getByRole('figure')).toHaveAttribute('data-empty', 'true');
  rerender(<LinkedLineChart label="Capture" channels={[voltage]} />);
  expect(screen.getByRole('figure')).not.toHaveAttribute('data-empty');
  expect(screen.getByRole('slider', { name: 'B' })).toHaveAttribute('data-coordinate', '4');
});

it('UIC-CHART-15.3 places a marker at an exact sub-microsecond coordinate from its field', async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  render(
    <LinkedLineChart
      label="Capture"
      channels={[
        {
          ...voltage,
          samples: [
            { x: 0, y: 1 },
            { x: 1e-6, y: 2 },
          ],
        },
      ]}
      xUnits={{ ns: 1e-9 }}
      formatX={(x) => String(x * 1e9) + ' ns'}
      defaultMarkers={[{ id: 'm', label: 'Probe', value: 2e-7 }]}
      onMarkersChange={change}
    />,
  );
  await user.click(screen.getByRole('button', { name: /^Edit Probe / }));
  const field = screen.getByLabelText('Probe', { selector: 'input' });
  await user.clear(field);
  expect(field).toHaveAttribute('type', 'text');
  await user.type(field, '820 ns');
  await user.tab();
  expect(change).toHaveBeenLastCalledWith([{ id: 'm', label: 'Probe', value: 820 * 1e-9 }]);
});

it('UIC-CHART-15.2 keeps the latest controlled B when a host updates it during a drag of A', async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  const view = (b: number) => (
    <LinkedLineChart
      channels={[voltage]}
      label="Capture"
      cursors={[1, b]}
      onCursorsChange={change}
    />
  );
  const { rerender } = render(view(2));
  const handle = screen.getByRole('slider', { name: 'A' });
  const viewport = screen.getByRole('group', { name: 'Voltage' });
  await user.pointer({ keys: '[MouseLeft>]', target: handle, coords: { clientX: 100 } });
  expect(handle).toHaveAttribute('data-dragging', 'true');
  rerender(view(3));
  await user.pointer({ target: viewport, coords: { clientX: 150 } });
  await user.pointer({ keys: '[/MouseLeft]', target: viewport });
  expect(handle).not.toHaveAttribute('data-dragging');
  expect(change).toHaveBeenCalledWith([expect.any(Number), 3], expect.anything());
});

it('UIC-CHART-15.2 lists coincident fixed points and references separately from movable cursors', () => {
  const channels = [
    { ...voltage, points: [{ id: 'peak', label: 'Voltage peak', x: 2, y: 5 }] },
    { ...current, points: [{ id: 'peak', label: 'Current peak', x: 2, y: 499 }] },
  ];
  const props = {
    label: 'Signals',
    channels,
    cursors: [3, 1] as const,
    xReferences: [{ id: 'peak', label: 'Trigger', value: 2 }],
  };
  const { rerender } = render(<LinkedLineChart {...props} />);
  const table = within(screen.getByRole('table', { name: 'Cursor readings' }));
  expect(table.getByRole('columnheader', { name: 'Voltage (V)' })).toBeVisible();
  expect(
    within(table.getByRole('row', { name: /^Voltage peak/ })).getByRole('cell', { name: '5' }),
  ).toBeVisible();
  expect(
    within(table.getByRole('row', { name: /^Current peak/ })).getByRole('cell', { name: '499' }),
  ).toBeVisible();
  expect(
    within(table.getByRole('row', { name: /^Trigger/ })).getByRole('cell', { name: '5' }),
  ).toBeVisible();
  expect(table.getByRole('row', { name: /^B − A/ })).toHaveTextContent('-2');
  rerender(<LinkedLineChart {...props} visibleRange={[3, 4]} />);
  expect(table.getByRole('row', { name: /^Trigger/ })).toHaveTextContent('No data');
  expect(table.getByRole('row', { name: /^Current peak/ })).toHaveTextContent('499');
  const currentLane = screen.getByRole('region', { name: 'Current' });
  expect(currentLane.querySelectorAll('.ui-linked-line-chart__point')).toHaveLength(0);
});

it('UIC-CHART-15.3 requests insertion after Z without mutating a controlled list', async () => {
  const user = userEvent.setup();
  const cursorList = Array.from({ length: 26 }, (_, i) => ({
    name: String.fromCharCode(65 + i),
    x: 1,
  }));
  const change = vi.fn();
  render(
    <LinkedLineChart
      label="Signals"
      channels={[voltage]}
      cursorList={cursorList}
      onCursorListChange={change}
    />,
  );
  const plot = within(screen.getByRole('region', { name: 'Voltage' })).getByRole('group', {
    name: 'Voltage',
  });
  plot.focus();
  await user.keyboard('{Shift>}{F10}{/Shift}');
  await user.click(await screen.findByRole('menuitem', { name: 'Insert cursor' }));
  expect(change).toHaveBeenCalledWith([...cursorList, { name: 'AA', x: 2 }]);
  expect(screen.queryByRole('slider', { name: 'AA' })).not.toBeInTheDocument();
});

it('UIC-CHART-15.2 validates cursor names and preserves a controlled cursor’s key and label across moves', async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  const view = (label: string) => (
    <LinkedLineChart
      label="Signals"
      channels={[voltage]}
      cursorList={[
        { name: 'A', label, x: 1 },
        { name: 'B', x: 3 },
      ]}
      onCursorListChange={change}
    />
  );
  const { rerender } = render(view('Start'));
  await user.click(screen.getByRole('button', { name: 'Edit Cursor name Cursor Start' }));
  const input = screen.getByRole('textbox', { name: 'Cursor name' });
  await user.clear(input);
  await user.type(input, 'B{Enter}');
  expect(await screen.findByText(/unique among the cursors/)).toBeVisible();
  expect(change).not.toHaveBeenCalled();
  await user.clear(input);
  await user.type(input, '  Rise  {Enter}');
  expect(change).toHaveBeenLastCalledWith([
    { name: 'A', label: 'Rise', x: 1 },
    { name: 'B', x: 3 },
  ]);
  expect(screen.getByRole('slider', { name: 'Start' })).toBeVisible();
  rerender(view('Rise'));
  screen.getByRole('slider', { name: 'Rise' }).focus();
  await user.keyboard('{End}');
  expect(change).toHaveBeenLastCalledWith([
    { name: 'A', label: 'Rise', x: 4 },
    { name: 'B', x: 3 },
  ]);
});

it('UIC-CHART-15.2 supplies original data and live positions for host measurements and accepts static results', async () => {
  const user = userEvent.setup();
  const channels = [
    { ...voltage, id: 1 },
    { ...current, id: '1' },
  ];
  const calculated = vi.fn((context: LinkedChartMeasurementContext) => [
    {
      id: 'window',
      label: 'Selected interval',
      value: context.cursors.map((c) => c.x).join(' to '),
      valuesByChannel: new Map<string | number, string>([
        [1, 'first'],
        ['1', 'second'],
      ]),
    },
  ]);
  const chart = (measurements: LinkedChartMeasurements) => (
    <LinkedLineChart
      label="Signals"
      channels={channels}
      defaultCursors={[1, 3]}
      defaultMarkers={[{ id: 'probe', label: 'Probe', value: 1 }]}
      xReferences={[{ id: 'trigger', label: 'Trigger', value: 2 }]}
      measurements={measurements}
    />
  );
  const { rerender } = render(chart(calculated));
  const table = within(screen.getByRole('table', { name: 'Cursor readings' }));
  const row = within(table.getByRole('row', { name: /^Selected interval/ }));
  expect(row.getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
    '1 to 3',
    'first',
    'second',
  ]);
  const context = calculated.mock.lastCall?.[0];
  expect(context?.channels[0]?.samples).toBe(voltage.samples);
  expect(context?.visibleRange).toEqual([0, 4]);
  expect(context?.markers[0]?.id).toBe('probe');
  expect(context?.xReferences[0]?.id).toBe('trigger');
  expect(context?.nearestDisplayedSample(1, 2)).toBe(voltage.samples[1]);
  expect(context?.nearestDisplayedSample('missing', 2)).toBeNull();
  const cursor = within(screen.getByRole('region', { name: 'Voltage' })).getByRole('slider', {
    name: 'B',
  });
  cursor.focus();
  await user.keyboard('{End}');
  expect(row.getByRole('cell', { name: '1 to 4' })).toBeVisible();
  await user.keyboard('{Delete}');
  expect(calculated.mock.lastCall?.[0].pair).toBeNull();
  rerender(chart([{ id: 1, label: 'Acquisition count', value: 0 }]));
  expect(table.queryByRole('row', { name: /^Selected interval/ })).not.toBeInTheDocument();
  expect(
    within(table.getByRole('row', { name: /^Acquisition count/ })).getByRole('cell', { name: '0' }),
  ).toBeVisible();
});
