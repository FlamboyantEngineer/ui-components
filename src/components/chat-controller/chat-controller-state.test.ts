import { afterEach, describe, expect, it, vi } from 'vitest';
import { createIdFactory } from './chat-controller-state.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createIdFactory', () => {
  it('UIC-CHAT-CONTROLLER-2.1 numbers ids after a random UUID for the session', () => {
    const createId = createIdFactory();
    const first = createId();
    expect(first).toMatch(/^chat-[0-9a-f-]{36}-1$/);
    expect(createId()).toBe(first.replace(/-1$/, '-2'));
    expect(createIdFactory()()).not.toBe(first);
  });

  it('UIC-CHAT-CONTROLLER-2.1 falls back to 16 random characters without randomUUID', () => {
    vi.stubGlobal('crypto', {});
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(createIdFactory()()).toMatch(/^chat-[0-9a-z]{16}-1$/);
  });
});
