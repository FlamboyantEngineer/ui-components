'use client';

import { PlusGlyph } from '../../core/glyphs.js';
import { useState, type ReactNode } from 'react';
import { GridList, useFilter } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Selection } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { EmptyState } from '../empty-state/empty-state.js';
import { SearchField } from '../search-field/search-field.js';
import { Skeleton, SkeletonText } from '../skeleton/skeleton.js';
import { TextMatchProvider } from '../text-match/text-match.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { ChatListRow, listHooks, type ChatConversation } from './chat-list-row.js';

export interface ChatListProps extends BaseProps, AriaLabellingProps {
  /** The conversations, in the order to list them. */
  conversations: readonly ChatConversation[];
  /** The open conversation's id, controlled (`null` for none). Left out, the list keeps it. */
  selectedId?: string | null | undefined;
  /** Called with the id of the conversation the reader opens. */
  onSelectionChange?: ((id: string) => void) | undefined;
  /**
   * Called with the search text as it changes, for a host that searches itself and passes the
   * matching `conversations`. Without it, the list keeps the conversations whose title or last
   * message contains the text.
   */
  onSearchChange?: ((query: string) => void) | undefined;
  /** Starts a new conversation. Shows the New chat button. */
  onNew?: (() => void) | undefined;
  /** The conversations are loading: placeholder rows stand in for them. */
  isLoading?: boolean | undefined;
  /** Shown while there are no conversations. Defaults to the provider's `noConversations` string. */
  emptyState?: ReactNode;
  /** Controls at the end of each row, such as a menu of the conversation's commands. */
  renderActions?: ((conversation: ChatConversation) => ReactNode) | undefined;
  /** The clock the times are read against. Defaults to the current time. */
  getNow?: (() => Date) | undefined;
}

const currentTime = () => new Date();

/** How many placeholder rows stand in for the conversations while they load. */
const skeletonRows = 4;

/** The conversations the search keeps: all of them while the host searches or the text is blank. */
function useShownConversations(
  { conversations, onSearchChange }: Pick<ChatListProps, 'conversations' | 'onSearchChange'>,
  query: string,
) {
  const { contains } = useFilter({ sensitivity: 'base' });
  const text = query.trim();
  if (onSearchChange || !text) return conversations;
  return conversations.filter(
    (conversation) =>
      contains(conversation.title, text) || contains(conversation.lastMessage ?? '', text),
  );
}

/** Placeholder rows and a loading announcement. */
function LoadingRows() {
  const strings = useUiStrings();
  return (
    <>
      {Array.from({ length: skeletonRows }, (_, row) => (
        <div key={row} {...listHooks.slot('skeleton')}>
          <Skeleton shape="circle" />
          <SkeletonText lines={2} />
        </div>
      ))}
      <VisuallyHidden role="status">{strings.loadingConversations}</VisuallyHidden>
    </>
  );
}

/** What the list shows without rows: loading rows, the empty state or the no-match notice. */
function ListEmptyState({
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

/** The search field and, given `onNew`, the New chat button. */
function ListHeader({
  query,
  onSearch,
  onNew,
}: {
  query: string;
  onSearch: (query: string) => void;
  onNew: (() => void) | undefined;
}) {
  const strings = useUiStrings();
  return (
    <div {...listHooks.slot('header')}>
      <SearchField
        label={strings.searchConversations}
        placeholder={strings.searchConversations}
        size="sm"
        value={query}
        onChange={onSearch}
        className={listHooks.slotClass('search')}
      />
      {onNew ? (
        <Button
          size="sm"
          startIcon={PlusGlyph}
          onPress={onNew}
          className={listHooks.slotClass('new')}
        >
          {strings.newChat}
        </Button>
      ) : null}
    </div>
  );
}

/**
 * A list of conversations to open: a search field, a New chat button and a React Aria grid list of
 * rows with an avatar, title, time, last message, muted mark, unread count and the host's actions.
 * One conversation is selected at a time; arrow keys move between rows and into a row's controls.
 */
export function ChatList({
  conversations,
  selectedId,
  onSelectionChange,
  onSearchChange,
  onNew,
  isLoading = false,
  emptyState,
  renderActions,
  getNow = currentTime,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  className,
  ...rest
}: ChatListProps) {
  const strings = useUiStrings();
  const [query, setQuery] = useState('');
  const [ownSelection, setOwnSelection] = useState<string | null>(null);
  const shown = useShownConversations({ conversations, onSearchChange }, query);
  const selected = selectedId === undefined ? ownSelection : selectedId;
  const select = (keys: Selection) => {
    const [key] = keys === 'all' ? [] : [...keys];
    if (key === undefined) return;
    setOwnSelection(String(key));
    onSelectionChange?.(String(key));
  };
  return (
    <div
      {...rest}
      {...listHooks.root({ className, props: rest, data: { loading: isLoading } })}
      aria-busy={isLoading || undefined}
    >
      <ListHeader
        query={query}
        onSearch={(value) => {
          setQuery(value);
          onSearchChange?.(value);
        }}
        onNew={onNew}
      />
      <TextMatchProvider query={query} ignoreAccents>
        <GridList
          aria-label={ariaLabelledby ? undefined : (ariaLabel ?? strings.conversations)}
          aria-labelledby={ariaLabelledby}
          className={listHooks.slotClass('list')}
          items={isLoading ? [] : shown}
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={selected === null ? [] : [selected]}
          onSelectionChange={select}
          dependencies={[renderActions, getNow]}
          renderEmptyState={() => (
            <ListEmptyState
              isLoading={isLoading}
              isSearching={query.trim() !== ''}
              emptyState={emptyState}
            />
          )}
        >
          {(conversation) => (
            <ChatListRow
              conversation={conversation}
              renderActions={renderActions}
              getNow={getNow}
            />
          )}
        </GridList>
      </TextMatchProvider>
    </div>
  );
}

export type { ChatConversation, ChatListParticipant } from './chat-list-row.js';
