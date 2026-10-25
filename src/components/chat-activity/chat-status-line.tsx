import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { ActivityAnnouncer } from './activity-announcer.js';

export interface ChatStatusLineProps extends BaseProps {
  /** What the assistant is doing now, such as "Searching trains…". */
  text: string;
  /** The assistant is working; without it the line is gone. Defaults to `true`. */
  isRunning?: boolean | undefined;
}

const hooks = createHooks('chat-status-line', ['spinner', 'text']);

/**
 * One line saying what an assistant is doing while it works, with a decorative busy indicator. Its
 * text is announced politely as it changes, at most once every two seconds; the visible text stays
 * out of the accessibility tree so the reader hears it once. The line is gone once the work ends.
 */
export function ChatStatusLine({
  text,
  isRunning = true,
  className,
  ...rest
}: ChatStatusLineProps) {
  if (!isRunning) return null;
  return (
    <div {...rest} {...hooks.root({ className, props: rest })}>
      <span {...hooks.slot('spinner')} aria-hidden="true" />
      <span {...hooks.slot('text')} aria-hidden="true">
        {text}
      </span>
      <ActivityAnnouncer message={text} />
    </div>
  );
}
