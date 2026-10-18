import type { ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Avatar, getDisplayName, type AvatarIdentity } from '../avatar/avatar.js';
import { RelativeTime, type RelativeTimeProps } from '../relative-time/relative-time.js';

/** `sent` by the reader, `received` from someone else (a person or an assistant), or a `system` notice. */
export type ChatMessageOrigin = 'sent' | 'received' | 'system';

/** `complete`, still `streaming` in, or failed with an `error`. */
export type ChatMessageStatus = 'complete' | 'streaming' | 'error';

export interface ChatMessageProps extends BaseProps, Pick<RelativeTimeProps, 'getNow'> {
  /** Who the message is from, relative to the reader. Defaults to `received`. */
  origin?: ChatMessageOrigin | undefined;
  /** The person or assistant who wrote it, drawn as an avatar and a name. */
  author?: AvatarIdentity | undefined;
  /** When it was written: an ISO 8601 date and time, read relative to now. */
  time?: string | undefined;
  /** Defaults to `complete`. A streaming message is busy until it completes. */
  status?: ChatMessageStatus | undefined;
  /** Commands about the message, such as copy or retry. */
  actions?: ReactNode;
  /** The message's content, such as text or rendered markdown. */
  children?: ReactNode;
}

const hooks = createHooks('chat-message', [
  'avatar',
  'body',
  'header',
  'author',
  'time',
  'content',
  'actions',
]);

/** The author's name and the time, when either is known. */
function ChatMessageHeader({
  author,
  time,
  getNow,
}: Pick<ChatMessageProps, 'author' | 'time' | 'getNow'>) {
  const strings = useUiStrings();
  if (!author && !time) return null;
  return (
    <div {...hooks.slot('header')}>
      {author ? (
        <span {...hooks.slot('author')}>{getDisplayName(author.name, strings.unnamed)}</span>
      ) : null}
      {time ? (
        <RelativeTime value={time} getNow={getNow} className={hooks.slotClass('time')} />
      ) : null}
    </div>
  );
}

/**
 * One message in a conversation: an `<article>` with the author's avatar and name, a relative
 * time, the content and its actions. A streaming message is busy (`aria-busy`) so assistive
 * technology reads it once it completes.
 */
export function ChatMessage({
  origin = 'received',
  author,
  time,
  status = 'complete',
  actions,
  getNow,
  children,
  className,
  ...rest
}: ChatMessageProps) {
  return (
    <article
      {...rest}
      {...hooks.root({ className, data: { origin, status } })}
      aria-busy={status === 'streaming' || undefined}
    >
      {author ? (
        <Avatar {...author} size="sm" decorative className={hooks.slotClass('avatar')} />
      ) : null}
      <div {...hooks.slot('body')}>
        <ChatMessageHeader author={author} time={time} getNow={getNow} />
        <div {...hooks.slot('content')}>{children}</div>
        {actions ? <div {...hooks.slot('actions')}>{actions}</div> : null}
      </div>
    </article>
  );
}
