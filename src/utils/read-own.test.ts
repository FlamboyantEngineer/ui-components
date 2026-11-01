import { describe, expect, it } from 'vitest';
import { readOwn } from './read-own.js';

describe('readOwn', () => {
  it('UIC-MAPPING-TABLE-1.5 UIC-STEP-LIST-EDITOR-1.6 reads own values and never inherited ones', () => {
    const record: Record<string, string> = { a: 'one' };
    expect(readOwn(record, 'a')).toBe('one');
    for (const key of ['constructor', '__proto__', 'toString', 'missing']) {
      expect(readOwn(record, key)).toBeUndefined();
    }
    const own = Object.fromEntries([
      ['constructor', 'set'],
      ['__proto__', 'kept'],
    ]);
    expect(readOwn(own, 'constructor')).toBe('set');
    expect(readOwn(own, '__proto__')).toBe('kept');
  });
});
