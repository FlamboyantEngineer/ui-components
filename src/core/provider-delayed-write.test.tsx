import { act, render, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createJsonCodec } from '../utils/json-codec.js';
import { UiProvider, usePersistentState, type PersistentState } from './provider.js';
import { createMemoryStorage, createSafeStorage, type UiStorage } from './storage.js';

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

/** A hook under a provider whose adapter the props choose, so a rerender can replace it. */
function renderWithAdapter(storage: UiStorage, key: string | undefined) {
  const result: { current: PersistentState<string> | null } = { current: null };
  function Probe({ stateKey }: { stateKey: string | undefined }) {
    result.current = usePersistentState(stateKey, '', { codec: textCodec, writeDelay: 300 });
    return null;
  }
  const view = (props: { key: string | undefined; storage: UiStorage }) => (
    <UiProvider storage={props.storage}>
      <Probe stateKey={props.key} />
    </UiProvider>
  );
  const { rerender } = render(view({ key, storage }));
  return {
    result: result as { current: PersistentState<string> },
    rerender: (props: { key: string | undefined; storage: UiStorage }) => rerender(view(props)),
  };
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

  it('UIC-PROVIDER-6.3 keeps a pending change when a new adapter wraps the same store', () => {
    vi.useFakeTimers();
    const backing = createMemoryStorage({ note: '"Pear"' });
    const { result, rerender } = renderWithAdapter(createSafeStorage(backing), 'note');
    act(() => result.current[1]('Plum'));
    rerender({ key: 'note', storage: createSafeStorage(backing) });
    expect(backing.getItem('note')).toBe('"Plum"');
    expect(result.current[0]).toBe('Plum');
    act(() => result.current[1]((text) => `${text}s`));
    expect(result.current[0]).toBe('Plums');
  });

  it('UIC-PROVIDER-6.3 reads a different store as its own, writing the pending change to the old one', () => {
    vi.useFakeTimers();
    const first = createMemoryStorage({ note: '"Pear"' });
    const second = createMemoryStorage({ note: '"Fig"' });
    const { result, rerender } = renderWithAdapter(first, 'note');
    act(() => result.current[1]('Plum'));
    rerender({ key: 'note', storage: second });
    expect(first.getItem('note')).toBe('"Plum"');
    expect(second.getItem('note')).toBe('"Fig"');
    expect(result.current[0]).toBe('Fig');
  });

  it('UIC-PROVIDER-6.3 keeps plain state, with no key, across an adapter change', () => {
    vi.useFakeTimers();
    const backing = createMemoryStorage();
    const { result, rerender } = renderWithAdapter(createSafeStorage(backing), undefined);
    act(() => result.current[1]('Plum'));
    rerender({ key: undefined, storage: createSafeStorage(backing) });
    expect(result.current[0]).toBe('Plum');
    expect(backing.getItem('note')).toBeNull();
  });
});
