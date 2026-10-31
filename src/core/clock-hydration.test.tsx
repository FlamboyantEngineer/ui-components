import { act } from '@testing-library/react';
import type { ReactElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActivityFeed } from '../components/activity-feed/activity-feed.js';
import { CalendarView } from '../components/calendar-view/calendar-view.js';
import { RelativeDateField } from '../components/relative-date-field/relative-date-field.js';
import { Timeline } from '../components/timeline/timeline.js';
import { UiProvider } from './provider.js';

// The server renders just before midnight, the client hydrates just after it: any read of the clock
// during either render would differ between them.
const serverTime = new Date('2026-10-31T23:58:00Z');
const clientTime = new Date('2026-11-01T00:03:00Z');

/** Server-renders the element at `serverTime`, then hydrates it at `clientTime`. */
async function hydrateAcrossMidnight(element: ReactElement) {
  vi.useFakeTimers({ now: serverTime, toFake: ['Date'] });
  const host = document.body.appendChild(document.createElement('div'));
  const app = <UiProvider locale="en-US">{element}</UiProvider>;
  host.innerHTML = renderToString(app);
  const server = host.innerHTML;
  vi.setSystemTime(clientTime);
  const errors = vi.spyOn(console, 'error');
  const recoverable: unknown[] = [];
  let root: ReturnType<typeof hydrateRoot> | undefined;
  await act(async () => {
    root = hydrateRoot(host, app, { onRecoverableError: (error) => recoverable.push(error) });
  });
  expect(recoverable).toEqual([]);
  expect(errors).not.toHaveBeenCalled();
  return {
    server,
    host,
    unmount: () => {
      act(() => root?.unmount());
      host.remove();
    },
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Hydration-stable clock', () => {
  it('UIC-PROVIDER-8.2 hydrates a relative date field, then reads it against the clock', async () => {
    const field = <RelativeDateField label="Due" defaultValue="2026-11-01" timeZone="UTC" />;
    const { server, host, unmount } = await hydrateAcrossMidnight(field);
    expect(server).toContain('Nov 1, 2026');
    expect(server).not.toContain('data-relation');
    expect(host.querySelector('.ui-relative-date-field')).toHaveAttribute(
      'data-relation',
      'present',
    );
    expect(host).toHaveTextContent('Today');
    unmount();
  });

  it('UIC-PROVIDER-8.2 hydrates activity day headings as dates, then as words', async () => {
    const items = [{ id: 'a', action: 'Planted tomatoes', time: '2026-11-01T00:01:00Z' }];
    const { server, host, unmount } = await hydrateAcrossMidnight(<ActivityFeed items={items} />);
    expect(server).toContain('Sunday, November 1, 2026');
    expect(host.querySelector('.ui-activity-feed__day')).toHaveTextContent('Today');
    unmount();
  });

  it('UIC-PROVIDER-8.2 draws a calendar without a date once hydrated, with today marked', async () => {
    const calendar = <CalendarView events={[]} aria-label="Plan" timeZone="UTC" />;
    const { server, host, unmount } = await hydrateAcrossMidnight(calendar);
    expect(server).toContain('aria-busy="true"');
    expect(server).not.toContain('role="grid"');
    const today = host.querySelector('[data-today="true"]');
    expect(today).toHaveAttribute('aria-current', 'date');
    expect(host.querySelector('.ui-calendar-view__title')).toHaveTextContent('November 2026');
    unmount();
  });

  it('UIC-PROVIDER-8.2 adds the timeline today marker once hydrated', async () => {
    const timeline = (
      <Timeline
        aria-label="Plan"
        rows={[{ id: 'beds', label: 'Beds' }]}
        items={[{ id: 'dig', rowId: 'beds', label: 'Dig', start: '2026-10-26', end: '2026-11-06' }]}
        scale="day"
      />
    );
    const { server, host, unmount } = await hydrateAcrossMidnight(timeline);
    expect(server).not.toContain('ui-timeline__today');
    expect(host.querySelector('.ui-timeline__today')).not.toBeNull();
    unmount();
  });
});
