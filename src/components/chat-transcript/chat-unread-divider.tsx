import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';

export type ChatUnreadDividerProps = BaseProps;

const hooks = createHooks('chat-unread-divider', ['label']);

/**
 * Marks where the messages the reader has not seen yet begin (`New messages`). It has no role, so
 * it may sit between the articles of a feed.
 */
export function ChatUnreadDivider({ className, ...rest }: ChatUnreadDividerProps) {
  const strings = useUiStrings();
  return (
    <div {...rest} {...hooks.root({ className, props: rest })}>
      <span {...hooks.slot('label')}>{strings.chatNewMessages}</span>
    </div>
  );
}
