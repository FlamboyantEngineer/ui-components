'use client';

import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Marker, MarkerContent } from '../marker/marker.js';

export type ChatUnreadDividerProps = RefProps<HTMLDivElement> & BaseProps;

const hooks = createHooks('chat-unread-divider', ['label']);

/**
 * A separator `Marker` that marks where the messages the reader has not seen yet begin (`New messages`). It has no role, so
 * it may sit between the articles of a feed.
 */
export function ChatUnreadDivider({ className, ...rest }: ChatUnreadDividerProps) {
  const strings = useUiStrings();
  return (
    <Marker {...rest} {...hooks.root({ className, props: rest })} variant="separator">
      <MarkerContent className={hooks.slotClass('label')}>{strings.chatNewMessages}</MarkerContent>
    </Marker>
  );
}
