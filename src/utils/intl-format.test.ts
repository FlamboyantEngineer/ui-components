import { describe, expect, it } from 'vitest';
import {
  getDateFormatter,
  getDateTimeFormat,
  getListFormat,
  getNumberFormat,
  getRelativeTimeFormat,
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
});
