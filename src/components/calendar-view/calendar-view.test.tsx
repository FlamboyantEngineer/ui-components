import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import type { Key } from '../../core/props.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { CalendarView, type CalendarViewEvent, type CalendarViewProps } from './calendar-view.js';

const getNow = () => new Date('2026-03-18T10:00:00Z');

const events: CalendarViewEvent[] = [
  { id: 'trip', title: 'Trip to Lisbon', start: '2026-03-12', end: '2026-03-17', tone: 'info' },
  {
    id: 'review',
    title: 'Design review',
    start: '2026-03-18T14:00:00Z',
    end: '2026-03-18T15:30:00Z',
  },
  { id: 'lunch', title: 'Team lunch', start: '2026-03-18T12:00:00Z' },
  { id: 'release', title: 'Release', start: '2026-03-20', tone: 'success' },
];

function Calendar(props: Partial<CalendarViewProps>) {
  return (
    <UiProvider locale="en-US">
      <CalendarView events={events} timeZone="UTC" getNow={getNow} {...props} />
    </UiProvider>
  );
}

/** Formatted ranges set thin spaces around their dash; tests read them as plain spaces. */
const plain = (text: string | null) => (text ?? '').replace(/[\u00a0\u2009\u202f]/g, ' ');
const named = (text: string) => (name: string) => plain(name) === text;
const cell = (name: string) =>
  screen.getByRole('gridcell', { name: (text) => plain(text).startsWith(name) });
const shown = (element: HTMLElement) => element.querySelector('[aria-hidden]')?.textContent;
const eventNames = (element: HTMLElement) =>
  [...element.querySelectorAll('.ui-calendar-view__event')].map((node) =>
    plain(node.querySelector('.ui-visually-hidden')?.textContent ?? null),
  );

