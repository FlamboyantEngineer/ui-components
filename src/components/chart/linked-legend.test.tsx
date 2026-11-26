import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import type { LinkedChartChannel } from './linked-channel.js';
import { LinkedLineChart } from './linked-line-chart.js';

const samples = [
  { x: 0, y: 0 },
  { x: 1, y: 1 },
  { x: 2, y: 0 },
];
const labels = { measured: 'Measured', reference: 'Baseline', envelope: 'Tolerance' };
function channel(id: string | number, label: string): LinkedChartChannel {
  return {
    id,
    label,
    samples,
    reference: samples,
    legend: { labels },
    points: [{ id: 'peak', label: label + ' peak', x: 1, y: 1 }],
  };
}

it('UIC-CHART-2.4 toggles available layers per channel and brings a restored line forward', async () => {
  const user = userEvent.setup();
  render(
    <LinkedLineChart
      label="Capture"
      channels={[channel('v', 'Voltage'), channel('i', 'Current')]}
    />,
  );
  const lane = screen.getByRole('region', { name: 'Voltage' });
  const other = screen.getByRole('region', { name: 'Current' });
  const legend = within(lane).getByRole('toolbar', { name: /Voltage/ });
  const baseline = within(legend).getByRole('button', { name: 'Baseline' });
  expect(within(legend).queryByRole('button', { name: 'Tolerance' })).not.toBeInTheDocument();
  const lines = () => [
    ...lane.querySelectorAll('.ui-linked-line-chart__line,.ui-linked-line-chart__comparison'),
  ];
  expect(lines().at(-1)).toHaveClass('ui-linked-line-chart__line');
  await user.hover(baseline);
  expect(lines().at(-1)).toHaveClass('ui-linked-line-chart__comparison');
  await user.click(baseline);
  expect(lines()).toHaveLength(1);
  expect(within(other).getByRole('button', { name: 'Baseline' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await user.click(within(legend).getByRole('button', { name: 'Measured' }));
  expect(lines()).toHaveLength(1);
  const view = screen.getByRole('button', { name: 'Show as table' });
  await user.click(view);
  await user.click(view);
  const restoredLegend = within(screen.getByRole('toolbar', { name: /Voltage/ }));
  const restored = restoredLegend.getByRole('button', { name: 'Baseline' });
  expect(restored).toHaveAttribute('aria-pressed', 'false');
  restored.focus();
  await user.keyboard(' ');
  expect(
    screen
      .getByRole('region', { name: 'Voltage' })
      .querySelector('.ui-linked-line-chart__comparison'),
  ).toBeVisible();
  expect(screen.getByRole('row', { name: /^Voltage peak/ })).toBeVisible();
});

it('UIC-CHART-2.4 delegates controlled layer visibility to the host', async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  const voltage = {
    ...channel('v', 'Voltage'),
    legend: { labels, hiddenKeys: ['reference'], onHiddenKeysChange: change },
  };
  render(<LinkedLineChart channels={[voltage]} label="Capture" />);
  const toggle = screen.getByRole('button', { name: 'Baseline' });
  await user.click(toggle);
  expect(change).toHaveBeenCalledWith(new Set());
  expect(toggle).toHaveAttribute('aria-pressed', 'false');
});

it('UIC-CHART-15.2 links coincident fixed points to one current row by chart and typed channel key', async () => {
  const user = userEvent.setup();
  const channels = [channel(1, 'Voltage'), channel('1', 'Current')];
  render(
    <>
      <LinkedLineChart label="First" channels={channels} />
      <LinkedLineChart label="Second" channels={channels} />
    </>,
  );
  const first = within(screen.getByRole('figure', { name: 'First' }));
  const second = within(screen.getByRole('figure', { name: 'Second' }));
  const current = first.getByRole('button', { name: 'Current peak' });
  const voltage = first.getByRole('button', { name: 'Voltage peak' });
  const row = first.getByRole('row', { name: /^Current peak/ });
  const otherRow = second.getByRole('row', { name: /^Current peak/ });
  expect(current).toHaveAttribute('aria-details', row.id);
  expect(row.id).not.toBe(otherRow.id);
  await user.click(current);
  expect(row).toHaveAttribute('aria-current', 'true');
  expect(current).toHaveAttribute('aria-pressed', 'true');
  expect(otherRow).not.toHaveAttribute('aria-current');
  voltage.focus();
  await user.keyboard('{Enter}');
  expect(first.getByRole('row', { name: /^Voltage peak/ })).toHaveAttribute('aria-current', 'true');
  expect(row).not.toHaveAttribute('aria-current');
  expect(current).toHaveAttribute('aria-pressed', 'false');
  current.focus();
  await user.keyboard(' ');
  expect(row).toHaveAttribute('aria-current', 'true');
  expect(current).toHaveFocus();
});

it('UIC-CHART-15.2 keeps one current row for a cursor shared by channels and a named point', async () => {
  const user = userEvent.setup();
  render(
    <LinkedLineChart
      label="Capture"
      channels={[channel('v', 'Voltage'), channel('i', 'Current')]}
      defaultCursors={[0.3, 1.7]}
    />,
  );
  const current = within(screen.getByRole('region', { name: 'Current' }));
  const voltage = within(screen.getByRole('region', { name: 'Voltage' }));
  const a = current.getByRole('slider', { name: 'A' }),
    b = voltage.getByRole('slider', { name: 'B' });
  const aRow = screen.getByRole('row', { name: /^Edit Cursor name Cursor A\b/ }),
    bRow = screen.getByRole('row', { name: /^Edit Cursor name Cursor B\b/ });
  await user.click(current.getByRole('button', { name: 'Current peak' }));
  await user.click(a);
  expect(aRow).toHaveAttribute('aria-current', 'true');
  expect(a).toHaveAttribute('aria-details', aRow.id);
  expect(voltage.getByRole('slider', { name: 'A' })).toHaveAttribute('aria-details', aRow.id);
  expect(screen.getByRole('row', { name: /^Current peak/ })).not.toHaveAttribute('aria-current');
  b.focus();
  await user.keyboard('{ArrowRight}');
  expect(bRow).toHaveAttribute('aria-current', 'true');
  expect(aRow).not.toHaveAttribute('aria-current');
  await user.click(within(aRow).getByRole('button', { name: /^Edit Cursor A / }));
  expect(aRow).toHaveAttribute('aria-current', 'true');
});

it('UIC-CHART-15.1 repeats one formatted horizontal axis on every channel after a controlled range change', () => {
  const channels = [channel('v', 'Voltage'), channel('i', 'Current')];
  const plot = (to: number) => (
    <LinkedLineChart
      channels={channels}
      xLabel="Time (ns)"
      formatX={(x) => x + ' ns'}
      visibleRange={[0, to]}
      label="Capture"
    />
  );
  const { rerender } = render(plot(2));
  const ticks = (name: string) =>
    [
      ...screen
        .getByRole('region', { name })
        .querySelectorAll('.ui-chart-axis[data-position="bottom"] text'),
    ].map((node) => [node.getAttribute('x'), node.textContent]);
  const before = ticks('Voltage');
  expect(before.length).toBeGreaterThan(1);
  expect(before).toEqual(ticks('Current'));
  for (const name of ['Voltage', 'Current'])
    expect(screen.getByRole('region', { name })).toHaveAccessibleDescription('Time (ns)');
  rerender(plot(1));
  expect(ticks('Current')).toEqual(ticks('Voltage'));
  expect(ticks('Voltage')).not.toEqual(before);
});

it('UIC-CHART-15.2 highlights declared source geometry and follows edits to a selected host measurement', async () => {
  const user = userEvent.setup();
  const channels = [channel(1, 'Voltage'), channel('1', 'Current')];
  const result = (to: number) => (
    <LinkedLineChart
      label="Signals"
      channels={channels}
      measurements={[
        {
          id: 1,
          label: 'Time window',
          value: to,
          highlights: [{ type: 'interval', channelId: 1, from: 0, to }],
        },
        { id: 2, label: 'Captured current', valuesByChannel: new Map([['1', 1]]) },
      ]}
    />
  );
  const { rerender } = render(result(1));
  const volts = screen.getByRole('region', { name: 'Voltage' }),
    amps = screen.getByRole('region', { name: 'Current' });
  await user.click(
    within(screen.getByRole('row', { name: /Time window/ })).getByRole('cell', { name: '1' }),
  );
  const band = volts.querySelector('.ui-linked-line-chart__range');
  expect(band).toBeInTheDocument();
  expect(amps.querySelector('.ui-linked-line-chart__range')).toBeNull();
  const width = band?.getAttribute('width');
  rerender(result(2));
  expect(band).not.toHaveAttribute('width', width);
  screen.getByRole('button', { name: 'Captured current' }).focus();
  await user.keyboard(' ');
  expect(amps.querySelector('.ui-linked-line-chart__line')).toHaveAttribute(
    'data-highlighted',
    'true',
  );
  expect(volts.querySelector('.ui-linked-line-chart__line')).not.toHaveAttribute(
    'data-highlighted',
  );
  expect(band).not.toBeInTheDocument();
});

it('UIC-CHART-15.2 selects a movable marker from its value cell without selecting a coincident cursor', async () => {
  const user = userEvent.setup();
  render(
    <LinkedLineChart
      label="Capture"
      channels={[channel('v', 'Voltage')]}
      defaultCursorList={[{ name: 'C', x: 1 }]}
      defaultMarkers={[{ id: 'C', label: 'Probe', value: 1 }]}
    />,
  );
  const table = within(screen.getByRole('table', { name: 'Cursor readings' }));
  const probeRow = within(table.getByRole('row', { name: /^Probe/ }));
  await user.click(probeRow.getByRole('cell', { name: '1' }));
  expect(screen.getByRole('slider', { name: 'Probe' })).toHaveAttribute('data-highlighted', 'true');
  expect(screen.getByRole('slider', { name: 'C' })).not.toHaveAttribute('data-highlighted');
});
