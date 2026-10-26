import { useMemo, type ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import type { ChatMessageData, ChatParticipant } from '../chat-parts/chat-parts.js';
import {
  ChatDateSeparator,
  ChatTranscript,
  ChatTypingIndicator,
  ChatUnreadDivider,
  groupChatMessages,
  type ChatTranscriptProps,
  type ChatTranscriptScrollMode,
} from '../chat-transcript/chat-transcript.js';
import { TextMatchProvider } from '../text-match/text-match.js';
import { ChatComposer, type ChatComposerOptions } from './chat-composer.js';
import { ChatHeader } from './chat-header.js';
import { chatHooks as hooks } from './chat-hooks.js';
import { ChatMessageView, type ChatMessageContext } from './chat-message-view.js';
import {
  findStatusText,
  hasAssistant,
  indexParticipants,
  listReaders,
  listTypingNames,
  type ChatParticipantIndex,
} from './chat-model.js';
import { ChatSearchBar, ChatSearchToggle, useChatSearch } from './chat-search.js';
import { useChatState, type ChatState } from './use-chat-state.js';
import { useMessageContext, type ChatMessageOptions } from './use-message-context.js';

export { ChatHeader } from './chat-header.js';
export type { ChatHeaderProps } from './chat-header.js';
export type { ChatMessageTextHandler } from './chat-composer.js';

export interface ChatProps
  extends
    BaseProps,
    AriaLabellingProps,
    ChatComposerOptions,
    ChatMessageOptions,
    Pick<
      ChatTranscriptProps,
      | 'emptyState'
      | 'virtualized'
      | 'onLoadOlder'
      | 'hasOlder'
      | 'isLoadingOlder'
      | 'firstUnreadId'
      | 'onRead'
    > {
  /** The conversation, oldest first. */
  messages: readonly ChatMessageData[];
  /** Everyone who takes part, the reader included. An assistant among them makes an assistant chat. */
  participants: readonly ChatParticipant[];
  /** `anchor` keeps the reader's sent message at the top while the reply fills in below; `follow` keeps the latest in view. Defaults to `anchor` in an assistant chat, else `follow`. */
  scrollMode?: ChatTranscriptScrollMode | undefined;
  /** The message each participant has read up to, by participant id; their avatars show under it. */
  readPositions?: Readonly<Record<string, string>> | undefined;
  /** The participants typing now. */
  typingIds?: readonly string[] | undefined;
  /** The conversation's name; shows the header. */
  title?: string | undefined;
  /** Controls at the end of the header, such as the conversation's commands; shows the header. */
  headerActions?: ReactNode;
  /** Offers the search within the conversation in the header; shows the header. */
  showSearch?: boolean | undefined;
}

interface ChatModel {
  props: ChatProps;
  participants: ChatParticipantIndex;
  context: ChatMessageContext;
}

/** The transcript's children: date separators, the unread divider and the messages. */
function useSequence(
  { props, context }: Omit<ChatModel, 'participants'>,
  expanded: ChatState['expanded'],
) {
  const { messages, firstUnreadId, readPositions, currentUserId } = props;
  const { participants } = context;
  const items = useMemo(
    () => groupChatMessages(messages, { firstUnreadId }),
    [messages, firstUnreadId],
  );
  const byId = useMemo(() => new Map(messages.map((message) => [message.id, message])), [messages]);
  const readers = useMemo(
    () => listReaders(readPositions, participants, currentUserId),
    [readPositions, participants, currentUserId],
  );
  return items.map((item) => {
    if (item.kind === 'date') {
      return <ChatDateSeparator key={item.key} date={item.date} getNow={context.getNow} />;
    }
    if (item.kind === 'unread') return <ChatUnreadDivider key={item.key} />;
    const { message } = item;
    return (
      <ChatMessageView
        key={item.key}
        message={message}
        groupPosition={item.groupPosition}
        quoted={message.replyTo === undefined ? undefined : byId.get(message.replyTo)}
        readers={readers.get(message.id)}
        expandedParts={expanded[message.id]}
        context={context}
      />
    );
  });
}

/** Who is typing, below the transcript. */
function ChatTyping({ props, participants }: Omit<ChatModel, 'context'>) {
  return (
    <ChatTypingIndicator
      className={hooks.slotClass('typing')}
      names={listTypingNames(props.typingIds, participants, props.currentUserId)}
    />
  );
}

/** The header's line: who is typing, else what the assistant is doing. */
function useHeaderStatus({ props, participants }: Omit<ChatModel, 'context'>) {
  const strings = useUiStrings();
  const typing = listTypingNames(props.typingIds, participants, props.currentUserId);
  return typing.length > 0 ? strings.chatTyping(typing) : findStatusText(props.messages);
}

/**
 * A whole conversation from the host's messages and callbacks: an optional header with the
 * participants, search and the host's controls; the transcript with date separators, grouping, the
 * unread divider, read receipts and each message's parts and commands, and in a reply that streams
 * what the assistant is thinking or doing; who is typing; the queue of follow-ups; and the rich
 * composer, with an optional model picker among its tools. It serves assistant chats (streaming, tool calls, approvals, questions)
 * and chats between people alike, and holds no conversation state of its own: spread a
 * `useChatController`'s `props` into it, or pass your own.
 */
export function Chat(props: ChatProps) {
  const { messages, participants: list, currentUserId, className, id } = props;
  const participants = useMemo(() => indexParticipants(list), [list]);
  const isAssistantChat = useMemo(() => hasAssistant(list), [list]);
  const state = useChatState(props.conversationId);
  const search = useChatSearch(messages);
  const context = useMessageContext(props, state, { participants, isAssistantChat });
  const sequence = useSequence({ props, context }, state.expanded);
  const headerStatus = useHeaderStatus({ props, participants });
  const showHeader = Boolean(props.title || props.headerActions || props.showSearch);
  const others = list.filter((participant) => participant.id !== currentUserId);
  const {
    'aria-label': ariaLabel,
    'aria-labelledby': labelledBy,
    'aria-describedby': describedBy,
    'aria-details': details,
  } = props;
  return (
    <div id={id} {...hooks.root({ className, props })}>
      {showHeader ? (
        <ChatHeader
          title={props.title ?? ''}
          participants={others}
          status={headerStatus}
          actions={
            <>
              {props.showSearch ? <ChatSearchToggle search={search} /> : null}
              {props.headerActions}
            </>
          }
        />
      ) : null}
      <ChatSearchBar search={search} />
      <TextMatchProvider query={search.query} ignoreAccents>
        <ChatTranscript
          className={hooks.slotClass('transcript')}
          aria-label={ariaLabel ?? (labelledBy ? undefined : props.title || undefined)}
          aria-labelledby={labelledBy}
          aria-describedby={describedBy}
          aria-details={details}
          emptyState={props.emptyState}
          scrollMode={props.scrollMode ?? (isAssistantChat ? 'anchor' : 'follow')}
          onEscape={props.onSend ? () => state.composerRef.current?.focus() : undefined}
          onLoadOlder={props.onLoadOlder}
          hasOlder={props.hasOlder}
          isLoadingOlder={props.isLoadingOlder}
          highlightedMessageId={search.highlightedId ?? state.jumpedId}
          firstUnreadId={props.firstUnreadId}
          onRead={props.onRead}
          virtualized={props.virtualized}
        >
          {sequence}
        </ChatTranscript>
      </TextMatchProvider>
      <ChatTyping props={props} participants={participants} />
      <ChatComposer
        options={props}
        state={state}
        messages={messages}
        participants={participants}
        currentUserId={currentUserId}
        isAssistantChat={isAssistantChat}
      />
    </div>
  );
}
