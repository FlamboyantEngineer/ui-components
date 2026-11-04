import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { RelativeTime } from './relative-time.js';

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
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container } = render(
      <RelativeTime value="2026-05-21T09:00" getNow={getNow} dateStyle="long" timeStyle="short" />,
    );
    const time = root(container);
    expect(time).toHaveAttribute('tabindex', '0');
    await user.tab();
    expect(time).toHaveFocus();
    expect(tooltip()?.textContent?.replace(/\s/g, ' ')).toBe('May 21, 2026 at 9:00 AM');
    expect(tooltip()).toHaveClass('ui-tooltip', 'ui-relative-time__tooltip');
    expect(time).toHaveAttribute('aria-describedby', tooltip()?.id);
    expectHooksMatchSpec(document.body, 'RELATIVE-TIME', { slots: ['tooltip'] });
    act(() => time.blur());
    await advance(1000);
    expect(tooltip()).toBeNull();
  });

  it('UIC-RELATIVE-TIME-3.1 opens the tooltip on hover', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container } = render(<RelativeTime value={at(9, 0)} getNow={getNow} />);
    const time = root(container);
    // Move onto the page first, so React Aria reads a pointer modality when the time is entered.
    await user.pointer({ target: document.body });
    await user.hover(time);
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
    expect(vi.getTimerCount()).toBe(1);
    await advance(30_000);
    expect(instant).toHaveTextContent('Now');
    expect(day).toHaveTextContent('Yesterday');
    await advance(30_000);
    expect(instant).toHaveTextContent('1 minute ago');
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    { precision: 'minute', value: '2026-10-31T12:01:00Z', text: 'In 1 minute' },
    { precision: 'second', value: '2026-10-31T12:00:05Z', text: 'In 5 seconds' },
  ] as const)(
    'UIC-RELATIVE-TIME-2.2 wakes a frozen clock at most once at a $precision boundary',
    async ({ precision, value, text }) => {
      vi.useFakeTimers({ now: new Date('2026-10-31T11:00:00Z') });
      const frozen = vi.fn(() => new Date('2026-10-31T12:00:00Z'));
      const { container } = render(
        <RelativeTime value={value} getNow={frozen} precision={precision} showTooltip={false} />,
      );
      expect(root(container)).toHaveTextContent(text);
      for (let step = 0; step < 100; step += 1) await advance(10);
      expect(frozen.mock.calls.length).toBeLessThanOrEqual(3);
      expect(vi.getTimerCount()).toBe(0);
      expect(root(container)).toHaveTextContent(text);
    },
  );

  it('UIC-RELATIVE-TIME-2.2 wakes again once a frozen clock moves on', async () => {
    vi.useFakeTimers({ now: new Date('2026-10-31T11:00:00Z') });
    const value = '2026-10-31T12:01:00Z';
    const props = { value, showTooltip: false };
    const { container, rerender } = render(
      <RelativeTime {...props} getNow={() => new Date('2026-10-31T12:00:00Z')} />,
    );
    await advance(10);
    expect(vi.getTimerCount()).toBe(0);
    expect(root(container)).toHaveTextContent('In 1 minute');
    // The host hands over a clock that runs: the timestamp follows it on the shared timer.
    const start = Date.now();
    const running = () => new Date(Date.parse('2026-10-31T11:59:00Z') + Date.now() - start);
    rerender(<RelativeTime {...props} getNow={running} />);
    expect(root(container)).toHaveTextContent('In 2 minutes');
    expect(vi.getTimerCount()).toBe(1);
    await advance(60_000);
    expect(root(container)).toHaveTextContent('In 1 minute');
  });

  it.each([
    {
      name: 'minute wording',
      props: { value: '2026-10-31T12:00:00Z' },
      server: '2026-10-31T12:00:59Z',
      client: '2026-10-31T12:01:01Z',
      stable: 'Oct 31, 2026, 12:00:00 PM UTC',
      live: { words: '1 minute ago', relation: 'past', format: 'relative' },
    },
    {
      name: 'second wording',
      props: { value: '2026-10-31T12:00:00Z', precision: 'second' as const },
      server: '2026-10-31T12:00:00Z',
      client: '2026-10-31T12:00:03Z',
      stable: 'Oct 31, 2026, 12:00:00 PM UTC',
      live: { words: '3 seconds ago', relation: 'past', format: 'relative' },
    },
    {
      name: 'a relative-to-absolute switch',
      props: { value: '2026-10-24', fallbackAfterDays: 7 },
      server: '2026-10-30T23:59:59',
      client: '2026-10-31T00:00:01',
      stable: 'Oct 24, 2026',
      live: { words: 'Oct 24, 2026', relation: 'past', format: 'absolute' },
    },
  ])(
    'UIC-RELATIVE-TIME-2.3 hydrates the server text across $name, then reads the live clock',
    async ({ props, server, client, stable, live }) => {
      vi.useFakeTimers({ now: new Date(server) });
      const element = <RelativeTime {...props} showTooltip={false} />;
      const host = document.body.appendChild(document.createElement('div'));
      host.innerHTML = renderToString(element);
      const time = host.querySelector('time');
      expect(time).toHaveTextContent(stable);
      expect(time).toHaveAttribute('data-format', 'absolute');
      expect(time).not.toHaveAttribute('data-relation');
      vi.setSystemTime(new Date(client));
      const errors = vi.spyOn(console, 'error');
      const recoverable: unknown[] = [];
      let app: ReturnType<typeof hydrateRoot> | undefined;
      await act(async () => {
        app = hydrateRoot(host, element, {
          onRecoverableError: (error) => recoverable.push(error),
        });
      });
      expect(recoverable).toEqual([]);
      expect(errors).not.toHaveBeenCalled();
      const { words, relation, format } = live;
      expect(host.querySelector('time')).toHaveTextContent(words);
      expect(host.querySelector('time')).toHaveAttribute('data-relation', relation);
      expect(host.querySelector('time')).toHaveAttribute('data-format', format);
      act(() => app?.unmount());
      host.remove();
    },
  );

  it('UIC-RELATIVE-TIME-2.3 hydrates with an injected clock, then reads it and adds the tooltip', async () => {
    vi.useFakeTimers({ now: new Date('2026-10-31T12:00:00Z') });
    const getFixedNow = () => new Date('2026-10-31T12:05:00Z');
    const element = <RelativeTime value="2026-10-31T12:00:00Z" getNow={getFixedNow} />;
    const host = document.body.appendChild(document.createElement('div'));
    host.innerHTML = renderToString(element);
    expect(host.querySelector('time')).not.toHaveAttribute('tabindex');
    const recoverable: unknown[] = [];
    let app: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      app = hydrateRoot(host, element, { onRecoverableError: (error) => recoverable.push(error) });
    });
    expect(recoverable).toEqual([]);
    const time = host.querySelector('time');
    expect(time).toHaveTextContent('5 minutes ago');
    expect(time).toHaveAttribute('tabindex', '0');
    act(() => app?.unmount());
    host.remove();
  });

  it('UIC-RELATIVE-TIME-2.3 renders live text at once without hydration', () => {
    vi.useFakeTimers({ now: new Date('2026-10-31T12:01:01Z') });
    render(<RelativeTime value="2026-10-31T12:00:00Z" showTooltip={false} />);
    expect(screen.getByText('1 minute ago')).toHaveAttribute('data-relation', 'past');
  });

  it('UIC-RELATIVE-TIME-1.2 spells units in the unit style', () => {
    render(<RelativeTime value={at(10, 25)} getNow={getNow} unitStyle="narrow" />);
    expect(screen.getByText('5m ago')).toHaveAttribute('datetime', at(10, 25));
  });

  it('UIC-RELATIVE-TIME-1.2 counts live seconds with second precision', async () => {
    vi.useFakeTimers({ now: new Date(2026, 4, 23, 10, 30) });
    const value = new Date().toISOString();
    const { container } = render(
      <>
        <RelativeTime value={value} precision="second" showTooltip={false} />
        <RelativeTime value={value} showTooltip={false} />
      </>,
    );
    const [live, minute] = Array.from(container.children);
    expect(live).toHaveTextContent('Now');
    await advance(5000);
    expect(live).toHaveTextContent('5 seconds ago');
    expect(minute).toHaveTextContent('Now');
    await advance(55_000);
    expect(live).toHaveTextContent('1 minute ago');
    expect(minute).toHaveTextContent('1 minute ago');
  });
});
