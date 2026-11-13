'use client';

import { type KeyboardEvent, type ReactNode, useEffect, useId, useMemo, useState } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, RefProps, Selection } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { GridList, useFilter } from '../../primitives/index.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import type { AttributionProps } from '../attribution/attribution.js';
import {
  ContextMenu,
  useMenuController,
  useMenuControllerState,
} from '../context-menu/context-menu.js';
import { LoadMore, type LoadMoreProps } from '../load-more/load-more.js';
import { TextMatchProvider } from '../text-match/text-match.js';
import { type ChatListMenu, openRowMenu } from './chat-list-menu.js';
import { ListEmptyState, ListHeader } from './chat-list-parts.js';
import { type ChatConversation, ChatListRow, listHooks } from './chat-list-row.js';

export interface ChatListProps
  extends
    RefProps<HTMLDivElement>,
    BaseProps,
    AriaLabellingProps,
    Pick<AttributionProps, 'fallbackAfterDays' | 'getNow' | 'timeZone'> {
  /** The conversations, in the order to list them. */
  conversations: readonly ChatConversation[];
  /** The open conversation's id, controlled (`null` for none). Left out, the list keeps it. */
  selectedKey?: string | null | undefined;
  /** Called with the id of the conversation the reader opens. */
  onSelectionChange?: ((id: string) => void) | undefined;
  /**
   * Called with the search text as it changes, for a host that searches itself and passes the
   * matching `conversations`. Without it, the list keeps the conversations whose title or last
   * message contains the text.
   */
  onSearchChange?: ((query: string) => void) | undefined;
  /** Shows the search field above the rows. */
  showSearch?: boolean | undefined;
  /** Starts a new conversation. Shows the New chat row. */
  onNew?: (() => void) | undefined;
  /** A heading above the rows, such as "Recents", which names the list unless a label is given. */
  heading?: ReactNode;
  /**
   * Requests the next conversations. Shows a Load more row below the rows and fades the last ones;
   * leave it out once there are no more. A returned promise keeps the row pending until it settles.
   */
  onLoadMore?: LoadMoreProps['onLoadMore'];
  /** Receives a failed `onLoadMore`, a throw or a rejected promise; without it the error is rethrown. */
  onLoadMoreError?: LoadMoreProps['onError'];
  /** The conversations are loading: placeholder rows stand in for them. */
  isLoading?: boolean | undefined;
  /** Shown while there are no conversations. Defaults to the provider's `noConversations` string. */
  emptyState?: ReactNode;
  /**
   * The `Menu` a row's context menu shows, opened by a secondary click, a long touch, the Context
   * Menu key or Shift+F10. A conversation it returns nothing for keeps the browser's own menu.
   */
  renderContextMenu?: ((conversation: ChatConversation) => ReactNode) | undefined;
}

/** The search text and its setter. The text searches only while its field shows: a hidden field could not clear it. */
function useSearchText(showSearch: boolean) {
  const [typed, setTyped] = useState('');
  return [showSearch ? typed : '', setTyped] as const;
}

/** The conversations the search keeps: all of them while the host searches or the text is blank. */
function useShownConversations(
  { conversations, onSearchChange }: Pick<ChatListProps, 'conversations' | 'onSearchChange'>,
  query: string,
) {
  const { contains } = useFilter({ sensitivity: 'base' });
  const text = query.trim();
  const isHostSearch = onSearchChange !== undefined;
  // Kept between renders: the list renders again as menus open and times move on.
  return useMemo(() => {
    if (isHostSearch || !text) return conversations;
    return conversations.filter(
      (conversation) =>
        contains(conversation.title, text) || contains(conversation.lastMessage ?? '', text),
    );
  }, [conversations, text, isHostSearch, contains]);
}

/**
 * The list's one context menu: the conversation it is open for, whether a conversation has one, the
 * target the rows open it through and the menu itself.
 */
function useConversationMenu(
  renderContextMenu: ChatListProps['renderContextMenu'],
  conversations: readonly ChatConversation[],
) {
  const strings = useUiStrings();
  const controller = useMenuController();
  const { isOpen } = useMenuControllerState(controller);
  const [menuKey, setMenuKey] = useState<string | null>(null);
  const [target] = useState<ChatListMenu>(() => ({
    controller,
    onOpen: setMenuKey,
    rows: new Map(),
  }));
  const conversation = isOpen ? conversations.find((entry) => entry.id === menuKey) : undefined;
  const content = conversation ? renderContextMenu?.(conversation) : undefined;
  const hasContent = !isEmptyNode(content);
  // A conversation that leaves the list, or loses its menu, takes its open menu with it.
  useEffect(() => {
    if (isOpen && !hasContent) controller.close();
  }, [isOpen, hasContent, controller]);
  return {
    target,
    onKeyDown: renderContextMenu
      ? (event: KeyboardEvent<HTMLElement>) => openRowMenu(target, event)
      : undefined,
    openKey: conversation && hasContent ? conversation.id : null,
    hasMenu: (entry: ChatConversation) => !isEmptyNode(renderContextMenu?.(entry)),
    element: renderContextMenu ? (
      <ContextMenu
        controller={controller}
        aria-label={conversation ? strings.conversationMenu(conversation.title) : undefined}
      >
        {hasContent ? content : null}
      </ContextMenu>
    ) : null,
  };
}

