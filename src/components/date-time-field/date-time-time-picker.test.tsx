import { fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { DateTimeField } from './date-time-field.js';

function renderInLocale(element: ReactElement) {
  return render(<UiProvider locale="en-US">{element}</UiProvider>);
}

function column(name: string, group?: HTMLElement) {
  return (group ? within(group) : screen).getByRole('listbox', { name });
}

function option(list: HTMLElement, name: string) {
  return within(list).getByRole('option', { name });
}

function roll(element: HTMLElement, deltaY: number) {
  return fireEvent.wheel(element, { deltaY, deltaMode: 0 });
}

describe('DateTimeField time columns', () => {
  it('UIC-DATE-TIME-FIELD-4.6 picks a time with the pointer and the wheel, and keeps the popover open', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    renderInLocale(<DateTimeField label="Start" mode="time" hourCycle={24} onCommit={onCommit} />);
    await user.click(screen.getByRole('button', { name: 'Choose time' }));
    const group = screen.getByRole('group', { name: 'Time' });
    expect(
      within(group)
        .getAllByRole('listbox')
        .map((list) => list.getAttribute('aria-label')),
    ).toEqual(['Hours', 'Minutes']);
    await user.click(option(column('Hours'), '09'));
    expect(onCommit).toHaveBeenLastCalledWith('09:00');
    await user.click(option(column('Minutes'), '30'));
    expect(onCommit).toHaveBeenLastCalledWith('09:30');
    expect(option(column('Minutes'), '30')).toHaveAttribute('aria-selected', 'true');
    expect(roll(column('Minutes'), 100)).toBe(false);
    expect(onCommit).toHaveBeenLastCalledWith('09:31');
    roll(column('Hours'), -100);
    expect(onCommit).toHaveBeenLastCalledWith('08:31');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('UIC-DATE-TIME-FIELD-4.6 honours the bounds, the 12 hour cycle and seconds', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    renderInLocale(
      <DateTimeField
        label="Start"
        mode="time"
        hourCycle={12}
        granularity="second"
        minValue="09:30"
        maxValue="21:00"
        defaultValue="09:45:10"
        onCommit={onCommit}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Choose time' }));
    const hours = column('Hours');
    expect(option(hours, '8')).toHaveAttribute('aria-disabled', 'true');
    expect(option(hours, '9')).toHaveAttribute('aria-selected', 'true');
    expect(option(column('Minutes'), '29')).toHaveAttribute('aria-disabled', 'true');
    expect(column('Seconds')).toBeInTheDocument();
    await user.click(option(column('AM/PM'), 'PM'));
    expect(onCommit).toHaveBeenLastCalledWith('21:00:00');
    expect(option(column('Hours'), '10')).toHaveAttribute('aria-disabled', 'true');
  });

  it('UIC-DATE-TIME-FIELD-4.6 offers no time picker while read-only or disabled', () => {
    renderInLocale(
      <>
        <DateTimeField label="Locked" mode="time" isReadOnly defaultValue="09:00" />
        <DateTimeField label="Off" mode="time" isDisabled defaultValue="09:00" />
      </>,
    );
    for (const button of screen.getAllByRole('button', { name: 'Choose time' })) {
      expect(button).toBeDisabled();
    }
  });

  it('UIC-DATE-TIME-FIELD-4.6 sets the time of a date and time, zoned, under the calendar', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    renderInLocale(
      <DateTimeField
        label="Call"
        mode="date-time"
        timeZone="Asia/Tokyo"
        hourCycle={24}
        defaultValue="2026-04-13T12:00:00+09:00[Asia/Tokyo]"
        onCommit={onCommit}
      />,
    );
    await user.click(screen.getAllByRole('button')[0] as HTMLElement);
    const dialog = screen.getByRole('dialog');
    const group = within(dialog).getByRole('group', { name: 'Time' });
    await user.click(option(column('Hours', group), '15'));
    expect(onCommit).toHaveBeenLastCalledWith('2026-04-13T15:00:00+09:00[Asia/Tokyo]');
    await user.click(within(dialog).getByRole('button', { name: /April 20, 2026/ }));
    expect(onCommit).toHaveBeenLastCalledWith('2026-04-20T15:00:00+09:00[Asia/Tokyo]');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('UIC-DATE-TIME-FIELD-4.6 sets the start and end times of a range within the bounds', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    renderInLocale(
      <DateTimeField
        label="Stay"
        mode="date-time-range"
        hourCycle={24}
        minValue="2026-04-13T09:00"
        defaultValue={{ start: '2026-04-13T10:00', end: '2026-04-14T11:00' }}
        onCommit={onCommit}
      />,
    );
    await user.click(screen.getAllByRole('button')[0] as HTMLElement);
    const start = screen.getByRole('group', { name: 'Start time' });
    const end = screen.getByRole('group', { name: 'End time' });
    expect(option(column('Hours', start), '08')).toHaveAttribute('aria-disabled', 'true');
    expect(option(column('Hours', end), '08')).not.toHaveAttribute('aria-disabled');
    await user.click(option(column('Hours', end), '18'));
    expect(onCommit).toHaveBeenLastCalledWith({
      start: '2026-04-13T10:00',
      end: '2026-04-14T18:00',
    });
    await user.click(option(column('Minutes', start), '15'));
    expect(onCommit).toHaveBeenLastCalledWith({
      start: '2026-04-13T10:15',
      end: '2026-04-14T18:00',
    });
  });
});
