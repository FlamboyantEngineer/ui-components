import { fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { requireDefined } from '../../utils/require-defined.js';
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

function segment(name: RegExp) {
  return screen.getByRole('spinbutton', { name });
}

describe('DateTimeField time stepping', () => {
  it('UIC-DATE-TIME-FIELD-4.6 steps a time segment with the wheel, without a popover', () => {
    const onCommit = vi.fn();
    renderInLocale(
      <DateTimeField
        label="Start"
        mode="time"
        hourCycle={24}
        defaultValue="09:30"
        onCommit={onCommit}
      />,
    );
    expect(screen.queryByRole('button', { name: /time/i })).not.toBeInTheDocument();
    expect(roll(segment(/minute/i), -100)).toBe(false);
    expect(onCommit).toHaveBeenLastCalledWith('09:31');
    expect(segment(/minute/i)).toHaveFocus();
    roll(segment(/hour/i), 100);
    expect(onCommit).toHaveBeenLastCalledWith('08:31');
    // A mostly sideways or zoom wheel is left to the browser.
    expect(roll(segment(/hour/i), 0)).toBe(true);
    expect(fireEvent.wheel(segment(/hour/i), { deltaY: -100, ctrlKey: true })).toBe(true);
    expect(onCommit).toHaveBeenCalledTimes(2);
  });

  it('UIC-DATE-TIME-FIELD-4.6 steps the time segment focused last with the later and earlier buttons', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    renderInLocale(
      <DateTimeField
        label="Start"
        mode="time"
        hourCycle={12}
        granularity="second"
        defaultValue="09:45:10"
        onCommit={onCommit}
      />,
    );
    const later = screen.getByRole('button', { name: 'Later' });
    const earlier = screen.getByRole('button', { name: 'Earlier' });
    expect(later).toHaveAttribute('tabindex', '-1');
    await user.click(later);
    expect(onCommit).toHaveBeenLastCalledWith('10:45:10');
    await user.click(segment(/second/i));
    await user.click(earlier);
    expect(onCommit).toHaveBeenLastCalledWith('10:45:09');
    expect(segment(/second/i)).toHaveFocus();
    await user.click(segment(/AM\/PM/i));
    await user.click(later);
    expect(onCommit).toHaveBeenLastCalledWith('22:45:09');
  });

  it('UIC-DATE-TIME-FIELD-4.6 steps the time of a date and time with the wheel, not its date', () => {
    const onCommit = vi.fn();
    renderInLocale(
      <DateTimeField
        label="Call"
        mode="date-time"
        hourCycle={24}
        defaultValue="2026-04-13T12:00"
        onCommit={onCommit}
      />,
    );
    roll(segment(/hour/i), -100);
    expect(onCommit).toHaveBeenLastCalledWith('2026-04-13T13:00');
    expect(roll(segment(/day/i), -100)).toBe(true);
    expect(onCommit).toHaveBeenCalledOnce();
  });

  it('UIC-DATE-TIME-FIELD-4.6 steps nothing while read-only or disabled', () => {
    const onCommit = vi.fn();
    renderInLocale(
      <>
        <DateTimeField
          label="Locked"
          mode="time"
          isReadOnly
          defaultValue="09:00"
          onCommit={onCommit}
        />
        <DateTimeField label="Off" mode="time" isDisabled defaultValue="09:00" />
      </>,
    );
    for (const button of [
      ...screen.getAllByRole('button', { name: 'Later' }),
      ...screen.getAllByRole('button', { name: 'Earlier' }),
    ]) {
      expect(button).toBeDisabled();
    }
    const [hour] = screen.getAllByRole('spinbutton', { name: /hour/i });
    expect(roll(requireDefined(hour), -100)).toBe(true);
    expect(onCommit).not.toHaveBeenCalled();
  });
});

describe('DateTimeField time columns', () => {
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
