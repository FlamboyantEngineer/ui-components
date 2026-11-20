import { createHooks } from '../../core/hooks.js';
import type { BaseProps, ContainerProps } from '../../core/props.js';

export type MessageAlign = 'start' | 'end';

export interface MessageProps extends ContainerProps<'article'>, BaseProps {
  /** Which side of the thread displays this message. Defaults to `start`. */
  align?: MessageAlign | undefined;
  /** Marks this article busy while its content streams. */
  isStreaming?: boolean | undefined;
}

export interface MessageContentProps extends ContainerProps<'div'>, BaseProps {}

export interface MessageFooterProps extends ContainerProps<'div'>, BaseProps {}

const hooks = createHooks('message', ['content', 'footer']);

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

/** The content of a message, such as text, attachments or one or more bubbles. */
export function MessageContent({ className, ...props }: MessageContentProps) {
  return <div {...props} {...hooks.slot('content', undefined, className)} />;
}

/** The message's metadata or actions, placed after its content in reading order. */
export function MessageFooter({ className, ...props }: MessageFooterProps) {
  return <div {...props} {...hooks.slot('footer', undefined, className)} />;
}
