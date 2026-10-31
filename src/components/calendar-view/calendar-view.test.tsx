import { createRef } from 'react';
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
  it('UIC-CALENDAR-VIEW-2.1 UIC-CALENDAR-VIEW-2.2 keeps numeric and text event identities in the week view', async () => {
    const user = userEvent.setup();
    const onEventAction = vi.fn();
    const typedEvents = [
      { id: 1, title: 'Numeric event', start: '2026-03-18T12:00:00Z' },
      { id: '1', title: 'Text event', start: '2026-03-18T12:00:00Z' },
    ];
    const props = { events: typedEvents, defaultView: 'week' as const, onEventAction };
    const { rerender } = render(<Calendar {...props} />);
    const numeric = screen.getByRole('button', { name: /^Numeric event,/ });
    const text = screen.getByRole('button', { name: /^Text event,/ });
    rerender(<Calendar {...props} events={[...typedEvents].reverse()} />);
    expect(screen.getByRole('button', { name: /^Numeric event,/ })).toBe(numeric);
    expect(screen.getByRole('button', { name: /^Text event,/ })).toBe(text);
    await user.click(numeric);
    await user.click(text);
    expect(onEventAction.mock.calls).toEqual([[1], ['1']]);
  });

  describe.each(['month', 'week'] as const)('in the %s view, a focused all-day event', (view) => {
    const charlie = { id: 'charlie', title: 'Charlie', start: '2026-11-02' };
    const alpha = { id: 'alpha', title: 'Alpha', start: '2026-11-02' };
    const bravo = { id: 'bravo', title: 'Bravo', start: '2026-11-02' };
    const props = { date: '2026-11-02', view, maxEvents: 5 };
    const button = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name},`) });

    it('UIC-CALENDAR-VIEW-2.2 keeps its button and focus when an event is packed before it', async () => {
      const user = userEvent.setup();
      const onEventAction = vi.fn();
      const { rerender } = render(
        <Calendar {...props} events={[charlie]} onEventAction={onEventAction} />,
      );
      const focused = button('Charlie');
      act(() => focused.focus());
      rerender(<Calendar {...props} events={[alpha, charlie]} onEventAction={onEventAction} />);
      expect(button('Charlie')).toBe(focused);
      expect(focused).toHaveFocus();
      await user.keyboard('{Enter}');
      await user.keyboard(' ');
      expect(onEventAction.mock.calls).toEqual([['charlie'], ['charlie']]);
    });

    it('UIC-CALENDAR-VIEW-2.2 keeps focus on it when a change moves it to a later lane', async () => {
      const user = userEvent.setup();
      const onEventAction = vi.fn();
      const { rerender } = render(
        <Calendar {...props} events={[alpha, bravo]} onEventAction={onEventAction} />,
      );
      const focused = button('Alpha');
      act(() => focused.focus());
      const renamed = { ...alpha, title: 'Zulu' };
      rerender(<Calendar {...props} events={[renamed, bravo]} onEventAction={onEventAction} />);
      expect(button('Zulu')).toBe(focused);
      expect(focused).toHaveFocus();
      await user.keyboard('{Enter}');
      expect(onEventAction).toHaveBeenCalledExactlyOnceWith('alpha');
    });

    it('UIC-CALENDAR-VIEW-2.2 hands focus to its day when it is removed', () => {
      const { rerender } = render(<Calendar {...props} events={[alpha, charlie]} />);
      act(() => button('Charlie').focus());
      rerender(<Calendar {...props} events={[alpha]} />);
      expect(document.querySelector('[role="gridcell"][data-date="2026-11-02"]')).toHaveFocus();
    });
  });

  it('UIC-CALENDAR-VIEW-2.4 hands focus to the day when a focused event moves behind the more button', () => {
    const at = (id: string, title: string) => ({ id, title, start: '2026-11-02' });
    const props = { date: '2026-11-02', maxEvents: 2 };
    const { rerender } = render(
      <Calendar {...props} events={[at('charlie', 'Charlie'), at('delta', 'Delta')]} />,
    );
    act(() => screen.getByRole('button', { name: /^Charlie,/ }).focus());
    rerender(
      <Calendar
        {...props}
        events={[at('alpha', 'Alpha'), at('charlie', 'Charlie'), at('delta', 'Delta')]}
      />,
    );
    expect(screen.queryByRole('button', { name: /^Charlie,/ })).not.toBeInTheDocument();
    expect(document.querySelector('[role="gridcell"][data-date="2026-11-02"]')).toHaveFocus();
  });

  it('UIC-CALENDAR-VIEW-2.1 UIC-CALENDAR-VIEW-2.4 keeps numeric and text events distinct in a crowded-day list', async () => {
    const user = userEvent.setup();
    const onEventAction = vi.fn();
    const typedEvents = [
      { id: 1, title: 'Numeric event', start: '2026-03-18T12:00:00Z' },
      { id: '1', title: 'Text event', start: '2026-03-18T12:00:00Z' },
    ];
    const props = { events: typedEvents, maxEvents: 1, onEventAction };
    const { rerender } = render(<Calendar {...props} />);
    await user.click(screen.getByRole('button', { name: '+2 more' }));
    const numeric = await screen.findByRole('button', { name: /^Numeric event,/ });
    const text = screen.getByRole('button', { name: /^Text event,/ });
    rerender(<Calendar {...props} events={[...typedEvents].reverse()} />);
    expect(screen.getByRole('button', { name: /^Numeric event,/ })).toBe(numeric);
    expect(screen.getByRole('button', { name: /^Text event,/ })).toBe(text);
    await user.click(numeric);
    await user.click(text);
    expect(onEventAction.mock.calls).toEqual([[1], ['1']]);
  });
  it('UIC-CALENDAR-VIEW-4.3 forwards ref to its root', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<Calendar ref={ref} />);
    expect(ref.current).toBe(container.querySelector('.ui-calendar-view'));
  });

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

  it('UIC-CALENDAR-VIEW-2.5 keeps events under their hour labels on clock-change days', () => {
    const { container } = render(
      <Calendar
        defaultView="week"
        defaultDate="2026-11-01"
        timeZone="America/New_York"
        events={[
          {
            id: 'first',
            title: 'First pass',
            start: '2026-11-01T01:30-04:00',
            end: '2026-11-01T01:45-04:00',
          },
          {
            id: 'second',
            title: 'Second pass',
            start: '2026-11-01T01:30-05:00',
            end: '2026-11-01T01:45-05:00',
          },
          { id: 'noon', title: 'Noon', start: '2026-11-01T12:00', end: '2026-11-01T13:00' },
        ]}
      />,
    );
    const day = cell('Sunday, November 1, 2026');
    const button = (text: string) =>
      within(day).getByRole('button', { name: (name) => plain(name).startsWith(text) });
    const noonLabel = container.querySelectorAll<HTMLElement>('.ui-calendar-view__hour')[12];
    expect(button('Noon').style.top).toBe(noonLabel?.style.top);
    expect(
      within(day).getByRole('button', { name: named('First pass, 1:30 AM EDT – 1:45 AM EDT') }),
    ).toBe(button('First pass'));
    expect(
      within(day).getByRole('button', { name: named('Second pass, 1:30 AM EST – 1:45 AM EST') }),
    ).toBe(button('Second pass'));
    expect(button('First pass').style.top).toBe(button('Second pass').style.top);
    expect(button('First pass').style.left).not.toBe(button('Second pass').style.left);
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

  it('UIC-CALENDAR-VIEW-4.2 moves from the cell that has focus, also a day of another month', async () => {
    render(<Calendar defaultDate="2026-04-15" />);
    const user = userEvent.setup();
    await user.click(document.querySelector('[data-date="2026-03-30"]') as HTMLElement);
    await user.keyboard('{ArrowRight}');
    expect(document.querySelector('[data-date="2026-03-31"]')).toHaveFocus();
    expect(screen.getByRole('grid', { name: 'March 2026' })).toBeInTheDocument();
    await user.click(document.querySelector('[data-date="2026-04-01"]') as HTMLElement);
    await user.keyboard('{ArrowLeft}');
    expect(document.querySelector('[data-date="2026-03-31"]')).toHaveFocus();
  });

  it('UIC-CALENDAR-VIEW-4.2 leaves focus alone after a keyboard move the owner refuses', async () => {
    const view = (date: string) => <Calendar date={date} onDateChange={() => {}} />;
    const { rerender } = render(view('2026-03-18'));
    const user = userEvent.setup();
    act(() => cell('Wednesday, March 18, 2026').focus());
    await user.keyboard('{ArrowRight}');
    expect(cell('Wednesday, March 18, 2026')).toHaveFocus();
    const next = screen.getByRole('button', { name: 'Next month' });
    act(() => next.focus());
    rerender(view('2026-04-18'));
    expect(next).toHaveFocus();
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
