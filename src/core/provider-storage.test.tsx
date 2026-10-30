import { act, render, renderHook, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { startTransition, Suspense, use, useState, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { UiProvider, usePersistentState } from './provider.js';
import { createMemoryStorage } from './storage.js';

describe('persistent state ownership', () => {
  it('UIC-PROVIDER-6.1 reads a replacement adapter before writing under the same key', () => {
    const first = createMemoryStorage({ count: '2' });
    const second = createMemoryStorage({ count: '10' });
    let storage = first;
    const wrapper = ({ children }: { children: ReactNode }) => (
      <UiProvider storage={storage}>{children}</UiProvider>
    );
    const { result, rerender } = renderHook(() => usePersistentState('count', 0), { wrapper });
    expect(result.current[0]).toBe(2);
    storage = second;
    rerender();
    expect(result.current[0]).toBe(10);
    act(() => result.current[1]((value) => value + 1));
    expect(first.getItem('count')).toBe('2');
    expect(second.getItem('count')).toBe('11');
  });

  it('UIC-PROVIDER-6.1 reads each key and composes updates in the same event', () => {
    const storage = createMemoryStorage({ first: '2', second: '10' });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <UiProvider storage={storage}>{children}</UiProvider>
    );
    const { result, rerender } = renderHook(({ key }) => usePersistentState(key, 0), {
      initialProps: { key: 'first' },
      wrapper,
    });
    rerender({ key: 'second' });
    act(() => {
      result.current[1]((value) => value + 1);
      result.current[1]((value) => value + 1);
    });
    expect(result.current[0]).toBe(12);
    expect(storage.getItem('second')).toBe('12');
    rerender({ key: 'first' });
    expect(result.current[0]).toBe(2);
  });

  it('UIC-PROVIDER-6.1 keeps unpersisted state when only the adapter changes', () => {
    let storage = createMemoryStorage();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <UiProvider storage={storage}>{children}</UiProvider>
    );
    const { result, rerender } = renderHook(() => usePersistentState(undefined, 0), { wrapper });
    act(() => result.current[1](3));
    storage = createMemoryStorage();
    rerender();
    expect(result.current[0]).toBe(3);
  });

  it('UIC-PROVIDER-6.1 keeps a suspended key change out of the visible counter', async () => {
    const user = userEvent.setup();
    const storage = createMemoryStorage({ first: '2', second: '10' });
    const pending = new Promise<never>(() => {});
    function Counter({ storageKey }: { storageKey: string }) {
      const [count, setCount] = usePersistentState(storageKey, 0);
      if (storageKey === 'second') use(pending);
      return <button onClick={() => setCount((value) => value + 1)}>Count {count}</button>;
    }
    function Example() {
      const [key, setKey] = useState('first');
      return (
        <>
          <button onClick={() => startTransition(() => setKey('second'))}>Switch counter</button>
          <Suspense fallback="Loading counter">
            <Counter storageKey={key} />
          </Suspense>
        </>
      );
    }
    render(
      <UiProvider storage={storage}>
        <Example />
      </UiProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Switch counter' }));
    await user.click(screen.getByRole('button', { name: 'Count 2' }));
    expect(storage.getItem('first')).toBe('3');
    expect(storage.getItem('second')).toBe('10');
  });
});
