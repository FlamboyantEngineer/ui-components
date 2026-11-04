'use client';

// Now, today and the time zone, read so a server render and its hydration agree: neither reads the
// device's clock or zone, and the first client render after hydration does.

import { fromDate, getLocalTimeZone, toCalendarDate } from '../primitives/index.js';
import { useIsClient } from '../utils/use-is-client.js';
import { useUiClock } from './provider.js';

/**
 * Whether the device's clock and zone may be read: false on the server and while hydrating, so both
 * render the same output wherever and whenever they run, then true. A render on the client alone is
 * true from the start.
 */
export function useIsClockReadable(): boolean {
  return useIsClient();
}

/** The clock to read at an event: the given one, else the provider's. */
export function useGetNow(getNow?: (() => Date) | undefined): () => Date {
  const clock = useUiClock();
  return getNow ?? clock.getNow;
}

/** Now from the given clock or the provider's, or null on the server and while hydrating. */
export function useNow(getNow?: (() => Date) | undefined): Date | null {
  const read = useGetNow(getNow);
  return useIsClockReadable() ? read() : null;
}

/**
 * The time zone to read days in: the given one, else the provider's, else the device's once it may
 * be read and UTC before.
 */
export function useTimeZone(timeZone?: string | undefined): string {
  const clock = useUiClock();
  const isReadable = useIsClockReadable();
  const provided = timeZone ?? clock.timeZone;
  return provided ?? (isReadable ? getLocalTimeZone() : 'UTC');
}

/**
 * Today as `YYYY-MM-DD` in the time zone (`useTimeZone`) by the clock (`useGetNow`), or null on the
 * server and while hydrating.
 */
export function useToday(timeZone?: string | undefined, getNow?: (() => Date) | undefined) {
  const zone = useTimeZone(timeZone);
  const now = useNow(getNow);
  return now ? toCalendarDate(fromDate(now, zone)).toString() : null;
}
