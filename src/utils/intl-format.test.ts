import { describe, expect, it } from 'vitest';
import {
  getCollator,
  getDateFormatter,
  getDateTimeFormat,
  getListFormat,
  getNumberFormat,
  getRelativeTimeFormat,
  normalizeIntlSpaces,
} from './intl-format.js';

describe('intl formatters', () => {
  it('UIC-INTL-FORMAT-1.1 shares one formatter per locale and equal options', () => {
    expect(getNumberFormat('en-US', { style: 'percent' })).toBe(
      getNumberFormat('en-US', { style: 'percent' }),
    );
    expect(getNumberFormat('en-US')).not.toBe(getNumberFormat('de-DE'));
    expect(getNumberFormat('de-DE').format(1.5)).toBe('1,5');
    expect(getDateFormatter('en-US', { dateStyle: 'medium' })).toBe(
      getDateFormatter('en-US', { dateStyle: 'medium' }),
    );
    expect(getDateTimeFormat('en-US', { timeZone: 'UTC' }).format(0)).toBe('1/1/1970');
    expect(getListFormat('en-US', { type: 'disjunction' }).format(['a', 'b'])).toBe('a or b');
    expect(getRelativeTimeFormat('fr-FR', { numeric: 'auto' })).not.toBe(
      getRelativeTimeFormat('fr-FR', { numeric: 'auto', style: 'short' }),
    );
    expect(getRelativeTimeFormat('fr-FR', { numeric: 'auto' }).format(-1, 'day')).toBe('hier');
    expect(getCollator('sv-SE', { numeric: true })).toBe(getCollator('sv-SE', { numeric: true }));
    expect(getCollator('sv-SE').compare('z', 'ä')).toBeLessThan(0);
  });

  it('UIC-INTL-FORMAT-1.2 evicts old configurations while keeping recently used formatters', () => {
    const first = getNumberFormat('en-US-x-evict');
    const recent = getNumberFormat('en-US-x-keep');
    for (let index = 0; index < 129; index += 1) {
      getNumberFormat(`en-US-x-cache-${index}`);
      expect(getNumberFormat('en-US-x-keep')).toBe(recent);
    }
    const replacement = getNumberFormat('en-US-x-evict');
    expect(replacement).not.toBe(first);
    expect(replacement.format(1234.5)).toBe(first.format(1234.5));
  });

  it('UIC-INTL-FORMAT-1.3 writes the spaces runtimes format differently the same way', () => {
    expect(normalizeIntlSpaces('6:30\u202fPM')).toBe('6:30 PM');
    expect(normalizeIntlSpaces('6:30 PM')).toBe('6:30 PM');
    expect(normalizeIntlSpaces('1:00\u2009–\u20094:00')).toBe('1:00 – 4:00');
    expect(normalizeIntlSpaces('Nov 1, 2026, 6:30\u202fPM', '\u00a0')).toBe(
      'Nov\u00a01,\u00a02026,\u00a06:30\u00a0PM',
    );
  });
});
