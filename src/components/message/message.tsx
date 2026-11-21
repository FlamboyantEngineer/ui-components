import { createHooks } from '../../core/hooks.js';
import type { BaseProps, ContainerProps } from '../../core/props.js';

export type MessageAlign = 'start' | 'end';

export interface MessageGroupProps extends ContainerProps<'div'>, BaseProps {}

export interface MessageProps extends ContainerProps<'article'>, BaseProps {
  /** Which side of the thread displays this message. Defaults to `start`. */
  align?: MessageAlign | undefined;
  /** Marks this article busy while its content streams. */
  isStreaming?: boolean | undefined;
}

export interface MessageAvatarProps extends ContainerProps<'div'>, BaseProps {}

export interface MessageHeaderProps extends ContainerProps<'div'>, BaseProps {}

export interface MessageContentProps extends ContainerProps<'div'>, BaseProps {}

export interface MessageFooterProps extends ContainerProps<'div'>, BaseProps {}

const hooks = createHooks('message', ['avatar', 'header', 'content', 'footer'], {
  root: 'message',
  avatar: 'message-avatar',
  header: 'message-header',
  content: 'message-content',
  footer: 'message-footer',
});
const groupHooks = createHooks('message-group', [], { root: 'message-group' });

/** Consecutive messages of one author, such as one turn of a conversation. */
export function MessageGroup({ className, ...props }: MessageGroupProps) {
  return <div {...props} {...groupHooks.root({ className })} />;
}

/** One message, whose content, label and controls come from the caller. */
export function Message({
  align = 'start',
  isStreaming = false,
  'aria-busy': busy,
  className,
  ...props
}: MessageProps) {
  return (
    <article
      {...props}
      {...hooks.root({ className, data: { align, streaming: isStreaming } })}
      aria-busy={busy ?? (isStreaming || undefined)}
    />
  );
}

/** The author's picture or initials beside the message, such as an `Avatar`. */
export function MessageAvatar({ className, ...props }: MessageAvatarProps) {
  return <div {...props} {...hooks.slot('avatar', undefined, className)} />;
}

/** The author's name, the time or other metadata before the message's body. */
export function MessageHeader({ className, ...props }: MessageHeaderProps) {
  return <div {...props} {...hooks.slot('header', undefined, className)} />;
}

/** The content of a message, such as text, attachments or one or more bubbles. */
export function MessageContent({ className, ...props }: MessageContentProps) {
  return <div {...props} {...hooks.slot('content', undefined, className)} />;
}

/** The message's metadata or actions, placed after its content in reading order. */
export function MessageFooter({ className, ...props }: MessageFooterProps) {
  return <div {...props} {...hooks.slot('footer', undefined, className)} />;
}