describe('CalendarView', () => {
  it('UIC-CALENDAR-VIEW-1.1 UIC-CALENDAR-VIEW-4.1 UIC-CALENDAR-VIEW-4.3 shows the month of the focused day', () => {
    const { container } = render(<Calendar id="plan" className="mine" data-test="calendar" />);
    const root = container.querySelector('.ui-calendar-view');
    expect(root).toHaveClass('mine');
    expect(root).toHaveAttribute('id', 'plan');
    expect(root).toHaveAttribute('data-view', 'month');
    expect(root).toHaveAttribute('data-test', 'calendar');
    const grid = screen.getByRole('grid', { name: 'March 2026' });
    const headers = within(grid).getAllByRole('columnheader');
    expect(headers.map(shown)).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    expect(headers[0]).toHaveAccessibleName('Sunday');
    expect(within(grid).getAllByRole('row')).toHaveLength(6);
    const first = cell('Sunday, March 1, 2026');
    expect(first).toHaveAttribute('data-date', '2026-03-01');
    expect(first.querySelector('.ui-calendar-view__day-number')).toHaveTextContent('1');
    expect(cell('Saturday, April 4, 2026')).toHaveAttribute('data-outside-month', 'true');
    expectHooksMatchSpec(container, 'CALENDAR-VIEW', {
      slots: [
        'toolbar',
        'today',
        'previous',
        'next',
        'title',
        'views',
        'grid',
        'weekdays',
        'weekday',
        'week',
        'day',
        'day-number',
        'events',
        'event',
        'event-time',
        'event-title',
        'spacer',
      ],
      callerAttributes: ['data-test'],
    });
  });

  it('UIC-CALENDAR-VIEW-1.4 marks today from the clock', () => {
    render(<Calendar />);
    const today = cell('Wednesday, March 18, 2026');
    expect(today).toHaveAttribute('aria-current', 'date');
    expect(today).toHaveAttribute('data-today', 'true');
    expect(today).toHaveAttribute('tabindex', '0');
    expect(cell('Thursday, March 19, 2026')).toHaveAttribute('tabindex', '-1');
  });

  it('UIC-CALENDAR-VIEW-1.3 moves by month, back to today and between views', async () => {
    const onDateChange = vi.fn<(date: string) => void>();
    const onViewChange = vi.fn();
    const { container } = render(
      <Calendar onDateChange={onDateChange} onViewChange={onViewChange} />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(onDateChange).toHaveBeenLastCalledWith('2026-04-18');
    expect(screen.getByRole('grid', { name: 'April 2026' })).toBeInTheDocument();
    expect(container.querySelector('.ui-calendar-view__title')).toHaveAttribute(
      'aria-live',
      'polite',
    );
    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByRole('grid', { name: 'February 2026' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Today' }));
    expect(onDateChange).toHaveBeenLastCalledWith('2026-03-18');
    await user.click(screen.getByRole('radio', { name: 'Week' }));
    expect(onViewChange).toHaveBeenLastCalledWith('week');
    expect(container.querySelector('.ui-calendar-view')).toHaveAttribute('data-view', 'week');
    expect(screen.getByRole('grid', { name: named('Mar 15 – 21, 2026') })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next week' }));
    expect(onDateChange).toHaveBeenLastCalledWith('2026-03-25');
  });

  it('UIC-CALENDAR-VIEW-1.3 follows a controlled date and view, and hides a single view choice', () => {
    const { unmount } = render(<Calendar date="2026-07-04" view="week" views={['week']} />);
    expect(screen.getByRole('grid', { name: named('Jun 28 – Jul 4, 2026') })).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    unmount();
    render(<Calendar defaultDate="2026-07-04" />);
    expect(screen.getByRole('grid', { name: 'July 2026' })).toBeInTheDocument();
  });

  it('UIC-CALENDAR-VIEW-1.2 shows the week with all-day bars, a time grid and hours', () => {
    const { container } = render(<Calendar defaultView="week" />);
    const grid = screen.getByRole('grid', { name: named('Mar 15 – 21, 2026') });
    const headers = within(grid).getAllByRole('columnheader');
    expect(headers.map(shown)).toEqual([
      'Sun 15',
      'Mon 16',
      'Tue 17',
      'Wed 18',
      'Thu 19',
      'Fri 20',
      'Sat 21',
    ]);
    expect(headers[3]).toHaveAttribute('data-today', 'true');
    expect(headers[3]).toHaveAccessibleName('Wednesday, March 18, 2026');
    const hours = container.querySelectorAll('.ui-calendar-view__hour');
    expect(hours).toHaveLength(24);
    expect(hours[9]).toHaveTextContent('9 AM');
    expect(hours[12]).toHaveStyle({ top: '50%' });
    expect(
      container.querySelector('.ui-calendar-view__gutter .ui-calendar-view__all-day'),
    ).toHaveTextContent('All day');
    expectHooksMatchSpec(container, 'CALENDAR-VIEW', {
      slots: ['gutter', 'hour', 'all-day', 'timed'],
    });
  });

  it('UIC-CALENDAR-VIEW-2.2 names events by their times and reports presses', async () => {
    const onEventAction = vi.fn<(key: Key) => void>();
    render(<Calendar onEventAction={onEventAction} />);
    const today = cell('Wednesday, March 18, 2026');
    expect(eventNames(today)).toEqual([
      'Team lunch, 12:00 – 1:00 PM',
      'Design review, 2:00 – 3:30 PM',
    ]);
    const review = within(today).getByRole('button', {
      name: named('Design review, 2:00 – 3:30 PM'),
    });
    expect(review.querySelector('.ui-calendar-view__event-time')).toHaveTextContent('2:00 PM');
    expect(review.querySelector('.ui-calendar-view__event-title')).toHaveTextContent(
      'Design review',
    );
    expect(review).toHaveAttribute('data-tone', 'neutral');
    await userEvent.click(review);
    expect(onEventAction).toHaveBeenCalledWith('review');
    const release = within(cell('Friday, March 20, 2026')).getByRole('button', {
      name: 'Release, March 20',
    });
    expect(release).toHaveAttribute('data-all-day', 'true');
    expect(release).toHaveAttribute('data-tone', 'success');
    expect(release.querySelector('.ui-calendar-view__event-time')).toBeNull();
  });

  it('UIC-CALENDAR-VIEW-2.3 draws multi-day events as bars across each week', () => {
    render(<Calendar />);
    const first = within(cell('Thursday, March 12, 2026')).getByRole('button', {
      name: named('Trip to Lisbon, March 12 – 17'),
    });
    expect(first).toHaveStyle({ width: '300%' });
    expect(first).toHaveAttribute('data-continues-after', 'true');
    const second = within(cell('Sunday, March 15, 2026')).getByRole('button', {
      name: named('Trip to Lisbon, March 12 – 17'),
    });
    expect(second).toHaveStyle({ width: '300%' });
    expect(second).toHaveAttribute('data-continues-before', 'true');
    const covered = cell('Monday, March 16, 2026');
    expect(eventNames(covered)).toEqual([]);
    expect(covered.querySelector('.ui-calendar-view__spacer')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('UIC-CALENDAR-VIEW-2.3 UIC-CALENDAR-VIEW-2.5 places bars and timed events in the week view', () => {
    render(<Calendar defaultView="week" />);
    const trip = within(cell('Sunday, March 15, 2026')).getByRole('button', {
      name: named('Trip to Lisbon, March 12 – 17'),
    });
    expect(trip.closest('.ui-calendar-view__all-day')).not.toBeNull();
    expect(trip).toHaveStyle({ width: '300%' });
    const spacers = cell('Saturday, March 21, 2026').querySelectorAll('.ui-calendar-view__spacer');
    expect(spacers).toHaveLength(1);
    const today = cell('Wednesday, March 18, 2026');
    const review = within(today).getByRole('button', {
      name: named('Design review, 2:00 – 3:30 PM'),
    });
    expect(review.closest('.ui-calendar-view__timed')).not.toBeNull();
    expect(review).toHaveStyle({
      position: 'absolute',
      top: `${(14 / 24) * 100}%`,
      left: '0%',
      width: '100%',
    });
    expect(review.querySelector('.ui-calendar-view__event-time')).toHaveTextContent(
      '2:00 – 3:30 PM',
    );
  });

  it('UIC-CALENDAR-VIEW-2.4 lists a crowded day behind a more button', async () => {
    const crowded = Array.from({ length: 5 }, (_, index) => ({
      id: `talk-${index}`,
      title: `Talk ${index + 1}`,
      start: `2026-03-10T0${index + 1}:00:00Z`,
    }));
    const { container } = render(<Calendar events={crowded} maxEvents={3} />);
    const day = cell('Tuesday, March 10, 2026');
    expect(eventNames(day)).toHaveLength(2);
    const more = within(day).getByRole('button', { name: '+3 more' });
    expect(more).toHaveClass('ui-calendar-view__more', 'ui-button');
    expect(more).toHaveAttribute('tabindex', '-1');
    await userEvent.click(more);
    const dialog = await screen.findByRole('dialog', { name: 'Tuesday, March 10, 2026' });
    expect(eventNames(dialog)).toHaveLength(5);
    expect(dialog.querySelector('.ui-calendar-view__more-list')).not.toBeNull();
    expectHooksMatchSpec(container, 'CALENDAR-VIEW', { slots: ['more'] });
  });

  it('UIC-CALENDAR-VIEW-3.1 draws caller content in each day', () => {
    const renderDay = vi.fn((day: { date: string; isToday: boolean; events: unknown[] }) =>
      day.events.length > 0 ? <span>{day.events.length} items</span> : null,
    );
    const { container } = render(<Calendar renderDay={renderDay} />);
    const today = cell('Wednesday, March 18, 2026');
    expect(today.querySelector('.ui-calendar-view__day-content')).toHaveTextContent('2 items');
    expect(
      cell('Monday, March 2, 2026').querySelector('.ui-calendar-view__day-content'),
    ).toBeNull();
    expect(renderDay).toHaveBeenCalledWith(
      expect.objectContaining({ date: '2026-03-18', isToday: true, isOutsideMonth: false }),
    );
    expect(renderDay).toHaveBeenCalledWith(
      expect.objectContaining({ date: '2026-04-01', isOutsideMonth: true }),
    );
    expectHooksMatchSpec(container, 'CALENDAR-VIEW', { slots: ['day-content'] });
  });

  it('UIC-CALENDAR-VIEW-4.2 moves between days by keyboard and keeps one tab stop', async () => {
    const onDateChange = vi.fn<(date: string) => void>();
    render(<Calendar onDateChange={onDateChange} />);
    const user = userEvent.setup();
    act(() => cell('Wednesday, March 18, 2026').focus());
    await user.keyboard('{ArrowRight}');
    expect(cell('Thursday, March 19, 2026')).toHaveFocus();
    expect(cell('Thursday, March 19, 2026')).toHaveAttribute('tabindex', '0');
    await user.keyboard('{ArrowDown}{End}');
    expect(cell('Saturday, March 28, 2026')).toHaveFocus();
    await user.keyboard('{PageDown}');
    expect(screen.getByRole('grid', { name: 'April 2026' })).toBeInTheDocument();
    expect(cell('Tuesday, April 28, 2026')).toHaveFocus();
    expect(onDateChange).toHaveBeenLastCalledWith('2026-04-28');
  });

  it('UIC-CALENDAR-VIEW-4.2 puts only the focused day events in the tab sequence', async () => {
    render(<Calendar />);
    const user = userEvent.setup();
    const release = within(cell('Friday, March 20, 2026')).getByRole('button', {
      name: 'Release, March 20',
    });
    expect(release).toHaveAttribute('tabindex', '-1');
    act(() => cell('Wednesday, March 18, 2026').focus());
    await user.tab();
    expect(
      screen.getByRole('button', { name: named('Team lunch, 12:00 – 1:00 PM') }),
    ).toHaveFocus();
    await user.click(release);
    expect(cell('Friday, March 20, 2026')).toHaveAttribute('tabindex', '0');
    expect(release).toHaveAttribute('tabindex', '0');
  });

  it('UIC-CALENDAR-VIEW-4.2 mirrors arrow keys right to left', async () => {
    render(
      <UiProvider locale="ar-EG">
        <CalendarView events={[]} timeZone="UTC" getNow={getNow} defaultDate="2026-03-18" />
      </UiProvider>,
    );
    const focused = document.querySelector<HTMLElement>('[data-date="2026-03-18"]');
    act(() => focused?.focus());
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.querySelector('[data-date="2026-03-19"]')).toHaveFocus();
  });
});
