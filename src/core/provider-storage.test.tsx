import { act, render, renderHook, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { type ReactNode, startTransition, Suspense, use, useState } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { numberCodec } from '../utils/json-codec.js';
import { UiProvider, usePersistentState } from './provider.js';
import { createMemoryStorage, createSafeStorage, type UiStorage } from './storage.js';

describe('persistent state ownership', () => {
  it('UIC-PROVIDER-6.1 reads a replacement adapter before writing under the same key', () => {
    const first = createMemoryStorage({ count: '2' });
    const second = createMemoryStorage({ count: '10' });
    let storage = first;
    const wrapper = ({ children }: { children: ReactNode }) => (
      <UiProvider storage={storage}>{children}</UiProvider>
    );
    const { result, rerender } = renderHook(
      () => usePersistentState('count', 0, { codec: numberCodec }),
      { wrapper },
    );
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
    const { result, rerender } = renderHook(
      ({ key }) => usePersistentState(key, 0, { codec: numberCodec }),
      {
        initialProps: { key: 'first' },
        wrapper,
      },
    );
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
    const { result, rerender } = renderHook(
      () => usePersistentState(undefined, 0, { codec: numberCodec }),
      { wrapper },
    );
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
      const [count, setCount] = usePersistentState(storageKey, 0, { codec: numberCodec });
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

  it('UIC-PROVIDER-6.2 requires a codec', () => {
    function useUncheckedCount() {
      // @ts-expect-error A persisted value is read back only through a codec that checks it.
      return usePersistentState('count', 0);
    }
    expect(useUncheckedCount).toBeTypeOf('function');
  });
});

describe('persistent state hydration', () => {
  function StoredZoom() {
    const [value, setValue] = usePersistentState('zoom', 100, { codec: numberCodec });
    return (
      <button type="button" onClick={() => setValue((previous) => previous + 10)}>
        {value}
      </button>
    );
  }

  async function hydrate(serverStorage: UiStorage, clientStorage: UiStorage) {
    const host = document.body.appendChild(document.createElement('div'));
    host.innerHTML = renderToString(
      <UiProvider locale="en-US" storage={serverStorage}>
        <StoredZoom />
      </UiProvider>,
    );
    const serverText = host.textContent;
    const recoverable: unknown[] = [];
    let app: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      app = hydrateRoot(
        host,
        <UiProvider locale="en-US" storage={clientStorage}>
          <StoredZoom />
        </UiProvider>,
        { onRecoverableError: (error) => recoverable.push(error) },
      );
    });
    return { serverText, recoverable, unmount: () => act(() => app?.unmount()) };
  }

  it('UIC-PROVIDER-6.1 hydrates the fallback, then adopts the stored value', async () => {
    const client = createMemoryStorage({ zoom: '150' });
    const { serverText, recoverable, unmount } = await hydrate(createMemoryStorage(), client);
    expect(serverText).toBe('100');
    expect(recoverable).toEqual([]);
    expect(screen.getByRole('button')).toHaveTextContent('150');
    expect(client.getItem('zoom')).toBe('150');
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveTextContent('160');
    expect(client.getItem('zoom')).toBe('160');
    unmount();
  });

  it('UIC-PROVIDER-6.1 renders the fallback on the server even when its adapter has a value', async () => {
    const { serverText, recoverable, unmount } = await hydrate(
      createMemoryStorage({ zoom: '120' }),
      createMemoryStorage(),
    );
    expect(serverText).toBe('100');
    expect(recoverable).toEqual([]);
    expect(screen.getByRole('button')).toHaveTextContent('100');
    unmount();
  });

  it('UIC-PROVIDER-6.1 reads the store in the first render of a client-only mount', () => {
    const storage = createMemoryStorage({ zoom: '150' });
    const seen: number[] = [];
    function Probe() {
      const [value] = usePersistentState('zoom', 100, { codec: numberCodec });
      seen.push(value);
      return null;
    }
    render(
      <UiProvider storage={storage}>
        <Probe />
      </UiProvider>,
    );
    expect(seen[0]).toBe(150);
  });
});

describe('createSafeStorage', () => {
  it('UIC-PROVIDER-6.1 keeps one adapter for a storage wrapped while rendering', () => {
    const store = createMemoryStorage({ count: '4' });
    let reads = 0;
    const counted: UiStorage = {
      ...store,
      getItem: (key) => {
        reads += 1;
        return store.getItem(key);
      },
    };
    expect(createSafeStorage(counted)).toBe(createSafeStorage(counted));
    function Count() {
      const [count] = usePersistentState('count', 0, { codec: numberCodec });
      return <output>{count}</output>;
    }
    function Host({ tick }: { tick: number }) {
      return (
        <UiProvider storage={createSafeStorage(counted)}>
          <span>{tick}</span>
          <Count />
        </UiProvider>
      );
    }
    const { rerender } = render(<Host tick={0} />);
    expect(screen.getByRole('status')).toHaveTextContent('4');
    const settled = reads;
    rerender(<Host tick={1} />);
    rerender(<Host tick={2} />);
    expect(reads).toBe(settled);
  });
});
