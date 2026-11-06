import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { CalendarView, type CalendarViewEvent, type CalendarViewProps } from './calendar-view.js';

const getNow = () => new Date('2026-03-18T10:00:00Z');

const events: CalendarViewEvent[] = [
  { id: 'trip', title: 'Trip to Lisbon', start: '2026-03-12', end: '2026-03-17', tone: 'info' },
  { id: 'review', title: 'Design review', start: '2026-03-18T14:00Z', end: '2026-03-18T15:30Z' },
  { id: 'lunch', title: 'Team lunch', start: '2026-03-18T12:00Z' },
  { id: 'call', title: 'Supplier call', start: '2026-03-18T12:30Z', end: '2026-03-18T13:00Z' },
  { id: 'release', title: 'Release', start: '2026-03-18', isReadOnly: true },
  { id: 'night', title: 'Maintenance', start: '2026-03-19T22:00Z', end: '2026-03-20T02:00Z' },
];

function Calendar(props: Partial<CalendarViewProps>) {
  return (
    <UiProvider locale="en-US">
      <CalendarView
        events={events}
        timeZone="UTC"
        getNow={getNow}
        defaultDate="2026-03-18"
        {...props}
      />
    </UiProvider>
  );
}

/** Formatted ranges set thin spaces around their dash; tests read them as plain spaces. */
const plain = (text: string | null) => (text ?? '').replace(/[\u00a0\u2009\u202f]/g, ' ');
const named = (text: string) => (name: string) => plain(name) === text;
const shownView = (container: HTMLElement) =>
  container.querySelector('.ui-calendar-view')?.getAttribute('data-view');
const agenda = () => screen.getByRole('group', { name: (name) => /Mar 15/.test(plain(name)) });
const agendaDays = () =>
  within(agenda())
    .queryAllByRole('heading')
    .map((heading) => heading.textContent);
const shownTexts = (section: HTMLElement) =>
  [...section.querySelectorAll('.ui-calendar-view__event')].map((node) =>
    plain([...node.querySelectorAll('[aria-hidden]')].map((part) => part.textContent).join(' | ')),
  );
const agendaDay = (heading: string) => screen.getByRole('group', { name: heading }) as HTMLElement;

describe('CalendarView day view', () => {
  it('UIC-CALENDAR-VIEW-1.7 shows the focused day with its all-day bars and time grid', () => {
    const { container } = render(<Calendar defaultView="day" />);
    expect(shownView(container)).toBe('day');
    const grid = screen.getByRole('grid', { name: 'Wednesday, March 18, 2026' });
    const cells = within(grid).getAllByRole('gridcell');
    expect(cells).toHaveLength(1);
    expect(cells[0]).toHaveAttribute('data-date', '2026-03-18');
    expect(within(grid).getAllByRole('columnheader')).toHaveLength(1);
    const allDay = cells[0]?.querySelector('.ui-calendar-view__all-day');
    expect(allDay?.querySelector('.ui-calendar-view__event')).toHaveAccessibleName(
      /^Release, March 18/,
    );
    const timed = cells[0]?.querySelector('.ui-calendar-view__timed');
    expect(timed?.querySelectorAll('.ui-calendar-view__event')).toHaveLength(3);
    expect(container.querySelectorAll('.ui-calendar-view__hour')).toHaveLength(24);
  });

  it('UIC-CALENDAR-VIEW-1.7 packs overlapping events as the week view does', () => {
    render(<Calendar defaultView="day" />);
    const lunch = screen.getByRole('button', { name: /^Team lunch,/ });
    const call = screen.getByRole('button', { name: /^Supplier call,/ });
    expect(lunch.style.width).toBe('50%');
    expect(call.style.left).toBe('50%');
    expect(lunch.style.top).toBe(`${(12 / 24) * 100}%`);
  });

  it('UIC-CALENDAR-VIEW-1.3 UIC-CALENDAR-VIEW-1.7 moves by a day and names the buttons for it', async () => {
    const user = userEvent.setup();
    const onDateChange = vi.fn();
    render(<Calendar defaultView="day" onDateChange={onDateChange} />);
    await user.click(screen.getByRole('button', { name: 'Next day' }));
    expect(onDateChange).toHaveBeenLastCalledWith('2026-03-19');
    expect(screen.getByRole('grid', { name: 'Thursday, March 19, 2026' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Maintenance,/ })).toHaveAttribute(
      'data-continues-after',
      'true',
    );
    await user.click(screen.getByRole('button', { name: 'Previous day' }));
    await user.click(screen.getByRole('button', { name: 'Previous day' }));
    expect(onDateChange).toHaveBeenLastCalledWith('2026-03-17');
  });

  it('UIC-CALENDAR-VIEW-4.2 moves the day by keyboard, PageDown by a day', async () => {
    const user = userEvent.setup();
    render(<Calendar defaultView="day" />);
    await user.click(screen.getByRole('gridcell'));
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('gridcell')).toHaveAttribute('data-date', '2026-03-19');
    expect(screen.getByRole('gridcell')).toHaveFocus();
    await user.keyboard('{PageDown}');
    expect(screen.getByRole('gridcell')).toHaveAttribute('data-date', '2026-03-20');
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('gridcell')).toHaveAttribute('data-date', '2026-03-13');
  });
});

