import { act, render, renderHook, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import type { Key } from '../../core/props.js';
import { Tree } from './tree.js';
import { useTreeLoads } from './use-tree-loads.js';

interface Place {
  id: string;
  name: string;
  isLazy?: boolean;
  children?: Place[];
}

const START: Place[] = [
  { id: 'europe', name: 'Europe', isLazy: true },
  { id: 'asia', name: 'Asia', isLazy: true },
];

/** Reports every observed loading sentinel as in view at once: jsdom has no layout. */
class VisibleObserver {
  constructor(private readonly callback: IntersectionObserverCallback) {}
  observe(target: Element) {
    this.callback(
      [{ isIntersecting: true, target } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
  disconnect() {}
}

function Places({ onLoad }: { onLoad: (place: Place) => Promise<Place[]> }) {
  const [places, setPlaces] = useState(START);
  return (
    <Tree
      aria-label="Places"
      items={places}
      getTextValue={(place) => place.name}
      hasChildItems={(place) => place.isLazy ?? false}
      onLoadChildren={async (place) => {
        const children = await onLoad(place);
        setPlaces((current) =>
          current.map((entry) => (entry.id === place.id ? { ...entry, children } : entry)),
        );
      }}
    />
  );
}

const row = (label: string) => screen.getByRole('row', { name: label });

describe('Tree loading children', () => {
  beforeEach(() => vi.stubGlobal('IntersectionObserver', VisibleObserver));
  afterEach(() => vi.unstubAllGlobals());

  it('UIC-TREE-2.4 asks for an opened branch’s children and shows them once loaded', async () => {
    let resolve: (children: Place[]) => void = () => {};
    const onLoad = vi.fn(() => new Promise<Place[]>((done) => (resolve = done)));
    render(<Places onLoad={onLoad} />);
    expect(onLoad).not.toHaveBeenCalled();
    await userEvent.click(within(row('Europe')).getByRole('button', { name: 'Expand Europe' }));
    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(onLoad).toHaveBeenCalledWith(expect.objectContaining({ id: 'europe' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Loading');
    await act(async () => resolve([{ id: 'lisbon', name: 'Lisbon' }]));
    expect(row('Lisbon')).toHaveAttribute('aria-level', '2');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it('UIC-TREE-2.4 shows why a load failed in the row and retries on request', async () => {
    const onLoad = vi
      .fn<(place: Place) => Promise<Place[]>>()
      .mockRejectedValueOnce(new Error('The atlas is offline.'))
      .mockResolvedValueOnce([{ id: 'hanoi', name: 'Hanoi' }]);
    const { container } = render(<Places onLoad={onLoad} />);
    await userEvent.click(within(row('Asia')).getByRole('button', { name: 'Expand Asia' }));
    const error = await screen.findByRole('alert');
    expect(error).toHaveTextContent('The atlas is offline.');
    expect(error.closest('.ui-tree__load-error')).toBe(error);
    expect(row('Asia')).toContainElement(error);
    expectHooksMatchSpec(container, 'TREE', { slots: ['load-error'] });
    expect(onLoad).toHaveBeenCalledTimes(1);

    await userEvent.click(within(row('Asia')).getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('row', { name: 'Hanoi' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(onLoad).toHaveBeenCalledTimes(2);
  });

  it('UIC-TREE-2.4 forgets a branch that leaves the items, so it asks again when it comes back', async () => {
    const onLoad = vi
      .fn<(place: Place) => Promise<Place[]>>()
      .mockRejectedValueOnce(new Error('The atlas is offline.'))
      .mockResolvedValueOnce([{ id: 'hanoi', name: 'Hanoi' }]);
    function Swapping() {
      const [places, setPlaces] = useState(START);
      return (
        <>
          <button type="button" onClick={() => setPlaces(START.slice(0, 1))}>
            Europe only
          </button>
          <button type="button" onClick={() => setPlaces(START)}>
            Every place
          </button>
          <Tree
            aria-label="Places"
            items={places}
            getTextValue={(place) => place.name}
            hasChildItems={(place) => place.isLazy ?? false}
            defaultExpandedKeys={['asia']}
            onLoadChildren={async (place) => {
              const children = await onLoad(place);
              setPlaces((current) =>
                current.map((entry) => (entry.id === place.id ? { ...entry, children } : entry)),
              );
            }}
          />
        </>
      );
    }
    render(<Swapping />);
    expect(await screen.findByRole('alert')).toHaveTextContent('The atlas is offline.');
    expect(onLoad).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Europe only' }));
    expect(screen.queryByRole('row', { name: 'Asia' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Every place' }));
    expect(await screen.findByRole('row', { name: 'Hanoi' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(onLoad).toHaveBeenCalledTimes(2);
  });
});

describe('Tree loads of branches that leave the items', () => {
  /** Lets the hook's requests start, a microtask after `load`. */
  const settled = () => act(() => Promise.resolve());

  function setup() {
    const requests: Array<{ resolve: () => void; reject: (error: Error) => void }> = [];
    const onLoad = vi.fn(
      () =>
        new Promise<void>((resolve, reject) => {
          requests.push({ resolve, reject });
        }),
    );
    const listedWith = (keys: Key[]) => (key: Key) => keys.includes(key);
    const view = renderHook(({ isListed }) => useTreeLoads(onLoad, isListed), {
      initialProps: { isListed: listedWith(['branch']) },
    });
    const list = (keys: Key[]) => view.rerender({ isListed: listedWith(keys) });
    const request = (index: number) => {
      const entry = requests[index];
      if (!entry) throw new Error(`no request ${String(index)}`);
      return entry;
    };
    return { view, onLoad, list, request };
  }

  it.each(['resolve', 'reject'] as const)(
    'UIC-TREE-2.4 ignores a request that settles (%s) while its branch is gone',
    async (outcome) => {
      const { view, onLoad, list, request } = setup();
      act(() => view.result.current.load('branch'));
      await settled();
      expect(view.result.current.isLoading('branch')).toBe(true);
      list([]);
      await act(async () => {
        if (outcome === 'resolve') request(0).resolve();
        else request(0).reject(new Error('Old failure'));
      });
      list(['branch']);
      expect(view.result.current.hasLoaded('branch')).toBe(false);
      expect(view.result.current.errorOf('branch')).toBeNull();
      expect(view.result.current.isLoading('branch')).toBe(false);
      act(() => view.result.current.load('branch'));
      await settled();
      expect(onLoad).toHaveBeenCalledTimes(2);
      expect(view.result.current.isLoading('branch')).toBe(true);
    },
  );

  it.each(['resolve', 'reject'] as const)(
    'UIC-TREE-2.4 lets a branch that comes back ask again while the old request (%s) is pending',
    async (outcome) => {
      const { view, onLoad, list, request } = setup();
      act(() => view.result.current.load('branch'));
      await settled();
      list([]);
      list(['branch']);
      act(() => view.result.current.load('branch'));
      act(() => view.result.current.load('branch'));
      await settled();
      expect(onLoad).toHaveBeenCalledTimes(2);
      await act(async () => {
        if (outcome === 'resolve') request(0).resolve();
        else request(0).reject(new Error('Old failure'));
      });
      expect(view.result.current.isLoading('branch')).toBe(true);
      expect(view.result.current.hasLoaded('branch')).toBe(false);
      expect(view.result.current.errorOf('branch')).toBeNull();
      // The old request no longer guards the branch, but the new one still does.
      act(() => view.result.current.load('branch'));
      expect(onLoad).toHaveBeenCalledTimes(2);
      await act(async () => request(1).reject(new Error('New failure')));
      expect(view.result.current.errorOf('branch')).toBe('New failure');
    },
  );
});
