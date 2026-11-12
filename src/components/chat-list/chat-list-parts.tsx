'use client';

import type { ReactNode } from 'react';
import { PlusGlyph } from '../../core/glyphs.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { EmptyState } from '../empty-state/empty-state.js';
import { SearchField } from '../search-field/search-field.js';
import { SkeletonText } from '../skeleton/skeleton.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { listHooks } from './chat-list-row.js';

/** How many placeholder rows stand in for the conversations while they load. */
const skeletonRows = 4;

/** Placeholder rows, a title's line each, and a loading announcement. */
function LoadingRows() {
  const strings = useUiStrings();
  return (
    <>
      {Array.from({ length: skeletonRows }, (_, row) => (
        <div key={row} {...listHooks.slot('skeleton')}>
          <SkeletonText lines={1} />
        </div>
      ))}
      <VisuallyHidden role="status">{strings.loadingConversations}</VisuallyHidden>
    </>
  );
}

/** What the list shows without rows: loading rows, the empty state or the no-match notice. */
export function ListEmptyState({
  isLoading,
  isSearching,
  emptyState,
}: {
  isLoading: boolean;
  isSearching: boolean;
  emptyState: ReactNode;
}) {
  const strings = useUiStrings();
  if (isLoading) return <LoadingRows />;
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