describe('CalendarView agenda view', () => {
  it('UIC-CALENDAR-VIEW-1.8 UIC-CALENDAR-VIEW-4.3 lists the week events by day, all-day first', () => {
    const { container } = render(<Calendar defaultView="agenda" />);
    expect(shownView(container)).toBe('agenda');
    expect(agendaDays()).toEqual([
      'Sunday, March 15, 2026',
      'Monday, March 16, 2026',
      'Tuesday, March 17, 2026',
      'Wednesday, March 18, 2026',
      'Thursday, March 19, 2026',
      'Friday, March 20, 2026',
    ]);
    const wednesday = agendaDay('Wednesday, March 18, 2026');
    expect(wednesday).toHaveAttribute('data-date', '2026-03-18');
    expect(wednesday).toHaveAttribute('aria-current', 'date');
    expect(wednesday).toHaveAttribute('data-today', 'true');
    expect(shownTexts(wednesday)).toEqual([
      'All day | Release',
      '12:00 – 1:00 PM | Team lunch',
      '12:30 – 1:00 PM | Supplier call',
      '2:00 – 3:30 PM | Design review',
    ]);
    expect(within(wednesday).getAllByRole('listitem')).toHaveLength(4);
    const trip = within(agendaDay('Sunday, March 15, 2026')).getByRole('button', {
      name: named('Trip to Lisbon, March 12 – 17'),
    });
    expect(trip).toHaveAttribute('data-continues-before', 'true');
    expect(trip).toHaveAttribute('data-continues-after', 'true');
    expect(container.querySelector('.ui-calendar-view__agenda-empty')).toBeNull();
    expectHooksMatchSpec(container, 'CALENDAR-VIEW', {
      slots: [
        'toolbar',
        'agenda',
        'agenda-day',
        'agenda-heading',
        'agenda-events',
        'agenda-item',
        'event',
        'event-time',
        'event-title',
      ],
    });
  });

  it('UIC-CALENDAR-VIEW-1.8 lists empty days when asked and draws caller day content', () => {
    render(
      <Calendar
        defaultView="agenda"
        agendaEmptyDays="show"
        renderDay={(day) => (day.events.length > 0 ? `${day.events.length} events` : null)}
      />,
    );
    expect(agendaDays()).toHaveLength(7);
    const saturday = agendaDay('Saturday, March 21, 2026');
    expect(within(saturday).queryByRole('list')).not.toBeInTheDocument();
    expect(agendaDay('Wednesday, March 18, 2026')).toHaveTextContent('4 events');
  });

  it('UIC-CALENDAR-VIEW-1.8 shows the empty state for a week without events', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(<Calendar defaultView="agenda" />);
    await user.click(screen.getByRole('button', { name: 'Next week' }));
    await user.click(screen.getByRole('button', { name: 'Next week' }));
    const empty = () => container.querySelector('.ui-calendar-view__agenda-empty');
    expect(empty()).toHaveTextContent('No events');
    expect(screen.queryAllByRole('heading')).toHaveLength(0);
    rerender(<Calendar defaultView="agenda" renderEmptyState={() => 'Nothing planned'} />);
    expect(empty()).toHaveTextContent('Nothing planned');
  });

  it('UIC-CALENDAR-VIEW-1.8 UIC-CALENDAR-VIEW-2.2 reports presses and keeps read-only events read-only', async () => {
    const user = userEvent.setup();
    const onEventAction = vi.fn();
    const onEventChange = vi.fn();
    render(
      <Calendar defaultView="agenda" onEventAction={onEventAction} onEventChange={onEventChange} />,
    );
    await user.click(screen.getByRole('button', { name: /^Release,/ }));
    expect(onEventAction).toHaveBeenLastCalledWith('release');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Team lunch,/ }));
    expect(onEventAction).toHaveBeenLastCalledWith('lunch');
    expect(screen.getByRole('dialog', { name: 'Edit event' })).toBeInTheDocument();
  });

  it('UIC-CALENDAR-VIEW-1.8 offers no drags or edges in the agenda', () => {
    const { container } = render(
      <Calendar defaultView="agenda" onEventChange={vi.fn()} eventDragMode="resize" />,
    );
    expect(container.querySelector('[data-movable]')).toBeNull();
    expect(container.querySelector('.ui-calendar-view__event-frame')).toBeNull();
  });

  it('UIC-CALENDAR-VIEW-4.2 puts every agenda event in the tab sequence', async () => {
    const user = userEvent.setup();
    render(<Calendar defaultView="agenda" views={['agenda']} />);
    await user.tab();
    await user.tab();
    await user.tab();
    await user.tab();
    const trips = screen.getAllByRole('button', { name: /^Trip to Lisbon,/ });
    expect(trips[0]).toHaveFocus();
    await user.tab();
    expect(trips[1]).toHaveFocus();
  });

  it('UIC-CALENDAR-VIEW-2.2 hands focus to its agenda day when a focused event is removed', () => {
    const { rerender } = render(<Calendar defaultView="agenda" />);
    screen.getByRole('button', { name: /^Supplier call,/ }).focus();
    rerender(
      <Calendar defaultView="agenda" events={events.filter((event) => event.id !== 'call')} />,
    );
    expect(agendaDay('Wednesday, March 18, 2026')).toHaveFocus();
  });
});

