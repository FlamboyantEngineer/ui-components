import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createJsonCodec } from '../utils/json-codec.js';
import { UiProvider, usePersistentState } from './provider.js';
import { createMemoryStorage, type UiStorage } from './storage.js';

const textCodec = createJsonCodec((value): string => {
  if (typeof value !== 'string') throw new TypeError('Not stored text');
  return value;
});

/** A memory adapter that counts its writes. */
function countingStorage(): UiStorage & { writes: number } {
  const storage = createMemoryStorage();
  const counted = {
    writes: 0,
    getItem: (key: string) => storage.getItem(key),
    setItem: (key: string, value: string) => {
      counted.writes += 1;
      storage.setItem(key, value);
    },
    removeItem: (key: string) => storage.removeItem(key),
  };
  return counted;
}

function renderDelayed(storage: UiStorage, initialKey = 'note') {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <UiProvider storage={storage}>{children}</UiProvider>
  );
  return renderHook(
    ({ key }) => usePersistentState(key, '', { codec: textCodec, writeDelay: 300 }),
    {
      initialProps: { key: initialKey },
      wrapper,
    },
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe('persistent state with a write delay', () => {
  it('UIC-PROVIDER-6.3 updates at once and writes a burst of changes once, after the pause', () => {
    vi.useFakeTimers();
    const storage = countingStorage();
    const { result } = renderDelayed(storage);
    for (const text of ['P', 'Pe', 'Pea', 'Pear', 'Pears']) act(() => result.current[1](text));
    expect(result.current[0]).toBe('Pears');
    expect(storage.writes).toBe(0);
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(storage.writes).toBe(0);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(storage.writes).toBe(1);
    expect(storage.getItem('note')).toBe('"Pears"');
  });

  it('UIC-PROVIDER-6.3 writes a pending change on flush, a key change, unmount and pagehide', () => {
    vi.useFakeTimers();
    const storage = countingStorage();
    const { result, rerender, unmount } = renderDelayed(storage);
    act(() => result.current[1]('Plum'));
    act(() => result.current[2]());
    expect(storage.getItem('note')).toBe('"Plum"');
    act(() => result.current[1]('Plums'));
    rerender({ key: 'other' });
    expect(storage.getItem('note')).toBe('"Plums"');
    expect(storage.getItem('other')).toBeNull();
    act(() => result.current[1]('Quince'));
    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });
    expect(storage.getItem('other')).toBe('"Quince"');
    act(() => result.current[1]('Quinces'));
    unmount();
    expect(storage.getItem('other')).toBe('"Quinces"');
    act(() => {
      vi.runAllTimers();
    });
    expect(storage.writes).toBe(4);
  });
});
