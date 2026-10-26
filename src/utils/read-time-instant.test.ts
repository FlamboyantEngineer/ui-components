import { describe, expect, it } from 'vitest';
import { readTimeInstant } from './read-time-instant.js';

describe('readTimeInstant', () => {
  it('UIC-CHART-6.1 UIC-SCALES-2.4 reads local dates and wall times through daylight saving', () => {
    const zone = 'America/New_York';
    const start = readTimeInstant('2026-03-08', zone);
    const end = readTimeInstant('2026-03-09', zone);
    expect(start).toBe(Date.parse('2026-03-08T05:00:00Z'));
    expect(end - start).toBe(23 * 60 * 60 * 1000);
    expect(readTimeInstant('2026-03-08T12:30:00', zone)).toBe(Date.parse('2026-03-08T16:30:00Z'));
  });

  it('UIC-CHART-6.1 UIC-SCALES-2.4 preserves explicit offsets and milliseconds and rejects invalid dates', () => {
    expect(readTimeInstant('2026-03-08T12:30:00.123+09:00', 'America/New_York')).toBe(
      Date.parse('2026-03-08T03:30:00.123Z'),
    );
    expect(readTimeInstant('2026-02-30', 'UTC')).toBeNaN();
    expect(readTimeInstant('not a date', 'UTC')).toBeNaN();
  });
});
