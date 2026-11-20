'use client';

import type { ReactNode } from 'react';
import { useTimeZone } from '../../core/clock.js';
import {
  CheckGlyph,
  ClockGlyph,
  ErrorGlyph,
  EyeGlyph,
  type GlyphComponent,
  RefreshGlyph,
  SuccessGlyph,
} from '../../core/glyphs.js';
import { createHooks } from '../../core/hooks.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { useLocale } from '../../primitives/index.js';
import { formatAbsoluteTime } from '../../utils/relative-time.js';
import { Avatar, splitAvatarIdentity } from '../avatar/avatar.js';
import { Bubble, BubbleContent, type BubbleVariant } from '../bubble/bubble.js';
import { Button } from '../button/button.js';
import { MessageFooter, MessageHeader } from '../message/message.js';
import { RelativeTime } from '../relative-time/relative-time.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import type {
  ChatMessageAuthor,
  ChatMessageDelivery,
  ChatMessageOrigin,
  ChatMessageProps,
  ChatMessageVariant,
} from './chat-message.js';
import { ChatQuote } from './chat-quote.js';
import { useIsInTranscript, useTranscriptContentRef } from './transcript-context.js';

type ChatMessageBodyProps = Pick<
  ChatMessageProps,
  | 'quote'
  | 'onQuotePress'
  | 'error'
  | 'isEdited'
  | 'reactions'
  | 'actions'
  | 'children'
  | 'time'
  | 'getNow'
  | 'deliveryPresentation'
  | 'isDeleted'
> & {
  origin: ChatMessageOrigin;
  variant: ChatMessageVariant;
  isCancelled: boolean;
  delivery: ChatMessageDelivery | undefined;
  onRetry: (() => void) | undefined;
};

export const chatMessageHooks = createHooks('chat-message', [
  'avatar',
  'body',
  'header',
  'author',
  'time',
  'quote',
  'content',
  'footer',
  'edited',
  'stopped',
  'delivery',
  'delivery-icon',
  'delivery-label',
  'error',
  'retry',
  'reactions',
  'readers',
  'actions',
]);

const hooks = chatMessageHooks;

const deliveryGlyphs: Record<ChatMessageDelivery, GlyphComponent> = {
  sending: ClockGlyph,
  sent: CheckGlyph,
  delivered: SuccessGlyph,
  read: EyeGlyph,
  failed: ErrorGlyph,
};

/**
 * A message's time as the absolute date and time, for its accessible name, in the reader's zone
 * (`useTimeZone`), so a server render and its hydration agree.
 */
export function useAbsoluteTime(time: string | undefined): string | undefined {
  const { locale } = useLocale();
  const timeZone = useTimeZone();
  return time ? (formatAbsoluteTime(time, locale, { timeZone }) ?? undefined) : undefined;
}

/** The author's avatar, marked and named with their presence when they have one. */
export function ChatMessageAvatar({ author }: { author: ChatMessageAuthor }) {
  const [identity, { status, statusLabel }] = splitAvatarIdentity(author);
  return (
    <Avatar
      {...identity}
      status={status}
      statusLabel={statusLabel}
      size="sm"
      decorative={!status?.trim()}
      className={hooks.slotClass('avatar')}
    />
  );
}

/** The message's time, read relative to now. */
function MessageTime({ time, getNow }: Pick<ChatMessageProps, 'time' | 'getNow'>) {
  return time ? (
    <RelativeTime value={time} getNow={getNow} className={hooks.slotClass('time')} />
  ) : null;
}

/** The author's name (at the start of a group) and the time, when either is shown. */
export function ChatMessageHeader({
  authorName,
  time,
  getNow,
}: Pick<ChatMessageProps, 'time' | 'getNow'> & { authorName: string | undefined }) {
  if (authorName === undefined && !time) return null;
  return (
    <MessageHeader className={hooks.slotClass('header')}>
      {authorName === undefined ? null : <span {...hooks.slot('author')}>{authorName}</span>}
      <MessageTime time={time} getNow={getNow} />
    </MessageHeader>
  );
}

function RetryButton({ onRetry }: { onRetry: () => void }) {
  const strings = useUiStrings();
  return (
    <Button
      size="sm"
      variant="secondary"
      startIcon={RefreshGlyph}
      className={hooks.slotClass('retry')}
      onPress={() => onRetry()}
    >
      {strings.retry}
    </Button>
  );
}

/**
 * The time placed in the footer, the edited marker, the stopped marker and the delivery status,
 * with Retry for a failed send.
 */
