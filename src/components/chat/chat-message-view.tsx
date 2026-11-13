'use client';

import { memo, type ReactNode } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { isShallowEqual } from '../../utils/is-shallow-equal.js';
import { readOwn } from '../../utils/read-own.js';
import { ChatStatusLine } from '../chat-activity/chat-activity.js';
import {
  ChatMessageActionsMenu,
  type ChatMessageMenuIcons,
} from '../chat-message-actions/chat-message-actions.js';
import { type ChatMessageData, ChatParts, type ChatPartsProps } from '../chat-parts/chat-parts.js';
import {
  ChatMessage,
  type ChatMessageGroupPosition,
  type ChatQuoteData,
  type ChatReader,
  ChatReadReceipts,
} from '../chat-transcript/chat-transcript.js';
import { ReactionBar } from '../reaction-bar/reaction-bar.js';
import { type ChatCommandContext, toMessageCommands } from './chat-commands.js';
import { chatHooks as hooks } from './chat-hooks.js';
import {
  type ChatMessageDisplayOptions,
  showsStreamingCaret,
  toMessageVariant,
  toTimePlacement,
} from './chat-message-display.js';
import {
  type ChatThinkingUntil,
  readMessageText,
  toDisplayStatus,
  toExcerpt,
  toMessageAuthor,
  toMessageOrigin,
  toThinkingActivity,
} from './chat-model.js';

/** The `ChatParts` options a chat passes to every message unchanged. */
export type ChatPartOptions = Pick<
  ChatPartsProps,
  | 'textFormat'
  | 'expandsActivity'
  | 'toolRenderers'
  | 'onApprove'
  | 'onDeny'
  | 'onAlwaysAllow'
  | 'onAnswerQuestion'
  | 'onDismissQuestion'
  | 'questionAnsweredMark'
  | 'onApplyCode'
>;

/**
 * The options a message calls while it renders. A message draws with the ones of the render it
 * renders in, but a new function alone does not render a message again.
 */
interface ChatRenderOptions extends Pick<
  ChatPartsProps,
  'toolRenderers' | 'renderPart' | 'getReference'
> {
  getNow: (() => Date) | undefined;
}

/** What every message of a chat shares; it keeps its identity while the chat's options do. */
export interface ChatMessageContext extends ChatCommandContext {
  /** The conversation shown; its parts start afresh when it changes. */
  conversationId: string | undefined;
  parts: ChatPartOptions;
  onRetry: ((messageId: string) => void) | undefined;
  messageMenuIcons: ChatMessageMenuIcons | undefined;
  thinkingText: string | undefined;
  thinkingIcon: ReactNode;
  thinkingUntil: ChatThinkingUntil;
  onQuotePress: (messageId: string) => void;
  onExpandedPartsChange: (messageId: string, expanded: Record<string, boolean>) => void;
}

interface ChatMessageViewProps {
  message: ChatMessageData;
  groupPosition: ChatMessageGroupPosition;
  /** The message this one replies to, when it is loaded. */
  quoted: ChatMessageData | undefined;
  /** The participants who read up to this message. */
  readers: readonly ChatReader[] | undefined;
  /** The reader's open and closed choices of the message's parts. */
  expandedParts: Readonly<Record<string, boolean>> | undefined;
  context: ChatMessageContext;
  rendering: ChatRenderOptions;
  /** Whether the message shows its author's avatar and name, its time and its background. */
  display: ChatMessageDisplayOptions;
}

/** The quote of the message replied to: its author and the start of its text. */
function useQuote(
  quoted: ChatMessageData | undefined,
  context: ChatMessageContext,
): ChatQuoteData | undefined {
  const strings = useUiStrings();
  if (!quoted) return undefined;
  const author = context.participants.get(quoted.authorId ?? '');
  const excerpt = quoted.isDeleted
    ? strings.chatMessageDeleted
    : toExcerpt(readMessageText(quoted));
  return { authorName: author?.name ?? '', excerpt, messageId: quoted.id };
}

/** The reactions, which the reader toggles in chats between people. */
function MessageReactions({ message, context }: Pick<ChatMessageViewProps, 'message' | 'context'>) {
  const { react } = context.handlers;
  const canReact = react !== undefined && !context.isAssistantChat;
  return (
    <ReactionBar
      reactions={message.reactions ?? []}
      onToggle={canReact ? (emoji, isReacted) => react(message.id, emoji, isReacted) : undefined}
    />
  );
}

