import type { ReactNode } from 'react';
import { useLocale } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import type { GlyphName } from '../../core/glyphs.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { formatAbsoluteTime } from '../../utils/relative-time.js';
import { Avatar, splitAvatarIdentity } from '../avatar/avatar.js';
import { Button } from '../button/button.js';
import { RelativeTime } from '../relative-time/relative-time.js';
import type { ChatMessageAuthor, ChatMessageDelivery, ChatMessageProps } from './chat-message.js';
import { ChatQuote } from './chat-quote.js';

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
> & {
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

const deliveryGlyphs: Record<ChatMessageDelivery, GlyphName> = {
  sending: 'clock',
  sent: 'check',
  delivered: 'success',
  read: 'eye',
  failed: 'error',
};

/** A message's time as the absolute date and time, for its accessible name. */
export function useAbsoluteTime(time: string | undefined): string | undefined {
  const { locale } = useLocale();
  return time ? (formatAbsoluteTime(time, locale) ?? undefined) : undefined;
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
    <div {...hooks.slot('header')}>
      {authorName === undefined ? null : <span {...hooks.slot('author')}>{authorName}</span>}
      <MessageTime time={time} getNow={getNow} />
    </div>
  );
}

function RetryButton({ onRetry }: { onRetry: () => void }) {
  const strings = useUiStrings();
  return (
    <Button
      size="sm"
      variant="secondary"
      startIcon="refresh"
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
export function ChatMessageFooter({
  time,
  getNow,
  isEdited,
  isCancelled,
  delivery,
  onRetry,
}: Partial<
  Pick<
    ChatMessageBodyProps,
    'time' | 'getNow' | 'isEdited' | 'isCancelled' | 'delivery' | 'onRetry'
  >
>) {
  const strings = useUiStrings();
  if (!time && !isEdited && !isCancelled && !delivery) return null;
  const timeOnly = !isEdited && !isCancelled && !delivery;
  return (
    <div {...hooks.slot('footer', { timeOnly })}>
      <MessageTime time={time} getNow={getNow} />
      {isEdited ? <span {...hooks.slot('edited')}>{strings.edited}</span> : null}
      {isCancelled ? <span {...hooks.slot('stopped')}>{strings.chatStopped}</span> : null}
      {delivery ? (
        <span {...hooks.slot('delivery')}>
          <Glyph name={deliveryGlyphs[delivery]} className={hooks.slotClass('delivery-icon')} />
          <span {...hooks.slot('delivery-label')}>{strings.chatDelivery(delivery)}</span>
        </span>
      ) : null}
      {delivery === 'failed' && onRetry ? <RetryButton onRetry={onRetry} /> : null}
    </div>
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
  reactions,
  actions,
  children,
  time,
  getNow,
}: ChatMessageBodyProps) {
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
      <div {...hooks.slot('content')}>{children}</div>
      <ChatMessageFooter
        time={time}
        getNow={getNow}
        isEdited={isEdited}
        isCancelled={isCancelled}
        delivery={delivery}
        onRetry={error ? undefined : onRetry}
      />
      {error ? (
        <div {...hooks.slot('error')}>
          <span role="alert">{error}</span>
          {onRetry ? <RetryButton onRetry={onRetry} /> : null}
        </div>
      ) : null}
      <ChatMessageSlot name="reactions">{reactions}</ChatMessageSlot>
      <ChatMessageSlot name="actions">{actions}</ChatMessageSlot>
    </>
  );
}
