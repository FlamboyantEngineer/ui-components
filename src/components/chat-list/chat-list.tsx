'use client';

import { type KeyboardEvent, type ReactNode, useEffect, useState } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { PlusGlyph } from '../../core/glyphs.js';
import type { BaseProps, RefProps, Selection } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { GridList, useFilter } from '../../primitives/index.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import type { AttributionProps } from '../attribution/attribution.js';
import { Button } from '../button/button.js';
import {
  ContextMenu,
  useMenuController,
  useMenuControllerState,
} from '../context-menu/context-menu.js';
import { EmptyState } from '../empty-state/empty-state.js';
import { SearchField } from '../search-field/search-field.js';
import { Skeleton, SkeletonText } from '../skeleton/skeleton.js';
import { TextMatchProvider } from '../text-match/text-match.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { type ChatListMenu, openRowMenu } from './chat-list-menu.js';
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
  /** Starts a new conversation. Shows the New chat button. */
  onNew?: (() => void) | undefined;
  /** The conversations are loading: placeholder rows stand in for them. */
  isLoading?: boolean | undefined;
  /** Shown while there are no conversations. Defaults to the provider's `noConversations` string. */
  emptyState?: ReactNode;
  /** Controls at the end of each row, such as a menu of the conversation's commands. */
  renderActions?: ((conversation: ChatConversation) => ReactNode) | undefined;
  /**
   * The `Menu` a row's context menu shows, opened by a secondary click, a long touch, the Context
   * Menu key or Shift+F10. A conversation it returns nothing for keeps the browser's own menu.
   */
  renderContextMenu?: ((conversation: ChatConversation) => ReactNode) | undefined;
}

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
  selectedKey,
  onSelectionChange,
  onSearchChange,
  onNew,
  isLoading = false,
  emptyState,
  renderActions,
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
  const [query, setQuery] = useState('');
  const shown = useShownConversations({ conversations, onSearchChange }, query);
  const selection = useConversationSelection(selectedKey, onSelectionChange);
  const menu = useConversationMenu(renderContextMenu, shown);
  return (
    <div
      {...rest}
      {...listHooks.root({ className, props: rest, data: { loading: isLoading } })}
      onKeyDown={menu.onKeyDown}
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
          selectedKeys={selection.selectedKeys}
          onSelectionChange={selection.select}
          dependencies={[
            renderActions,
            renderContextMenu,
            menu.openKey,
            fallbackAfterDays,
            getNow,
            timeZone,
          ]}
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
              menu={menu.hasMenu(conversation) ? menu.target : undefined}
              isMenuOpen={menu.openKey === conversation.id}
              fallbackAfterDays={fallbackAfterDays}
              getNow={getNow}
              timeZone={timeZone}
            />
          )}
        </GridList>
      </TextMatchProvider>
      {menu.element}
    </div>
  );
}

export type { ChatConversation, ChatListParticipant } from './chat-list-row.js';
