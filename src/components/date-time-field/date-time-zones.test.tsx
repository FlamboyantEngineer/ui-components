import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { DateTimeField } from './date-time-field.js';

function renderInLocale(element: ReactElement) {
  return render(<UiProvider locale="en-US">{element}</UiProvider>);
}

function segment(name: RegExp, index = 0) {
  return screen.getAllByRole('spinbutton', { name })[index] as HTMLElement;
}

describe('DateTimeField time settings, zones and ranges', () => {
  it('UIC-DATE-TIME-FIELD-4.1 edits seconds and forces the hour cycle', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { unmount } = renderInLocale(
      <DateTimeField
        label="At"
        mode="time"
        granularity="second"
        hourCycle={24}
        defaultValue="13:45:10"
        onCommit={onCommit}
      />,
    );
    expect(segment(/^hour/)).toHaveTextContent('13');
    expect(screen.queryByRole('spinbutton', { name: /AM\/PM/ })).toBeNull();
    act(() => segment(/^second/).focus());
    await user.keyboard('{ArrowUp}');
    expect(onCommit).toHaveBeenLastCalledWith('13:45:11');
    unmount();
    renderInLocale(
      <DateTimeField label="At" mode="date-time" granularity="hour" defaultValue={null} />,
    );
    expect(screen.queryByRole('spinbutton', { name: /^minute/ })).toBeNull();
    expect(segment(/^hour/)).toBeInTheDocument();
  });

  it('UIC-DATE-TIME-FIELD-4.2 edits an instant in the given time zone', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { container, rerender } = renderInLocale(
      <DateTimeField
        label="Call"
        mode="date-time"
        timeZone="Asia/Tokyo"
        defaultValue="2026-04-13T03:00:00.000Z"
        onCommit={onCommit}
      />,
    );
    expect(segment(/^hour/)).toHaveTextContent('12');
    expect(segment(/^AM\/PM/)).toHaveTextContent('PM');
    const zone = container.querySelector('[data-type="timeZoneName"]');
    expect(zone).toHaveTextContent('GMT+9');
    act(() => segment(/^hour/).focus());
    await user.keyboard('{ArrowUp}');
    expect(onCommit).toHaveBeenLastCalledWith('2026-04-13T04:00:00.000Z');
    rerender(
      <UiProvider locale="en-US">
        <DateTimeField
          label="Call"
          mode="date-time"
          timeZone="Asia/Tokyo"
          hideTimeZone
          defaultValue="2026-04-13T03:00:00.000Z"
        />
      </UiProvider>,
    );
    expect(container.querySelector('[data-type="timeZoneName"]')).toBeNull();
  });

  it('UIC-DATE-TIME-FIELD-4.2 shows the previous value and bounds in the zone', () => {
    const { container } = renderInLocale(
      <DateTimeField
        label="Call"
        mode="date-time"
        timeZone="Asia/Tokyo"
        value="2026-04-13T03:00:00.000Z"
        committedValue="2026-04-12T15:00:00.000Z"
        maxValue="2026-04-13T01:00:00.000Z"
      />,
    );
    const plain = (text: string | null | undefined) => (text ?? '').replace(/\s/g, ' ');
    expect(plain(container.querySelector('.ui-date-time-field__previous')?.textContent)).toBe(
      'Apr 13, 2026, 12:00 AM',
    );
    expect(plain(container.querySelector('.ui-field__message')?.textContent)).toBe(
      'Choose a value on or before Apr 13, 2026, 10:00 AM.',
    );
  });

  it('UIC-DATE-TIME-FIELD-4.3 edits a range of dates and times as instants', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { container } = renderInLocale(
      <DateTimeField
        label="Slot"
        mode="date-time-range"
        timeZone="UTC"
        hideTimeZone
        defaultValue={{ start: '2026-04-13T09:00:00.000Z', end: '2026-04-13T17:00:00.000Z' }}
        onCommit={onCommit}
      />,
    );
    expect(container.querySelector('.ui-date-time-field')).toHaveAttribute(
      'data-mode',
      'date-time-range',
    );
    expect(container.querySelectorAll('.ui-date-time-field__input')).toHaveLength(2);
    expect(segment(/^hour/, 1)).toHaveTextContent('5');
    act(() => segment(/^hour/, 1).focus());
    await user.keyboard('{ArrowUp}');
    expect(onCommit).toHaveBeenLastCalledWith({
      start: '2026-04-13T09:00:00.000Z',
      end: '2026-04-13T18:00:00.000Z',
    });
    await user.click(screen.getByRole('button', { name: /Calendar/ }));
    expect(screen.getAllByRole('grid')).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Now' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });
});
