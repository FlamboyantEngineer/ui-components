'use client';

import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { AvatarGroup, type AvatarGroupPerson } from '../avatar-group/avatar-group.js';
import { getDisplayName } from '../avatar/avatar.js';

/** Someone who has read up to a message. */
export type ChatReader = AvatarGroupPerson;

export interface ChatReadReceiptsProps extends RefProps<HTMLSpanElement>, BaseProps {
  /** Who has read up to this message, in the order they read it. */
  readers: readonly ChatReader[];
  /** Show at most this many avatars; the rest join the `+N` count. Defaults to 3. */
  maxVisible?: number | undefined;
}

const hooks = createHooks('chat-read-receipts');

/**
 * The avatars of the people who have read up to a message, under the last message each of them
 * read in a group conversation: a group named `Seen by Ana, Ben and 3 others`, whose avatars form
 * a button that lists everyone in a popover.
 */
export function ChatReadReceipts({
  readers,
  maxVisible = 3,
  className,
  ...rest
}: ChatReadReceiptsProps) {
  const strings = useUiStrings();
  const names = readers.map((reader) => getDisplayName(reader.name, strings.unnamed));
  return (
    <AvatarGroup
      {...rest}
      {...hooks.root({ className, props: rest })}
      people={readers}
      maxVisible={maxVisible}
      size="xs"
      action="list"
      aria-label={strings.chatSeenBy(names)}
    />
  );
}
