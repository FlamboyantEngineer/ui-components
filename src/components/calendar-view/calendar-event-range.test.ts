import { expect, it } from 'vitest';
import { toEventText } from './calendar-event-range.js';

it('UIC-CALENDAR-VIEW-6.2 preserves the start text format when writing shifted event times', () => {
  const text = '2026-03-18T14:00:00-04:00[America/New_York]';
  expect(toEventText(text, '2026-03-18T12:00', 'America/New_York')).toBe('2026-03-18T14:00');
  expect(toEventText(text, '2026-03-18T12:00Z', 'America/New_York')).toBe(
    '2026-03-18T14:00:00-04:00',
  );
  expect(toEventText(text, text, 'America/New_York')).toBe(text);
});
