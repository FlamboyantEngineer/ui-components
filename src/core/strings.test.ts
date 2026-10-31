import { describe, expect, it, vi } from 'vitest';
import type * as Locales from './locales/index.js';

describe('default strings (UIC-PROVIDER-3.1)', () => {
  it('compiles the English text on first use, not when the library loads', async () => {
    vi.resetModules();
    let reads = 0;
    vi.doMock('./locales/index.js', async (load) => {
      const actual = await load<typeof Locales>();
      const en = new Proxy(actual.en, {
        get(target, key, receiver) {
          reads += 1;
          return Reflect.get(target, key, receiver) as unknown;
        },
        ownKeys(target) {
          reads += 1;
          return Reflect.ownKeys(target);
        },
      });
      return { ...actual, en };
    });
    const { getDefaultStrings } = await import('./strings.js');
    await import('./provider.js');
    expect(reads).toBe(0);
    const strings = getDefaultStrings();
    expect(reads).toBeGreaterThan(0);
    expect(strings.close).toBe('Close');
    expect(getDefaultStrings()).toBe(strings);
    vi.doUnmock('./locales/index.js');
  }, 30_000);
});