/** What the assistant is thinking or doing in its reply that streams, while it does. */
function ThinkingLine({ message, context }: Pick<ChatMessageViewProps, 'message' | 'context'>) {
  const activity = toThinkingActivity(message, context.thinkingUntil);
  if (!activity) return null;
  return (
    <ChatStatusLine
      className={hooks.slotClass('status')}
      text={message.statusText || context.thinkingText}
      icon={context.thinkingIcon}
      activity={activity}
    />
  );
}

const renderOptionKeys = ['renderPart', 'getReference', 'getNow', 'toolRenderers'] as const;

/** Whether two sets of render options draw a message alike: the same options and tool layouts. */
function drawsAlike(before: ChatRenderOptions, after: ChatRenderOptions): boolean {
  const isSameSet = renderOptionKeys.every(
    (key) => (before[key] === undefined) === (after[key] === undefined),
  );
  if (!isSameSet) return false;
  const tools = Object.entries(before.toolRenderers ?? {});
  const next = after.toolRenderers ?? {};
  return (
    tools.length === Object.keys(next).length &&
    tools.every(([name, renderer]) => readOwn(next, name)?.replaces === renderer.replaces)
  );
}

/** A message renders again when its props change, or when its render options change shape. */
function isSameView(before: ChatMessageViewProps, after: ChatMessageViewProps): boolean {
  const { rendering: beforeRendering, ...beforeRest } = before;
  const { rendering: afterRendering, ...afterRest } = after;
  return isShallowEqual(beforeRest, afterRest) && drawsAlike(beforeRendering, afterRendering);
}

/**
 * One message of a chat: its author, time, status, delivery and quote, its parts, reactions and
 * readers, and the commands the chat offers for it in an action bar and a context menu.
 */
export const ChatMessageView = memo(function ChatMessageView({
  message,
  groupPosition,
  quoted,
  readers,
  expandedParts,
  context,
  rendering,
  display,
}: ChatMessageViewProps) {
  const { getNow, toolRenderers, renderPart, getReference } = rendering;
  const participant = context.participants.get(message.authorId ?? '');
  const quote = useQuote(quoted, context);
  const { onRetry } = context;
  const canRetry = message.status === 'error' || message.delivery === 'failed';
  const id = message.id;
  const origin = toMessageOrigin(message, context.currentUserId);
  return (
    <ChatMessageActionsMenu
      {...toMessageCommands(message, context)}
      menuIcons={context.messageMenuIcons}
    >
      {(actions) => (
        <ChatMessage
          id={id}
          origin={origin}
          author={participant ? toMessageAuthor(participant) : undefined}
          showAvatar={display.showAvatars}
          showAuthorName={display.showAuthorNames}
          timePlacement={toTimePlacement(message, display)}
          collapseFooterTime={display.collapseFooterTime}
          streamingCaret={showsStreamingCaret(
            message,
            display,
            participant?.kind === 'assistant' &&
              toThinkingActivity(message, context.thinkingUntil) !== undefined,
          )}
          variant={toMessageVariant(origin, display)}
          time={message.createdAt}
          getNow={getNow}
          status={toDisplayStatus(message)}
          groupPosition={groupPosition}
          delivery={message.delivery}
          deliveryPresentation={display.deliveryPresentation}
          error={message.error}
          onRetry={onRetry && canRetry ? () => onRetry(id) : undefined}
          isEdited={message.isEdited}
          isDeleted={message.isDeleted}
          quote={quote}
          onQuotePress={context.onQuotePress}
          reactions={
            message.reactions?.length ? (
              <MessageReactions message={message} context={context} />
            ) : undefined
          }
          readers={readers?.length ? <ChatReadReceipts readers={readers} /> : undefined}
          actions={actions}
        >
          <ChatParts
            // A card's drafts and requests belong to one conversation, even where ids repeat.
            key={context.conversationId}
            {...context.parts}
            {...{ toolRenderers, renderPart, getReference }}
            parts={message.parts}
            messageId={id}
            isStreaming={message.status === 'streaming'}
            expandedParts={expandedParts}
            onExpandedPartsChange={(expanded) => context.onExpandedPartsChange(id, expanded)}
          />
          {participant?.kind === 'assistant' ? (
            <ThinkingLine message={message} context={context} />
          ) : null}
        </ChatMessage>
      )}
    </ChatMessageActionsMenu>
  );
}, isSameView);
