import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { CalendarView, type CalendarViewEvent, type CalendarViewProps } from './calendar-view.js';

const getNow = () => new Date('2026-03-18T10:00:00Z');

const events: CalendarViewEvent[] = [
  { id: 'review', title: 'Design review', start: '2026-03-18T14:00', end: '2026-03-18T15:30' },
  { id: 'trip', title: 'Trip', start: '2026-03-18', end: '2026-03-19' },
  { id: 'release', title: 'Release', start: '2026-03-18', isReadOnly: true },
];

type Change = (next: CalendarViewEvent, previous: CalendarViewEvent) => void;

/** A host that applies every change. */
function Calendar({
  onEventChange,
  ...props
}: Partial<CalendarViewProps> & { onEventChange?: Change }) {
  const [current, setCurrent] = useState(events);
  return (
    <UiProvider locale="en-US">
      <CalendarView
        events={current}
        timeZone="UTC"
        getNow={getNow}
        defaultDate="2026-03-18"
        onEventChange={(next, previous) => {
          setCurrent((list) => list.map((event) => (event.id === next.id ? next : event)));
          onEventChange?.(next, previous);
        }}
        {...props}
      />
    </UiProvider>
  );
}

const handle = (name: string) => screen.getByRole('button', { name });

describe('CalendarView event handles', () => {
  it('UIC-CALENDAR-VIEW-6.1 shows handles only where the host allows the change', () => {
    const { rerender } = render(<Calendar />);
    expect(handle('Move Design review')).toBeInTheDocument();
    // A timed event in the month view moves but has no end to drag.
    expect(screen.queryByRole('button', { name: 'Resize Design review' })).not.toBeInTheDocument();
    expect(handle('Resize Trip')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Move Release' })).not.toBeInTheDocument();
    rerender(
      <Calendar canChangeEvent={(event, change) => change !== 'move' || event.id !== 'trip'} />,
    );
    expect(screen.queryByRole('button', { name: 'Move Trip' })).not.toBeInTheDocument();
    expect(handle('Resize Trip')).toBeInTheDocument();
    rerender(
      <UiProvider locale="en-US">
        <CalendarView events={events} timeZone="UTC" getNow={getNow} defaultDate="2026-03-18" />
      </UiProvider>,
    );
    expect(screen.queryByRole('button', { name: /^(Move|Resize) / })).not.toBeInTheDocument();
  });

  it('UIC-CALENDAR-VIEW-6.3 steps a bar by days and weeks, keeping focus on its handle', async () => {
    const user = userEvent.setup();
    const onEventChange = vi.fn();
    render(<Calendar onEventChange={onEventChange} />);
    handle('Move Trip').focus();
    await user.keyboard('{ArrowRight}');
    expect(onEventChange).toHaveBeenLastCalledWith(
      { ...events[1], start: '2026-03-19', end: '2026-03-20' },
      events[1],
    );
    await waitFor(() => expect(handle('Move Trip')).toHaveFocus());
    expect(screen.getByRole('gridcell', { name: /March 19/ })).toHaveAttribute('tabindex', '0');
    await user.keyboard('{ArrowDown}');
    expect(onEventChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ start: '2026-03-26', end: '2026-03-27' }),
      expect.objectContaining({ start: '2026-03-19' }),
    );
    await waitFor(() => expect(handle('Move Trip')).toHaveFocus());
    // Tab passes the event itself, then reaches its end.
    await user.keyboard('{Tab}{Tab}');
    expect(handle('Resize Trip')).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(onEventChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ start: '2026-03-26', end: '2026-03-26' }),
      expect.objectContaining({ end: '2026-03-27' }),
    );
  });

  it('UIC-CALENDAR-VIEW-6.3 steps a block by 15 minutes in the week view', async () => {
    const user = userEvent.setup();
    const onEventChange = vi.fn();
    render(<Calendar onEventChange={onEventChange} defaultView="week" />);
    handle('Move Design review').focus();
    await user.keyboard('{ArrowUp}');
    expect(onEventChange).toHaveBeenLastCalledWith(
      { ...events[0], start: '2026-03-18T13:45', end: '2026-03-18T15:15' },
      events[0],
    );
    handle('Resize Design review').focus();
    await user.keyboard('{ArrowDown}');
    expect(onEventChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ start: '2026-03-18T13:45', end: '2026-03-18T15:30' }),
      expect.objectContaining({ end: '2026-03-18T15:15' }),
    );
    // A handle press neither opens the event nor changes it.
    const onEventAction = vi.fn();
    onEventChange.mockClear();
    render(<Calendar onEventChange={onEventChange} onEventAction={onEventAction} />);
    const second = screen.getAllByRole('grid').at(-1);
    if (!second) throw new Error('no grid');
    await user.click(within(second).getByRole('button', { name: 'Move Trip' }));
    expect(onEventAction).not.toHaveBeenCalled();
    expect(onEventChange).not.toHaveBeenCalled();
  });
});
