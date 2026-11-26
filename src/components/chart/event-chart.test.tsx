import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { EventChart } from './event-chart.js';

const events = [
  { id: 1, label: 'First', start: 0.00000123 },
  { id: '1', label: 'Second', start: 0.00000123, end: 0.00000124 },
  { id: 'end', label: 'Last', start: 0.000003 },
];

it('UIC-CHART-16.1 keeps coincident events keyboard reachable with their exact endpoints', async () => {
  const user = userEvent.setup();
  render(
    <EventChart
      label="Observations"
      events={events}
      formatX={() => '1 μs'}
      renderDetails={(e) => <span>Detail {e.label}</span>}
    />,
  );
  const first = screen.getByRole('img', { name: /First/ });
  expect(first).toHaveAttribute('tabindex', '0');
  await user.click(first);
  first.focus();
  await user.keyboard('{ArrowRight}');
  expect(screen.getByRole('img', { name: /Second/ })).toHaveFocus();
  expect(await screen.findByText('Detail Second')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Show as table' }));
  const table = screen.getByRole('table', { name: 'Observations' });
  expect(within(table).getAllByRole('row')).toHaveLength(4);
  expect(within(table).getByRole('row', { name: /Second/ })).toHaveTextContent('0.00000124');
});

it('UIC-CHART-14.1 UIC-CHART-16.1 requests viewport changes while the host retains control', async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  render(
    <EventChart
      label="Events"
      events={events}
      visibleRange={[0.0000013, 0.0000028]}
      onVisibleRangeChange={change}
    />,
  );
  expectHooksMatchSpec(document.body, 'CHART', { slots: ['viewport', 'navigation'] });
  await user.click(screen.getByRole('button', { name: 'Zoom in' }));
  const a = change.mock.calls[0];
  await user.click(screen.getByRole('button', { name: 'Zoom in' }));
  expect(change.mock.calls[1]).toEqual(a);
  await user.click(screen.getByRole('button', { name: 'Reset zoom' }));
  expect(change).toHaveBeenLastCalledWith([events[0]?.start, events[2]?.start]);
});

it('UIC-CHART-16.1 retains zero-time events in the table on a positive logarithmic axis', async () => {
  const user = userEvent.setup();
  render(
    <EventChart
      label="Log observations"
      xScale="log"
      events={[{ id: 'zero', label: 'Origin', start: 0 }, ...events]}
    />,
  );
  expect(screen.queryByRole('img', { name: /Origin/ })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Show as table' }));
  expect(screen.getByRole('row', { name: 'Origin 0' })).toBeVisible();
});