function ChatMessageFooter({
  time,
  getNow,
  isEdited,
  isCancelled,
  delivery,
  deliveryPresentation,
  onRetry,
}: Partial<
  Pick<
    ChatMessageBodyProps,
    'time' | 'getNow' | 'isEdited' | 'isCancelled' | 'delivery' | 'deliveryPresentation' | 'onRetry'
  >
>) {
  const strings = useUiStrings();
  if (!time && !isEdited && !isCancelled && !delivery) return null;
  const timeOnly = !isEdited && !isCancelled && !delivery;
  return (
    <MessageFooter {...hooks.slot('footer', { timeOnly })}>
      <MessageTime time={time} getNow={getNow} />
      {isEdited ? <span {...hooks.slot('edited')}>{strings.edited}</span> : null}
      {isCancelled ? <span {...hooks.slot('stopped')}>{strings.chatStopped}</span> : null}
      {delivery === 'sending' && deliveryPresentation === 'fade' ? (
        <VisuallyHidden as="span" className={hooks.slotClass('delivery')}>
          {strings.chatDelivery(delivery)}
        </VisuallyHidden>
      ) : delivery ? (
        <span {...hooks.slot('delivery')}>
          <Glyph icon={deliveryGlyphs[delivery]} className={hooks.slotClass('delivery-icon')} />
          <span {...hooks.slot('delivery-label')}>{strings.chatDelivery(delivery)}</span>
        </span>
      ) : null}
      {delivery === 'failed' && onRetry ? <RetryButton onRetry={onRetry} /> : null}
    </MessageFooter>
  );
}

/**
 * The bubble a message's content sits in: the reader's own messages on a `secondary` surface at the
 * end, other people's on an `outline` one, and plain messages and notices on a `ghost` one, text on
 * the page.
 */
function toBubbleVariant(origin: ChatMessageOrigin, variant: ChatMessageVariant): BubbleVariant {
  if (variant === 'plain' || origin === 'system') return 'ghost';
  return origin === 'sent' ? 'secondary' : 'outline';
}

/** The message's content in its bubble; the transcript announces the content's text. */
function MessageBubble({
  origin,
  variant,
  children,
}: Pick<ChatMessageBodyProps, 'origin' | 'variant' | 'children'>) {
  const contentRef = useTranscriptContentRef();
  return (
    <Bubble
      ref={contentRef}
      align={origin === 'sent' ? 'end' : 'start'}
      variant={toBubbleVariant(origin, variant)}
      className={hooks.slotClass('content')}
    >
      <BubbleContent>{children}</BubbleContent>
    </Bubble>
  );
}

/** A slot that renders only when it has content. */
function ChatMessageSlot({
  name,
  children,
}: {
  name: 'reactions' | 'actions';
  children: ReactNode;
}) {
  return children ? <div {...hooks.slot(name)}>{children}</div> : null;
}

/**
 * Everything a message that is not deleted shows under its header: the quote, the content, the
 * footer, the error with Retry, the reactions and the actions.
 */
export function ChatMessageBody({
  quote,
  onQuotePress,
  error,
  onRetry,
  isEdited,
  isCancelled,
  delivery,
  deliveryPresentation,
  reactions,
  actions,
  children,
  isDeleted,
  time,
  getNow,
  origin,
  variant,
}: ChatMessageBodyProps) {
  const strings = useUiStrings();
  // A transcript announces the failure through its own live region, once: an alert here would be
  // read again each time a virtualized transcript mounts the message.
  const isInTranscript = useIsInTranscript();
  if (isDeleted)
    return (
      <>
        <MessageBubble origin={origin} variant={variant}>
          {strings.chatMessageDeleted}
        </MessageBubble>
        <ChatMessageFooter time={time} getNow={getNow} />
      </>
    );
  const quotedId = quote?.messageId;
  return (
    <>
      {quote ? (
        <ChatQuote
          authorName={quote.authorName}
          excerpt={quote.excerpt}
          className={hooks.slotClass('quote')}
          onPress={quotedId && onQuotePress ? () => onQuotePress(quotedId) : undefined}
        />
      ) : null}
      <MessageBubble origin={origin} variant={variant}>
        {children}
      </MessageBubble>
      <ChatMessageFooter
        time={time}
        getNow={getNow}
        isEdited={isEdited}
        isCancelled={isCancelled}
        delivery={delivery}
        deliveryPresentation={deliveryPresentation}
        onRetry={error ? undefined : onRetry}
      />
      {error ? (
        <div {...hooks.slot('error')}>
          <span role={isInTranscript ? undefined : 'alert'}>{error}</span>
          {onRetry ? <RetryButton onRetry={onRetry} /> : null}
        </div>
      ) : null}
      <ChatMessageSlot name="reactions">{reactions}</ChatMessageSlot>
      <ChatMessageSlot name="actions">{actions}</ChatMessageSlot>
    </>
  );
}
