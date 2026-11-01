import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { CalendarView, type CalendarViewProps } from './calendar-view.js';

function Calendar(props: Partial<CalendarViewProps>) {
  return (
    <UiProvider locale="en-US">
      <CalendarView events={[]} timeZone="UTC" defaultDate="2026-03-04" {...props} />
    </UiProvider>
  );
}

const shownView = (container: HTMLElement) =>
  container.querySelector('.ui-calendar-view')?.getAttribute('data-view');
const viewChoice = () => screen.queryByRole('radiogroup', { name: 'Calendar views' });

describe('CalendarView allowed views', () => {
  it.each<[string, Partial<CalendarViewProps>, string]>([
    ['the sole allowed view', { views: ['week'] }, 'week'],
    ['an allowed default view', { views: ['month', 'week'], defaultView: 'week' }, 'week'],
    [
      'the first allowed view over a default outside them',
      { views: ['week'], defaultView: 'month' },
      'week',
    ],
    ['month while it is allowed, whatever the order', { views: ['week', 'month'] }, 'month'],
    ['month, with every view allowed by an empty list', { views: [] }, 'month'],
    [
      'the allowed view over a controlled view outside them',
      { views: ['week'], view: 'month' },
      'week',
    ],
  ])('UIC-CALENDAR-VIEW-1.3 opens on %s', (_, props, expected) => {
    const { container } = render(<Calendar {...props} />);
    expect(shownView(container)).toBe(expected);
  });

  it('UIC-CALENDAR-VIEW-1.3 ignores repeated views when deciding to offer a choice', () => {
    render(<Calendar views={['week', 'week']} />);
    expect(viewChoice()).not.toBeInTheDocument();
    expect(screen.getByRole('grid')).toHaveAccessibleName(/Mar 1/);
  });

  it('UIC-CALENDAR-VIEW-1.3 moves off a view that stops being allowed, without reporting it', async () => {
    const user = userEvent.setup();
    const onViewChange = vi.fn();
    const { container, rerender } = render(<Calendar onViewChange={onViewChange} />);
    await user.click(screen.getByRole('radio', { name: 'Week' }));
    expect(onViewChange).toHaveBeenLastCalledWith('week');
    rerender(<Calendar onViewChange={onViewChange} views={['month']} />);
    expect(shownView(container)).toBe('month');
    expect(viewChoice()).not.toBeInTheDocument();
    rerender(<Calendar onViewChange={onViewChange} views={['month', 'week']} />);
    expect(shownView(container)).toBe('week');
    expect(screen.getByRole('radio', { name: 'Week' })).toBeChecked();
    expect(onViewChange).toHaveBeenCalledTimes(1);
  });

  it('UIC-CALENDAR-VIEW-1.3 follows a controlled view among the allowed ones', async () => {
    const user = userEvent.setup();
    const onViewChange = vi.fn();
    const { container } = render(<Calendar view="week" onViewChange={onViewChange} />);
    expect(shownView(container)).toBe('week');
    await user.click(screen.getByRole('radio', { name: 'Month' }));
    expect(onViewChange).toHaveBeenCalledWith('month');
    expect(shownView(container)).toBe('week');
  });
});
