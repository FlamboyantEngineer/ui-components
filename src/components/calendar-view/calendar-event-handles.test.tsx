import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

const button = (name: string) => screen.getByRole('button', { name });
const eventButton = (title: string) =>
  screen.getByRole('button', { name: (name) => name.startsWith(`${title},`) });

describe('CalendarView event drags', () => {
  it('UIC-CALENDAR-VIEW-6.1 offers edges and moves only where the mode and the host allow them', () => {
    const { rerender } = render(<Calendar />);
    // The move mode: the event moves, its end edge changes its end; no start edge.
    expect(eventButton('Trip')).toHaveAttribute('data-movable', 'true');
    expect(button('Change end of Trip')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Change start of Trip' })).not.toBeInTheDocument();
    // A timed event in the month view has no edge to drag.
    expect(screen.queryByRole('button', { name: /of Design review$/ })).not.toBeInTheDocument();
    expect(eventButton('Release')).not.toHaveAttribute('data-movable');
    rerender(<Calendar eventDragMode="resize" />);
    expect(eventButton('Trip')).not.toHaveAttribute('data-movable');
    expect(button('Change start of Trip')).toBeInTheDocument();
    expect(button('Change end of Trip')).toBeInTheDocument();
    rerender(
      <Calendar canChangeEvent={(event, change) => change !== 'resize' || event.id !== 'trip'} />,
    );
    expect(screen.queryByRole('button', { name: /of Trip$/ })).not.toBeInTheDocument();
    expect(eventButton('Trip')).toHaveAttribute('data-movable', 'true');
    rerender(
      <UiProvider locale="en-US">
        <CalendarView events={events} timeZone="UTC" getNow={getNow} defaultDate="2026-03-18" />
      </UiProvider>,
    );
    expect(
      screen.queryByRole('button', { name: /^Change (start|end) of / }),
    ).not.toBeInTheDocument();
    expect(eventButton('Trip')).not.toHaveAttribute('data-movable');
  });

  it('UIC-CALENDAR-VIEW-6.3 steps a moving event by days and weeks, keeping focus on it', async () => {
    const user = userEvent.setup();
    const onEventChange = vi.fn();
    render(<Calendar onEventChange={onEventChange} />);
    eventButton('Trip').focus();
    await user.keyboard('{ArrowRight}');
    expect(onEventChange).toHaveBeenLastCalledWith(
      { ...events[1], start: '2026-03-19', end: '2026-03-20' },
      events[1],
    );
    await waitFor(() => expect(eventButton('Trip')).toHaveFocus());
    expect(screen.getByRole('gridcell', { name: /March 19/ })).toHaveAttribute('tabindex', '0');
    await user.keyboard('{ArrowDown}');
    expect(onEventChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ start: '2026-03-26', end: '2026-03-27' }),
      expect.objectContaining({ start: '2026-03-19' }),
    );
    await waitFor(() => expect(eventButton('Trip')).toHaveFocus());
    await user.keyboard('{Tab}');
    expect(button('Change end of Trip')).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(onEventChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ start: '2026-03-26', end: '2026-03-26' }),
      expect.objectContaining({ end: '2026-03-27' }),
    );
  });

  it('UIC-CALENDAR-VIEW-6.3 steps only on plain arrows, not on shortcuts, composition or handled keys', async () => {
    const user = userEvent.setup();
    const onEventChange = vi.fn();
    render(<Calendar onEventChange={onEventChange} defaultView="week" />);
    for (const target of [eventButton('Design review'), button('Change end of Design review')]) {
      target.focus();
      for (const chord of ['Control', 'Alt', 'Meta', 'Shift']) {
        await user.keyboard(`{${chord}>}{ArrowRight}{ArrowDown}{/${chord}}`);
      }
      // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot mark a key as composing.
      fireEvent.keyDown(target, { key: 'ArrowDown', isComposing: true });
      // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot send key code 229.
      fireEvent.keyDown(target, { key: 'ArrowDown', keyCode: 229 });
      const handled = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        cancelable: true,
      });
      handled.preventDefault();
      target.dispatchEvent(handled);
      expect(onEventChange).not.toHaveBeenCalled();
      expect(target).toHaveFocus();
    }
    eventButton('Design review').focus();
    await user.keyboard('{ArrowDown}');
    expect(onEventChange).toHaveBeenLastCalledWith(
      { ...events[0], start: '2026-03-18T14:15', end: '2026-03-18T15:45' },
      events[0],
    );
  });

  it('UIC-CALENDAR-VIEW-6.3 steps the start and end of a block by 15 minutes in the resize mode', async () => {
    const user = userEvent.setup();
    const onEventChange = vi.fn();
    const onEventAction = vi.fn();
    render(
      <Calendar
        onEventChange={onEventChange}
        onEventAction={onEventAction}
        defaultView="week"
        eventDragMode="resize"
      />,
    );
    // The resize mode does not move the event by its keys.
    eventButton('Design review').focus();
    await user.keyboard('{ArrowUp}');
    expect(onEventChange).not.toHaveBeenCalled();
    button('Change start of Design review').focus();
    await user.keyboard('{ArrowUp}');
    expect(onEventChange).toHaveBeenLastCalledWith(
      { ...events[0], start: '2026-03-18T13:45', end: '2026-03-18T15:30' },
      events[0],
    );
    await waitFor(() => expect(button('Change start of Design review')).toHaveFocus());
    button('Change end of Design review').focus();
    await user.keyboard('{ArrowDown}');
    expect(onEventChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ start: '2026-03-18T13:45', end: '2026-03-18T15:45' }),
      expect.objectContaining({ end: '2026-03-18T15:30' }),
    );
    // Pressing an edge neither opens the event nor changes it.
    onEventChange.mockClear();
    await user.click(button('Change end of Design review'));
    expect(onEventAction).not.toHaveBeenCalled();
    expect(onEventChange).not.toHaveBeenCalled();
  });
});
