import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { vi } from 'vitest';
import { resetLocalTimeZone, setLocalTimeZone } from '../src/primitives/index.js';

/** Two zones a day apart for much of the day, so a value read in the device's zone differs. */
export const distantZones = ['UTC', 'Pacific/Kiritimati'] as const;

const NativeDateTimeFormat = Intl.DateTimeFormat;

/**
 * Runs `read` with the process, `Intl.DateTimeFormat` and the date library in `timeZone`. Node fixes
 * Intl's default zone at start, so a formatter that names no zone is given this one.
 */
export function inTimeZone<T>(timeZone: string, read: () => T): T {
  const previous = process.env.TZ;
  process.env.TZ = timeZone;
  setLocalTimeZone(timeZone);
  const format = vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(function (
    locales?: Intl.LocalesArgument,
    options?: Intl.DateTimeFormatOptions,
  ) {
    return new NativeDateTimeFormat(locales, {
      ...options,
      timeZone: options?.timeZone ?? timeZone,
    });
  });
  try {
    return read();
  } finally {
    format.mockRestore();
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
    resetLocalTimeZone();
  }
}

/** The server markup of `element` rendered with the device in each of `distantZones`. */
export function renderInDistantZones(element: () => ReactElement): string[] {
  return distantZones.map((zone) => inTimeZone(zone, () => renderToString(element())));
}
