/** Where the search stands, as the host reports it. */
export type SearchPaneStatus = 'idle' | 'pending' | 'ready' | 'error' | 'unavailable';

/**
 * What the pane shows: no query (`empty`), a query not searched yet (`idle`), a search running
 * (`pending`), results, no results, a failed search (`error`) or no search possible (`unavailable`).
 */
export type SearchPaneState =
  'empty' | 'idle' | 'pending' | 'results' | 'no-results' | 'error' | 'unavailable';

/** What the pane shows for the host's status, the query and how many results there are. */
export function resolveSearchPaneState(
  status: SearchPaneStatus,
  query: string,
  count: number,
): SearchPaneState {
  if (status === 'unavailable' || status === 'error') return status;
  if (query.trim() === '') return 'empty';
  if (status === 'idle' || status === 'pending') return status;
  return count > 0 ? 'results' : 'no-results';
}

/** The result a step lands on, wrapping at either end; from no current result, the first or last. */
export function stepSearchResult(currentIndex: number, count: number, by: 1 | -1): number {
  if (count === 0) return -1;
  if (currentIndex < 0 || currentIndex >= count) return by === 1 ? 0 : count - 1;
  return (currentIndex + by + count) % count;
}
