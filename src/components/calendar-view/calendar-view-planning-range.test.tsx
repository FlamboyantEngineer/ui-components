import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { CalendarView, type CalendarViewProps } from './calendar-view.js';

function Calendar(props: Partial<CalendarViewProps>) {
  return (
    <UiProvider locale="en-US">
      <CalendarView events={[]} timeZone="UTC" {...props} />
    </UiProvider>
  );
}

const shownDays = (container: HTMLElement) =>
  [...container.querySelectorAll('[role="gridcell"][data-date]')].map((cell) => ({
    date: cell.getAttribute('data-date'),
    isTabbable: (cell as HTMLElement).tabIndex === 0,
  }));

describe('CalendarView planning range', () => {
  it('UIC-CALENDAR-VIEW-1.6 shows the last supported week for a day past the range, once each', () => {
    const { container } = render(<Calendar date="9999-12-31" defaultView="week" />);
    const days = shownDays(container);
    expect(days.map((day) => day.date)).toEqual([
      '9998-12-27',
      '9998-12-28',
      '9998-12-29',
      '9998-12-30',
      '9998-12-31',
      '9999-01-01',
      '9999-01-02',
    ]);
    expect(days.filter((day) => day.isTabbable).map((day) => day.date)).toEqual(['9998-12-31']);
  });

  it('UIC-CALENDAR-VIEW-1.6 shows the first supported month for a day before the range', () => {
    const { container } = render(<Calendar defaultDate="0001-01-01" />);
    expect(screen.getByRole('grid', { name: /^January 2$/ })).toBeVisible();
    const dates = shownDays(container).map((day) => day.date ?? '');
    expect(new Set(dates).size).toBe(dates.length);
    expect(dates).toContain('0002-01-01');
  });

  it('UIC-CALENDAR-VIEW-1.6 stays inside the range when moving past its ends', async () => {
    const user = userEvent.setup();
    const onDateChange = vi.fn();
    render(<Calendar defaultDate="9998-12-31" defaultView="week" onDateChange={onDateChange} />);
    await user.click(screen.getByRole('button', { name: 'Next week' }));
    expect(onDateChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole('gridcell', { name: /December 31, 9998/ }));
    await user.keyboard('{ArrowRight}');
    expect(onDateChange).not.toHaveBeenCalled();
    await user.keyboard('{ArrowLeft}');
    expect(onDateChange).toHaveBeenLastCalledWith('9998-12-30');
  });
});
