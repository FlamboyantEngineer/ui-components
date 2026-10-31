import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { requireDefined } from '../../utils/require-defined.js';
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
    expect(screen.queryByRole('spinbutton', { name: /AM\/PM/ })).not.toBeInTheDocument();
    act(() => segment(/^second/).focus());
    await user.keyboard('{ArrowUp}');
    expect(onCommit).toHaveBeenLastCalledWith('13:45:11');
    unmount();
    renderInLocale(
      <DateTimeField label="At" mode="date-time" granularity="hour" defaultValue={null} />,
    );
    expect(screen.queryByRole('spinbutton', { name: /^minute/ })).not.toBeInTheDocument();
    expect(segment(/^hour/)).toBeInTheDocument();
  });

  it('UIC-DATE-TIME-FIELD-4.2 edits a zoned value in the given time zone', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { container, rerender } = renderInLocale(
      <DateTimeField
        label="Call"
        mode="date-time"
        timeZone="Asia/Tokyo"
        defaultValue="2026-04-13T12:00:00+09:00[Asia/Tokyo]"
        onCommit={onCommit}
      />,
    );
    expect(segment(/^hour/)).toHaveTextContent('12');
    expect(segment(/^AM\/PM/)).toHaveTextContent('PM');
    const zone = container.querySelector('[data-type="timeZoneName"]');
    expect(zone).toHaveTextContent('GMT+9');
    act(() => segment(/^hour/).focus());
    await user.keyboard('{ArrowUp}');
    expect(onCommit).toHaveBeenLastCalledWith('2026-04-13T13:00:00+09:00[Asia/Tokyo]');
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

  it('UIC-DATE-TIME-FIELD-4.3 edits a range of zoned dates and times', async () => {
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
      start: '2026-04-13T09:00:00+00:00[UTC]',
      end: '2026-04-13T18:00:00+00:00[UTC]',
    });
    await user.click(screen.getByRole('button', { name: /Calendar/ }));
    expect(screen.getAllByRole('grid')).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Now' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  describe('in the repeated hour at the end of daylight saving time', () => {
    afterEach(() => vi.useRealTimers());
    const zone = 'America/New_York';
    const secondOccurrence = '2026-11-01T01:30:45.123-05:00[America/New_York]';

    it('UIC-DATE-TIME-FIELD-4.2 keeps the second occurrence through a segment edit', async () => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      renderInLocale(
        <DateTimeField
          label="When"
          mode="date-time"
          timeZone={zone}
          defaultValue={secondOccurrence}
          onCommit={onCommit}
        />,
      );
      act(() => segment(/^minute/).focus());
      await user.keyboard('{ArrowUp}');
      expect(onCommit).toHaveBeenLastCalledWith('2026-11-01T01:31:00-05:00[America/New_York]');
    });

    it('UIC-DATE-TIME-FIELD-4.2 keeps the second occurrence for Now and range ends', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-11-01T06:30:45.123Z'));
      const user = userEvent.setup();
      const onCommit = vi.fn();
      const { unmount } = renderInLocale(
        <DateTimeField
          label="When"
          mode="date-time"
          timeZone={zone}
          granularity="hour"
          onCommit={onCommit}
        />,
      );
      await user.click(screen.getByRole('button', { name: /Calendar/ }));
      await user.click(await screen.findByRole('button', { name: 'Now' }));
      expect(onCommit).toHaveBeenLastCalledWith('2026-11-01T01:00:00-05:00[America/New_York]');
      unmount();
      const onRange = vi.fn();
      renderInLocale(
        <DateTimeField
          label="Window"
          mode="date-time-range"
          timeZone={zone}
          defaultValue={{
            start: secondOccurrence,
            end: '2026-11-01T03:00:00-05:00[America/New_York]',
          }}
          onCommit={onRange}
        />,
      );
      act(() => segment(/^minute/).focus());
      await user.keyboard('{ArrowUp}');
      expect(onRange).toHaveBeenLastCalledWith({
        start: '2026-11-01T01:31:00-05:00[America/New_York]',
        end: '2026-11-01T03:00:00-05:00[America/New_York]',
      });
    });
  });

  it('UIC-DATE-TIME-FIELD-2.2 reads Today and Now from the provider clock and zone', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const getNow = () => new Date('2026-04-20T15:30:45Z');
    const { unmount } = render(
      <UiProvider locale="en-US" getNow={getNow} timeZone="Pacific/Kiritimati">
        <DateTimeField label="Due" onCommit={onCommit} />
        <DateTimeField label="When" mode="date-time" onCommit={onCommit} />
        <DateTimeField label="Call" mode="date-time" timeZone="Asia/Tokyo" onCommit={onCommit} />
      </UiProvider>,
    );
    const [due, when, call] = screen.getAllByRole('button', { name: /Calendar/ });
    await user.click(requireDefined(due));
    await user.click(await screen.findByRole('button', { name: 'Today' }));
    expect(onCommit).toHaveBeenLastCalledWith('2026-04-21');
    await user.click(requireDefined(when));
    await user.click(await screen.findByRole('button', { name: 'Now' }));
    expect(onCommit).toHaveBeenLastCalledWith('2026-04-21T05:30');
    await user.click(requireDefined(call));
    await user.click(await screen.findByRole('button', { name: 'Now' }));
    expect(onCommit).toHaveBeenLastCalledWith('2026-04-21T00:30:00+09:00[Asia/Tokyo]');
    unmount();
  });
});
