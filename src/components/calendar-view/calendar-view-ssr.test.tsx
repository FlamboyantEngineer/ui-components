import { act } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { CalendarView, type CalendarViewProps } from './calendar-view.js';

const events: CalendarViewProps['events'] = [
  { id: 'alpha', title: 'Alpha', start: '2026-03-02T09:00:00Z', end: '2026-03-02T10:00:00Z' },
  { id: 'trip', title: 'Trip', start: '2026-03-03', end: '2026-03-05' },
  // The repeated hour of the fall-back night in New York names each end's zone.
  { id: 'late', title: 'Late', start: '2026-11-01T05:30:00Z', end: '2026-11-01T06:15:00Z' },
];

let restore = () => {};

/** Writes formatted dates as a browser that sets plain spaces where the server set thin ones. */
function spaceLikeAnotherRuntime() {
  const plain = (text: string) => text.replace(/[\u2009\u202f]/g, ' ');
  const proto = Intl.DateTimeFormat.prototype;
  const { formatRange } = proto;
  // `format` is a getter that hands out a function bound to the formatter.
  const formatGetter = Object.getOwnPropertyDescriptor(proto, 'format');
  Object.defineProperty(proto, 'format', {
    configurable: true,
    get(this: Intl.DateTimeFormat) {
      const bound = formatGetter?.get?.call(this) as Intl.DateTimeFormat['format'];
      return (date?: Date | number) => plain(bound(date));
    },
  });
  restore = () => {
    if (formatGetter) Object.defineProperty(proto, 'format', formatGetter);
  };
  vi.spyOn(Intl.DateTimeFormat.prototype, 'formatRange').mockImplementation(function (
    this: Intl.DateTimeFormat,
    start,
    end,
  ) {
    return plain(formatRange.call(this, start, end));
  });
}

afterEach(() => {
  restore();
  vi.restoreAllMocks();
});

describe('CalendarView server rendering', () => {
  it.each([
    ['en-US', 'month', '2026-03-02'],
    ['en-US', 'week', '2026-03-02'],
    ['fr-FR', 'month', '2026-03-02'],
    ['en-US', 'week', '2026-11-01'],
  ] as const)(
    'UIC-CALENDAR-VIEW-1.5 hydrates %s %s view text written by another runtime',
    async (locale, view, defaultDate) => {
      const element = (
        <UiProvider locale={locale}>
          <CalendarView
            events={events}
            timeZone="America/New_York"
            view={view}
            defaultDate={defaultDate}
            getNow={() => new Date('2026-03-02T12:00:00Z')}
          />
        </UiProvider>
      );
      const host = document.body.appendChild(document.createElement('div'));
      host.innerHTML = renderToString(element);
      expect(host).not.toHaveTextContent(/[\u2009\u202f]/, { normalizeWhitespace: false });
      spaceLikeAnotherRuntime();
      const onRecoverableError = vi.fn();
      let app: ReturnType<typeof hydrateRoot> | undefined;
      await act(async () => {
        app = hydrateRoot(host, element, { onRecoverableError });
      });
      expect(onRecoverableError).not.toHaveBeenCalled();
      act(() => app?.unmount());
      host.remove();
    },
  );
});
