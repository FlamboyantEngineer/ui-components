'use client';

import { useMemo, useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { LoadMore, type LoadMoreProps } from '../load-more/load-more.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { type ChatListLoadingRows, SkeletonRows } from './chat-list-parts.js';
import { listHooks } from './chat-list-row.js';

/** How many placeholder rows follow the rows while the next conversations load. */
const loadingMoreRowCount = 2;

/**
 * Whether the next conversations are loading, given by the host or while a promise `onLoadMore`
 * returned is unsettled, and the request that tracks it. The promise goes on to the Load more row,
 * which reports its failure.
 */
export function useLoadingMore(onLoadMore: LoadMoreProps['onLoadMore'], isLoadingMore: boolean) {
  const [requests, setRequests] = useState(0);
  const load = useMemo(() => {
    if (!onLoadMore) return undefined;
    return () => {
      const result = onLoadMore();
      if (!(result instanceof Promise)) return result;
      setRequests((count) => count + 1);
      return result.finally(() => setRequests((count) => count - 1));
    };
  }, [onLoadMore]);
  return { load, isLoadingMore: isLoadingMore || requests > 0 };
}

/** The Load more row after the rows, while the host has more to load, pending while more load. */
function ListLoadMore({
  onLoadMore,
  onError,
  isLoadingMore,
}: Partial<Pick<LoadMoreProps, 'onLoadMore' | 'onError'>> & { isLoadingMore: boolean }) {
  const strings = useUiStrings();
  if (!onLoadMore) return null;
  return (
    <LoadMore
      variant="ghost"
      size="md"
      onLoadMore={onLoadMore}
      onError={onError}
      isPending={isLoadingMore}
      label={isLoadingMore ? strings.loading : undefined}
      pendingLabel={strings.loadingMoreConversations}
      className={listHooks.slotClass('load-more')}
    />
  );
}

/** Placeholder rows after the rows while the next conversations load, and their announcement. */
function LoadingMoreRows({
  isLoadingMore,
  shape,
}: {
  isLoadingMore: boolean;
  shape: ChatListLoadingRows;
}) {
  const strings = useUiStrings();
  // The status stays mounted so a screen reader hears its text when the load starts.
  return (
    <>
      {isLoadingMore ? <SkeletonRows count={loadingMoreRowCount} shape={shape} /> : null}
      <VisuallyHidden role="status">
        {isLoadingMore ? strings.loadingMoreConversations : ''}
      </VisuallyHidden>
    </>
  );
}

/**
 * What follows the rows while the list is not loading: placeholder rows while the next
 * conversations load, then, given `onLoadMore`, the Load more row.
 */
export function ListFooter({
  onLoadMore,
  onError,
  isLoadingMore,
  shape,
}: Partial<Pick<LoadMoreProps, 'onLoadMore' | 'onError'>> & {
  isLoadingMore: boolean;
  shape: ChatListLoadingRows;
}) {
  return (
    <>
      <LoadingMoreRows isLoadingMore={isLoadingMore} shape={shape} />
      <ListLoadMore onLoadMore={onLoadMore} onError={onError} isLoadingMore={isLoadingMore} />
    </>
  );
}