/** The one selected conversation, held by the caller (`selectedKey`) or by the list. */
function useConversationSelection(
  selectedKey: ChatListProps['selectedKey'],
  onSelectionChange: ChatListProps['onSelectionChange'],
) {
  const [ownSelection, setOwnSelection] = useState<string | null>(null);
  const selected = selectedKey === undefined ? ownSelection : selectedKey;
  return {
    selectedKeys: selected === null ? [] : [selected],
    select(keys: Selection) {
      const [key] = keys === 'all' ? [] : [...keys];
      if (key === undefined) return;
      setOwnSelection(String(key));
      onSelectionChange?.(String(key));
    },
  };
}

interface ConversationGridProps extends AriaLabellingProps {
  query: string;
  items: readonly ChatConversation[];
  selection: ReturnType<typeof useConversationSelection>;
  menu: ReturnType<typeof useConversationMenu>;
  isLoading: boolean;
  emptyState: ReactNode;
  timeOptions: Pick<ChatListProps, 'fallbackAfterDays' | 'getNow' | 'timeZone'>;
  /** The host's menu, on which whether each row has a menu depends. */
  renderContextMenu: ChatListProps['renderContextMenu'];
}

/** The grid list of rows, marking the search text, or what stands in for them. */
function ConversationGrid({
  query,
  items,
  selection,
  menu,
  isLoading,
  emptyState,
  timeOptions,
  renderContextMenu,
  ...labelling
}: ConversationGridProps) {
  const { fallbackAfterDays, getNow, timeZone } = timeOptions;
  return (
    <TextMatchProvider query={query} ignoreAccents>
      <GridList
        {...labelling}
        className={listHooks.slotClass('list')}
        items={items}
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={selection.selectedKeys}
        onSelectionChange={selection.select}
        dependencies={[renderContextMenu, menu.openKey, fallbackAfterDays, getNow, timeZone]}
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
            menu={menu.hasMenu(conversation) ? menu.target : undefined}
            isMenuOpen={menu.openKey === conversation.id}
            fallbackAfterDays={fallbackAfterDays}
            getNow={getNow}
            timeZone={timeZone}
          />
        )}
      </GridList>
    </TextMatchProvider>
  );
}

/**
 * A list of conversations to open: a New chat row, an optional search field and heading, a React Aria
 * grid list of rows with an icon or avatar, title, marks, activity, time, last message and unread
 * count, then a Load more row. One conversation is selected at a time; arrow keys move between rows,
 * and each row's context menu holds the host's commands for it.
 */
export function ChatList({
  conversations,
  selectedKey,
  onSelectionChange,
  onSearchChange,
  showSearch = false,
  onNew,
  heading,
  onLoadMore,
  onLoadMoreError,
  isLoading = false,
  emptyState,
  renderContextMenu,
  fallbackAfterDays,
  getNow,
  timeZone,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  className,
  ...rest
}: ChatListProps) {
  const strings = useUiStrings();
  const headingId = useId();
  const hasHeading = !isEmptyNode(heading);
  const [query, setQuery] = useSearchText(showSearch);
  const shown = useShownConversations({ conversations, onSearchChange }, query);
  const selection = useConversationSelection(selectedKey, onSelectionChange);
  const menu = useConversationMenu(renderContextMenu, shown);
  const labelledBy = ariaLabelledby ?? (hasHeading && !ariaLabel ? headingId : undefined);
  return (
    <div
      {...rest}
      {...listHooks.root({
        className,
        props: rest,
        data: { loading: isLoading, hasMore: Boolean(onLoadMore) },
      })}
      onKeyDown={menu.onKeyDown}
    >
      <ListHeader
        query={query}
        onSearch={(value) => {
          setQuery(value);
          onSearchChange?.(value);
        }}
        onNew={onNew}
        showSearch={showSearch}
      />
      <div {...listHooks.slot('body')}>
        {hasHeading ? (
          <div id={headingId} {...listHooks.slot('heading')}>
            {heading}
          </div>
        ) : null}
        <ConversationGrid
          query={query}
          items={isLoading ? [] : shown}
          selection={selection}
          menu={menu}
          isLoading={isLoading}
          emptyState={emptyState}
          aria-label={labelledBy ? undefined : (ariaLabel ?? strings.conversations)}
          aria-labelledby={labelledBy}
          timeOptions={{ fallbackAfterDays, getNow, timeZone }}
          renderContextMenu={renderContextMenu}
        />
        {onLoadMore && !isLoading ? (
          <LoadMore
            variant="ghost"
            size="md"
            onLoadMore={onLoadMore}
            onError={onLoadMoreError}
            className={listHooks.slotClass('load-more')}
          />
        ) : null}
      </div>
      {menu.element}
    </div>
  );
}

export type {
  ChatConversation,
  ChatConversationStatus,
  ChatListParticipant,
} from './chat-list-row.js';
