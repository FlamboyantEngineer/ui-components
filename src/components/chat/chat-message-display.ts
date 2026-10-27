import { useMemo } from 'react';
import type {
  ChatMessageOrigin,
  ChatMessageTimePlacement,
  ChatMessageVariant,
} from '../chat-transcript/chat-transcript.js';

/** How a chat draws its messages: with or without avatars, author names, times and backgrounds. */
export interface ChatMessageDisplayOptions {
  /** Shows each author's avatar at the start of their messages. Defaults to `true`. */
  showAvatars?: boolean | undefined;
  /** Shows each author's name at the start of their messages. Defaults to `true`. */
  showAuthorNames?: boolean | undefined;
  /**
   * Where each message shows its time: in the `header` (the default), in the `footer` under the
   * message, which the reference stylesheet shows with the actions on hover and focus, or `none`.
   */
  timePlacement?: ChatMessageTimePlacement | undefined;
  /** Draws the reader's own messages in a `bubble` (the default) or `plain`. */
  sentVariant?: ChatMessageVariant | undefined;
  /** Draws everyone else's messages, an assistant's too, in a `bubble` (the default) or `plain`. */
  receivedVariant?: ChatMessageVariant | undefined;
}

/** The display options, kept while they stay the same, so unchanged messages do not render again. */
export function useMessageDisplay({
  showAvatars,
  showAuthorNames,
  timePlacement,
  sentVariant,
  receivedVariant,
}: ChatMessageDisplayOptions): ChatMessageDisplayOptions {
  return useMemo(
    () => ({ showAvatars, showAuthorNames, timePlacement, sentVariant, receivedVariant }),
    [showAvatars, showAuthorNames, timePlacement, sentVariant, receivedVariant],
  );
}

/** The variant of a message from `origin`; a notice keeps the default. */
export function toMessageVariant(
  origin: ChatMessageOrigin,
  display: ChatMessageDisplayOptions,
): ChatMessageVariant | undefined {
  if (origin === 'sent') return display.sentVariant;
  return origin === 'received' ? display.receivedVariant : undefined;
}
