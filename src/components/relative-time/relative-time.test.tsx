import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { RelativeTime } from './relative-time.js';
import { getClockState } from './relative-time-clock.js';

const fixedNow = new Date(2026, 4, 23, 10, 30);
const getNow = () => fixedNow;
/** A local moment on the fixed day as a UTC ISO text. */
const at = (hours: number, minutes: number) => new Date(2026, 4, 23, hours, minutes).toISOString();

function root(container: HTMLElement): HTMLElement {
  return container.firstElementChild as HTMLElement;
}

async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

const tooltip = () => document.querySelector<HTMLElement>('[role="tooltip"]');

describe('RelativeTime', () => {
  afterEach(async () => {
    // Let React Aria's global warm-up and cool-down timers settle between tests.
    if (vi.isFakeTimers()) await advance(5000);
    vi.useRealTimers();
  });

  it('UIC-RELATIVE-TIME-1.1 renders a time element with the value, relation and format', () => {
    const value = at(10, 25);
    const { container, rerender } = render(<RelativeTime value={value} getNow={getNow} />);
    const time = root(container);
    expect(time.tagName).toBe('TIME');
    expect(time).toHaveClass('ui-relative-time');
    expect(time).toHaveAttribute('datetime', value);
    expect(time).toHaveAttribute('data-relation', 'past');
    expect(time).toHaveAttribute('data-format', 'relative');
    expect(time).toHaveTextContent('5 minutes ago');
    rerender(<RelativeTime value="2026-06-30" getNow={getNow} />);
    expect(root(container)).toHaveAttribute('data-relation', 'future');
    expect(root(container)).toHaveAttribute('data-format', 'absolute');
    expect(root(container)).toHaveTextContent('Jun 30, 2026');
    rerender(<RelativeTime value="2026-05-23" getNow={getNow} />);
    expect(root(container)).toHaveAttribute('data-relation', 'present');
    expectHooksMatchSpec(container, 'RELATIVE-TIME');
  });

  it('UIC-RELATIVE-TIME-1.2 words the value in the locale, capitalized unless asked not to', () => {
    const { container, rerender } = render(<RelativeTime value="2026-05-22" getNow={getNow} />);
    expect(root(container)).toHaveTextContent(/^Yesterday$/);
    rerender(<RelativeTime value="2026-05-22" getNow={getNow} capitalize={false} />);
    expect(root(container)).toHaveTextContent(/^yesterday$/);
    rerender(<RelativeTime value="2026-05-23T12:30" getNow={getNow} capitalize={false} />);
    expect(root(container)).toHaveTextContent(/^in 2 hours$/);
    rerender(<RelativeTime value="2026-05-19" getNow={getNow} fallbackAfterDays={3} />);
    expect(root(container)).toHaveTextContent('May 19, 2026');
    rerender(
      <UiProvider locale="fr-FR">
        <RelativeTime value="2026-05-22" getNow={getNow} />
      </UiProvider>,
    );
    expect(container.querySelector('time')).toHaveTextContent(/^Hier$/);
  });

  it('UIC-RELATIVE-TIME-1.3 UIC-RELATIVE-TIME-3.1 shows the absolute date in a tooltip on focus', async () => {
    vi.useFakeTimers();
    const { container } = render(
      <RelativeTime value="2026-05-21T09:00" getNow={getNow} dateStyle="long" timeStyle="short" />,
    );
    const time = root(container);
    expect(time).toHaveAttribute('tabindex', '0');
    act(() => {
      fireEvent.keyDown(document.body, { key: 'Tab' });
      time.focus();
    });
    expect(tooltip()?.textContent?.replace(/\s/g, ' ')).toBe('May 21, 2026 at 9:00 AM');
    expect(tooltip()).toHaveClass('ui-tooltip', 'ui-relative-time__tooltip');
    expect(time).toHaveAttribute('aria-describedby', tooltip()?.id);
    expectHooksMatchSpec(document.body, 'RELATIVE-TIME', { slots: ['tooltip'] });
    act(() => time.blur());
    await advance(1000);
    expect(tooltip()).toBeNull();
  });

  it('UIC-RELATIVE-TIME-3.1 opens the tooltip on hover', async () => {
    vi.useFakeTimers();
    const { container } = render(<RelativeTime value={at(9, 0)} getNow={getNow} />);
    const time = root(container);
    fireEvent.pointerMove(time, { pointerType: 'mouse' });
    fireEvent.pointerEnter(time, { pointerType: 'mouse' });
    fireEvent.mouseEnter(time);
    await advance(500);
    expect(tooltip()?.textContent?.replace(/\s/g, ' ')).toBe('May 23, 2026, 9:00 AM');
  });

  it('UIC-RELATIVE-TIME-3.1 adds no tooltip or tab stop when off or already absolute', () => {
    const { container, rerender } = render(
      <RelativeTime value="2026-05-22" getNow={getNow} showTooltip={false} />,
    );
    expect(root(container)).not.toHaveAttribute('tabindex');
    rerender(<RelativeTime value="2026-01-02" getNow={getNow} />);
    expect(root(container)).not.toHaveAttribute('tabindex');
    expect(root(container)).toHaveTextContent('Jan 2, 2026');
  });

  it('UIC-RELATIVE-TIME-3.2 adds no role or accessible name', () => {
    const warn = vi.spyOn(console, 'warn');
    const { container } = render(<RelativeTime value="2026-05-22" getNow={getNow} />);
    // A tab stop without an interactive role must not trip React Aria's focusable warning.
    expect(warn).not.toHaveBeenCalled();
    expect(root(container)).not.toHaveAttribute('role');
    expect(root(container)).not.toHaveAttribute('aria-label');
    expect(screen.getByText('Yesterday')).toBe(root(container));
  });

  it('UIC-RELATIVE-TIME-1.4 shows the placeholder for missing or unreadable values', () => {
    const { container, rerender } = render(<RelativeTime value={null} getNow={getNow} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<RelativeTime value="someday" getNow={getNow} placeholder="never" />);
    const element = root(container);
    expect(element.tagName).toBe('SPAN');
    expect(element).toHaveClass('ui-relative-time');
    expect(element).toHaveAttribute('data-empty', 'true');
    expect(element).toHaveTextContent(/^Never$/);
    expect(element).not.toHaveAttribute('tabindex');
    rerender(<RelativeTime value="" getNow={getNow} placeholder="never" capitalize={false} />);
    expect(root(container)).toHaveTextContent(/^never$/);
    expectHooksMatchSpec(container, 'RELATIVE-TIME');
  });

  it('UIC-RELATIVE-TIME-1.5 forwards the class, id and data attributes', () => {
    const { container } = render(
      <RelativeTime
        value="2026-05-22"
        getNow={getNow}
        className="extra"
        id="stamp"
        data-row="4"
        data-format="caller"
      />,
    );
    const time = root(container);
    expect(time).toHaveClass('ui-relative-time', 'extra');
    expect(time).toHaveAttribute('id', 'stamp');
    expect(time).toHaveAttribute('data-row', '4');
    expect(time).toHaveAttribute('data-format', 'relative');
    expectHooksMatchSpec(container, 'RELATIVE-TIME', { callerAttributes: ['data-row'] });
  });

  it('UIC-RELATIVE-TIME-2.2 updates on the shared clock and stops it on unmount', async () => {
    vi.useFakeTimers({ now: new Date(2026, 4, 23, 23, 59, 30) });
    const { container, unmount } = render(
      <>
        <RelativeTime value={new Date().toISOString()} showTooltip={false} />
        <RelativeTime value="2026-05-23" showTooltip={false} />
      </>,
    );
    const [instant, day] = Array.from(container.children);
    expect(instant).toHaveTextContent('Now');
    expect(day).toHaveTextContent('Today');
    expect(getClockState()).toEqual({ isRunning: true, subscribers: 2 });
    await advance(30_000);
    expect(instant).toHaveTextContent('30 seconds ago');
    expect(day).toHaveTextContent('Yesterday');
    await advance(30_000);
    expect(instant).toHaveTextContent('1 minute ago');
    unmount();
    expect(getClockState()).toEqual({ isRunning: false, subscribers: 0 });
  });
});
