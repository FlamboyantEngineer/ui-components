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
});
