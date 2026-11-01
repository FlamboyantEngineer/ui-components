'use client';

import type { ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { ScrollRegion } from '../scroll-region/scroll-region.js';
import { TranscriptAnnouncerRegion } from './transcript-announcer.js';
import { TranscriptContext } from './transcript-context.js';
import { transcriptHooks as hooks } from './transcript-hooks.js';
import {
  handleTranscriptBlur,
  handleTranscriptFocus,
  handleTranscriptKeyDown,
  handleTranscriptTab,
} from './transcript-keyboard.js';
import {
  renderTranscriptItems,
  TranscriptHistory,
  TranscriptJumpButton,
  TranscriptUnreadBar,
} from './transcript-parts.js';
import type { ChatTranscriptScrollMode } from './transcript-runtime.js';
import { useTranscript, type TranscriptModel } from './use-transcript.js';

export type { ChatTranscriptScrollMode } from './transcript-runtime.js';

/** `framed` draws the transcript on its own canvas; `embedded` uses the surface it sits in. */
export type ChatTranscriptPresentation = 'framed' | 'embedded';

export interface ChatTranscriptProps extends BaseProps, AriaLabellingProps {
  /** The messages, usually `ChatMessage` elements with an `id` each, oldest first. */
  children?: ReactNode;
  /** Shown while there are no messages, such as suggested first questions. */
  emptyState?: ReactNode;
  /** `follow` (default) keeps the latest message in view; `anchor` keeps the reader's sent message at the top while the reply fills in below. */
  scrollMode?: ChatTranscriptScrollMode | undefined;
  /** `framed` (default) gives the transcript its own frame; `embedded` drops it, for a transcript that fills a panel or tab. */
  presentation?: ChatTranscriptPresentation | undefined;
  /** Called on Escape from a message, for example to move focus to the composer. */
  onEscape?: (() => void) | undefined;
  /** Called when the reader nears the top while `hasOlder`, to load older messages. */
  onLoadOlder?: (() => void) | undefined;
  /** Older messages remain to be loaded. */
  hasOlder?: boolean | undefined;
  /** Older messages are loading. */
  isLoadingOlder?: boolean | undefined;
  /** The message to scroll to, mark and focus, such as a search result. */
  highlightedMessageId?: string | undefined;
  /** The first message the reader has not read. */
  firstUnreadId?: string | undefined;
  /** Called with the newest message that has been in view or focused, once it settles. */
  onRead?: ((lastSeenId: string) => void) | undefined;
  /** Mount only the messages near the view, for very long histories. */
  virtualized?: boolean | undefined;
}

/** The feed of messages: one tab stop, with the keyboard model and the children to draw. */
function TranscriptFeed({
  model,
  isLoadingOlder,
  labelling,
}: {
  model: TranscriptModel;
  isLoadingOlder: boolean;
  labelling: AriaLabellingProps;
}) {
  const { runtime, navigation } = model;
  const { registry, feed, windowModel } = runtime;
  return (
    <TranscriptContext value={registry}>
      <div
        {...labelling}
        {...hooks.slot('feed')}
        ref={feed}
        role="feed"
        aria-busy={isLoadingOlder || undefined}
        onKeyDown={(event) => handleTranscriptKeyDown(event, navigation)}
        onKeyDownCapture={(event) => handleTranscriptTab(event, navigation)}
        onFocus={(event) => handleTranscriptFocus(event, navigation)}
        onBlur={(event) => handleTranscriptBlur(event, navigation)}
      >
        {renderTranscriptItems(model.items, model.mounted, windowModel)}
      </div>
    </TranscriptContext>
  );
}

/** The feed's labelling: the caller's, named by the provider's `conversation` string by default. */
function useFeedLabelling(labelling: AriaLabellingProps): AriaLabellingProps {
  const strings = useUiStrings();
  const { 'aria-label': ariaLabel, 'aria-labelledby': labelledBy } = labelling;
  return {
    ...labelling,
    'aria-label': labelledBy ? ariaLabel : (ariaLabel ?? strings.conversation),
  };
}

/**
 * A conversation: a `feed` of messages, one tab stop, that follows the latest message (or
 * anchors the reader's sent message at the top), keeps the reader's place as older history loads,
 * announces new messages through its own live region, marks the unread and can virtualize a very
 * long history.
 */
export function ChatTranscript({
  children,
  emptyState,
  scrollMode = 'follow',
  presentation = 'framed',
  onEscape,
  onLoadOlder,
  hasOlder = false,
  isLoadingOlder = false,
  highlightedMessageId,
  firstUnreadId,
  onRead,
  virtualized = false,
  className,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': labelledBy,
  'aria-describedby': describedBy,
  'aria-details': details,
  ...rest
}: ChatTranscriptProps) {
  const model = useTranscript({
    ...{ children, scrollMode, onEscape, onLoadOlder, hasOlder, isLoadingOlder },
    ...{ highlightedMessageId, firstUnreadId, onRead, virtualized },
  });
  const isEmpty = model.items.length === 0;
  const { ui, runtime } = model;
  const { viewport, spacer } = runtime;
  const labelling = useFeedLabelling({
    'aria-label': ariaLabel,
    'aria-labelledby': labelledBy,
    'aria-describedby': describedBy,
    'aria-details': details,
  });
  return (
    <div
      {...hooks.root({
        className,
        props: rest,
        data: { presentation, empty: isEmpty, virtualized },
      })}
      id={id}
    >
      {ui.isUnreadAbove && model.unreadCount > 0 ? (
        <TranscriptUnreadBar count={model.unreadCount} onJump={model.jumpToUnread} />
      ) : null}
      <ScrollRegion ref={viewport} className={hooks.slotClass('log')} onScroll={model.onScroll}>
        {hasOlder || isLoadingOlder ? <TranscriptHistory isLoading={isLoadingOlder} /> : null}
        {isEmpty ? (
          emptyState ? (
            <div {...hooks.slot('empty')}>{emptyState}</div>
          ) : null
        ) : (
          <TranscriptFeed model={model} isLoadingOlder={isLoadingOlder} labelling={labelling} />
        )}
        {scrollMode === 'anchor' ? <div {...hooks.slot('spacer')} ref={spacer} /> : null}
      </ScrollRegion>
      {ui.isAway ? (
        <TranscriptJumpButton unseenCount={ui.unseenCount} onJump={model.jumpToLatest} />
      ) : null}
      <TranscriptAnnouncerRegion text={model.announcement} />
    </div>
  );
}

export { ChatMessage } from './chat-message.js';
export type {
  ChatMessageAuthor,
  ChatMessageDelivery,
  ChatMessageGroupPosition,
  ChatMessageVariant,
  ChatMessageTimePlacement,
  ChatMessageOrigin,
  ChatMessageProps,
  ChatMessageStatus,
} from './chat-message.js';
export { ChatQuote } from './chat-quote.js';
export type { ChatQuoteData, ChatQuoteProps } from './chat-quote.js';
export { ChatDateSeparator } from './chat-date-separator.js';
export { ChatUnreadDivider } from './chat-unread-divider.js';
export { ChatTypingIndicator } from './chat-typing-indicator.js';
export { ChatReadReceipts } from './chat-read-receipts.js';
export type { ChatReader } from './chat-read-receipts.js';
export { groupChatMessages } from './chat-grouping.js';
export type { ChatSequenceItem } from './chat-grouping.js';
