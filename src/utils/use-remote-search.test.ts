import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useRemoteSearch, type RemoteSearchLoader } from './use-remote-search.js';

const words = ['apple', 'apricot', 'banana', 'cherry'];

function findWords(query: string) {
  return { items: words.filter((word) => word.includes(query)) };
}

describe('useRemoteSearch', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('UIC-COMBOBOX-5.1 waits for the search delay unless asked to search at once', async () => {
    vi.useFakeTimers();
    const load = vi.fn<RemoteSearchLoader<string>>(async (query) => findWords(query));
    const { result } = renderHook(() => useRemoteSearch({ load, searchDelay: 200 }));
    act(() => result.current.search('ap'));
    expect(result.current.isLoading).toBe(true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(199);
    });
    expect(load).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(load).toHaveBeenCalledWith('ap', expect.any(AbortSignal));
    expect(result.current.results).toEqual(['apple', 'apricot']);
    act(() => result.current.searchNow('an'));
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(result.current.results).toEqual(['banana']);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('UIC-COMBOBOX-5.1 lists nothing for a short query and nothing without a loader', async () => {
    const load = vi.fn<RemoteSearchLoader<string>>(async (query) => findWords(query));
    const { result, rerender } = renderHook(
      ({ withLoader }) =>
        useRemoteSearch({ load: withLoader ? load : undefined, minSearchLength: 2 }),
      { initialProps: { withLoader: true } },
    );
    act(() => result.current.searchNow('a'));
    await waitFor(() => expect(result.current.isTooShort).toBe(true));
    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    rerender({ withLoader: false });
    act(() => result.current.searchNow('apple'));
    expect(result.current.isLoading).toBe(false);
    expect(load).not.toHaveBeenCalled();
  });

  it('UIC-COMBOBOX-5.3 appends the next page and reports a failed search', async () => {
    const load = vi.fn<RemoteSearchLoader<string>>(async (query, _signal, cursor) => {
      if (query === 'fail') throw new Error('offline');
      return cursor === undefined ? { items: ['a1'], cursor: 'next' } : { items: ['a2'] };
    });
    const { result } = renderHook(() => useRemoteSearch({ load, searchDelay: 0 }));
    act(() => result.current.searchNow('a'));
    await waitFor(() => expect(result.current.hasMore).toBe(true));
    act(() => result.current.loadMore());
    expect(result.current.isLoadingMore).toBe(true);
    await waitFor(() => expect(result.current.results).toEqual(['a1', 'a2']));
    expect(result.current.hasMore).toBe(false);
    expect(load).toHaveBeenLastCalledWith('a', expect.any(AbortSignal), 'next');
    act(() => result.current.searchNow('fail'));
    await waitFor(() => expect(result.current.hasFailed).toBe(true));
  });

  it('UIC-COMBOBOX-5.3 never passes a cursor to another query, even after that query fails', async () => {
    const load = vi.fn<RemoteSearchLoader<string>>(async (query, _signal, cursor) => {
      if (query === 'blue') throw new Error('offline');
      return cursor === undefined ? { items: ['alpha 1'], cursor: 'alpha-page-2' } : { items: [] };
    });
    const { result } = renderHook(() => useRemoteSearch({ load, searchDelay: 0 }));
    act(() => result.current.searchNow('alpha'));
    await waitFor(() => expect(result.current.hasMore).toBe(true));
    act(() => result.current.search('blue'));
    expect(result.current.hasMore).toBe(false);
    await waitFor(() => expect(result.current.hasFailed).toBe(true));
    expect(result.current.results).toEqual([]);
    expect(result.current.hasMore).toBe(false);
    act(() => result.current.loadMore());
    expect(load.mock.calls.map(([query, , cursor]) => [query, cursor])).toEqual([
      ['alpha', undefined],
      ['blue', undefined],
    ]);
  });

  it('UIC-COMBOBOX-5.3 drops a page of a replaced search that arrives late', async () => {
    const pending = new Map<string, (page: { items: string[]; cursor?: string }) => void>();
    const load = vi.fn<RemoteSearchLoader<string>>(
      (query, _signal, cursor) =>
        new Promise((resolve) => pending.set(`${query} ${cursor ?? 'first'}`, resolve)),
    );
    const { result } = renderHook(() => useRemoteSearch({ load, searchDelay: 0 }));
    act(() => result.current.searchNow('alpha'));
    await act(async () => pending.get('alpha first')?.({ items: ['alpha 1'], cursor: 'a2' }));
    act(() => result.current.loadMore());
    act(() => result.current.searchNow('blue'));
    expect(load.mock.calls[1]?.[1].aborted).toBe(true);
    await act(async () => pending.get('blue first')?.({ items: ['blue 1'], cursor: 'b2' }));
    act(() => result.current.loadMore());
    expect(result.current.isLoadingMore).toBe(true);
    await act(async () => pending.get('alpha a2')?.({ items: ['alpha 2'] }));
    expect(result.current.results).toEqual(['blue 1']);
    expect(result.current.isLoadingMore).toBe(true);
    await act(async () => pending.get('blue b2')?.({ items: ['blue 2'] }));
    expect(result.current.results).toEqual(['blue 1', 'blue 2']);
    expect(result.current.hasMore).toBe(false);
  });

  it('UIC-COMBOBOX-5.3 asks a replaced loader for a fresh first page and keeps pages a failed next page left', async () => {
    const first = vi.fn<RemoteSearchLoader<string>>(async () => ({
      items: ['one'],
      cursor: 'two',
    }));
    const second = vi.fn<RemoteSearchLoader<string>>(async (_query, _signal, cursor) => {
      if (cursor !== undefined) throw new Error('offline');
      return { items: ['uno'], cursor: 'dos' };
    });
    const { result, rerender } = renderHook(
      ({ load }) => useRemoteSearch({ load, searchDelay: 0 }),
      { initialProps: { load: first } },
    );
    act(() => result.current.searchNow('n'));
    await waitFor(() => expect(result.current.hasMore).toBe(true));
    rerender({ load: second });
    act(() => result.current.searchNow('n'));
    await waitFor(() => expect(result.current.results).toEqual(['uno']));
    expect(second).toHaveBeenCalledWith('n', expect.any(AbortSignal));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.hasFailed).toBe(true));
    expect(result.current.results).toEqual(['uno']);
    expect(result.current.hasMore).toBe(false);
    expect(first).toHaveBeenCalledTimes(1);
  });
});