describe('CalendarView month agenda', () => {
  it('UIC-CALENDAR-VIEW-1.8 UIC-CALENDAR-VIEW-1.3 lists the focused month and moves by a month', async () => {
    const user = userEvent.setup();
    const onDateChange = vi.fn();
    render(
      <Calendar
        defaultView="agenda"
        agendaRange="month"
        agendaEmptyDays="show"
        onDateChange={onDateChange}
      />,
    );
    const month = screen.getByRole('group', { name: 'March 2026' });
    const headings = within(month).getAllByRole('heading');
    expect(headings).toHaveLength(31);
    expect(headings[0]).toHaveTextContent('Sunday, March 1, 2026');
    expect(headings.at(-1)).toHaveTextContent('Tuesday, March 31, 2026');
    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(onDateChange).toHaveBeenLastCalledWith('2026-04-18');
    const april = screen.getByRole('group', { name: 'April 2026' });
    expect(within(april).getAllByRole('heading')).toHaveLength(30);
    expect(april.querySelector('.ui-calendar-view__agenda-empty')).toHaveTextContent('No events');
  });

  it('UIC-CALENDAR-VIEW-1.8 leaves out the month days without events by default', () => {
    render(<Calendar defaultView="agenda" agendaRange="month" />);
    expect(
      within(screen.getByRole('group', { name: 'March 2026' }))
        .getAllByRole('heading')
        .map((heading) => heading.textContent),
    ).toEqual([
      'Thursday, March 12, 2026',
      'Friday, March 13, 2026',
      'Saturday, March 14, 2026',
      'Sunday, March 15, 2026',
      'Monday, March 16, 2026',
      'Tuesday, March 17, 2026',
      'Wednesday, March 18, 2026',
      'Thursday, March 19, 2026',
      'Friday, March 20, 2026',
    ]);
  });
});

describe('CalendarView changing views', () => {
  it('UIC-CALENDAR-VIEW-1.3 offers every view and keeps the focused day across them', async () => {
    const user = userEvent.setup();
    const onViewChange = vi.fn();
    const { container } = render(<Calendar defaultDate="2026-03-19" onViewChange={onViewChange} />);
    const choice = screen.getByRole('radiogroup', { name: 'View' });
    expect(
      within(choice)
        .getAllByRole('radio')
        .map((radio) => radio.textContent),
    ).toEqual(['Month', 'Week', 'Day', 'Agenda']);
    await user.click(screen.getByRole('radio', { name: 'Day' }));
    expect(onViewChange).toHaveBeenLastCalledWith('day');
    expect(screen.getByRole('grid', { name: 'Thursday, March 19, 2026' })).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Agenda' }));
    expect(shownView(container)).toBe('agenda');
    expect(screen.getByRole('group', { name: named('Mar 15 – 21, 2026') })).toBe(agenda());
    await user.click(screen.getByRole('button', { name: 'Next week' }));
    await user.click(screen.getByRole('radio', { name: 'Day' }));
    expect(screen.getByRole('grid', { name: 'Thursday, March 26, 2026' })).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Month' }));
    expect(screen.getByRole('gridcell', { name: /^Thursday, March 26/ })).toHaveAttribute(
      'tabindex',
      '0',
    );
  });
});
