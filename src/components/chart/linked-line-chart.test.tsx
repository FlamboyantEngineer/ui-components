import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { LinkedLineChart } from './linked-line-chart.js';

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
  await user.click(screen.getByRole('button', { name: 'Remove Marker 1' }));
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
      defaultMarkers={[{ id: 'm', label: 'Probe', value: 2e-7 }]}
      onMarkersChange={change}
    />,
  );
  const field = screen.getByLabelText('Probe', { selector: 'input' });
  await user.clear(field);
  await user.type(field, '0.000000325');
  await user.tab();
  expect(change).toHaveBeenLastCalledWith([{ id: 'm', label: 'Probe', value: 3.25e-7 }]);
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
