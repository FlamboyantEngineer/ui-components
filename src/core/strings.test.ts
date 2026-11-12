import { describe, expect, it, vi } from 'vitest';
import type * as Locales from './locales/index.js';
import { en } from './locales/index.js';
import { compileStrings, type UiStrings } from './strings.js';
import * as modules from './strings/index.js';

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

  it('UIC-PROVIDER-3.1 gathers the text of every module the strings index lists', () => {
    const strings = compileStrings(en, 'en-US');
    const functions = Object.values(modules).flatMap((module) => Object.keys(module.arguments));
    expect(functions.length).toBeGreaterThan(0);
    for (const key of functions) {
      expect(typeof strings[key as keyof UiStrings], key).toBe('function');
    }
    expect(strings.chatReplyFailed).toBe(en.chatReplyFailed);
    expect(strings.chatSourcesLabel(2)).toBe('Sources (2)');
    // @ts-expect-error A key no module declares is not built-in text.
    expect(strings.notDeclared).toBeUndefined();
  });
});
