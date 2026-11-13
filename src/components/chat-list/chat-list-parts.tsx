'use client';

import type { ReactNode } from 'react';
import { PlusGlyph } from '../../core/glyphs.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Button } from '../button/button.js';
import { EmptyState } from '../empty-state/empty-state.js';
import { SearchField } from '../search-field/search-field.js';
import { Skeleton, SkeletonText } from '../skeleton/skeleton.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { listHooks } from './chat-list-row.js';

/** The shape of a placeholder row: a title line, an icon and a title, or an avatar, a title and a last message. */
export type ChatListLoadingRows = 'titles' | 'icons' | 'avatars';

/** How many placeholder rows stand in for the conversations while they load. */
const loadingRowCount = 6;

/** Decorative placeholder rows shaped like `shape` rows: a start, then a title line and maybe a preview line. */
export function SkeletonRows({ count, shape }: { count: number; shape: ChatListLoadingRows }) {
  return Array.from({ length: count }, (_, row) => (
    <div key={row} {...listHooks.slot('skeleton')} aria-hidden="true">
      {shape === 'titles' ? null : (
        <Skeleton
          shape={shape === 'avatars' ? 'circle' : 'rectangle'}
          className={listHooks.slotClass('skeleton-start')}
        />
      )}
      <SkeletonText
        lines={shape === 'avatars' ? 2 : 1}
        className={listHooks.slotClass('skeleton-text')}
      />
    </div>
  ));
}

/** Placeholder rows while the conversations load, and a loading announcement. */
function LoadingRows({ shape }: { shape: ChatListLoadingRows }) {
  const strings = useUiStrings();
  return (
    <>
      <SkeletonRows count={loadingRowCount} shape={shape} />
      <VisuallyHidden role="status">{strings.loadingConversations}</VisuallyHidden>
    </>
  );
}

/** What the list shows without rows: loading rows, the empty state or the no-match notice. */
export function ListEmptyState({
  isLoading,
  loadingRows,
  isSearching,
  emptyState,
}: {
  isLoading: boolean;
  loadingRows: ChatListLoadingRows;
  isSearching: boolean;
  emptyState: ReactNode;
}) {
  const strings = useUiStrings();
  if (isLoading) return <LoadingRows shape={loadingRows} />;
  return (
    <div {...listHooks.slot('empty')}>
      {isSearching ? (
        <EmptyState size="sm" description={strings.noMatchingConversations} />
      ) : (
        (emptyState ?? <EmptyState size="sm" description={strings.noConversations} />)
      )}
    </div>
  );
}

/** Given `onNew`, the New chat row, then, given `showSearch`, the search field. */
export function ListHeader({
  query,
  onSearch,
  onNew,
  showSearch,
}: {
  query: string;
  onSearch: (query: string) => void;
  onNew: (() => void) | undefined;
  showSearch: boolean;
}) {
  const strings = useUiStrings();
  if (!onNew && !showSearch) return null;
  return (
    <div {...listHooks.slot('header')}>
      {onNew ? (
        <Button
          variant="ghost"
          startIcon={PlusGlyph}
          onPress={onNew}
          className={listHooks.slotClass('new')}
        >
          {strings.newChat}
        </Button>
      ) : null}
      {showSearch ? (
        <SearchField
          label={strings.searchConversations}
          placeholder={strings.searchConversations}
          size="sm"
          value={query}
          onChange={onSearch}
          className={listHooks.slotClass('search')}
        />
      ) : null}
    </div>
  );
}

/** Given a `heading`, the heading above the rows, which names the grid list by its `id`. */
export function ListHeading({ id, heading }: { id: string; heading: ReactNode }) {
  if (isEmptyNode(heading)) return null;
  return (
    <div id={id} {...listHooks.slot('heading')}>
      {heading}
    </div>
  );
}
