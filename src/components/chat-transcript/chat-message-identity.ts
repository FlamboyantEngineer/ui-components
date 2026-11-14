'use client';

import { useId } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { getDisplayName } from '../avatar/avatar.js';
import type { ChatMessageOrigin, ChatMessageProps, ChatMessageStatus } from './chat-message.js';
import { useAbsoluteTime } from './chat-message-parts.js';
import { useTranscriptMessage } from './transcript-context.js';

interface MessageIdentityOptions extends Pick<
  ChatMessageProps,
  'id' | 'author' | 'time' | 'isDeleted' | 'error'
> {
  origin: ChatMessageOrigin;
  status: ChatMessageStatus;
}

interface MessageIdentity {
  labelId: string;
  domId: string;
  authorName: string | undefined;
  label: string;
  transcript: ReturnType<typeof useTranscriptMessage>;
}

/** Generated DOM identities never replace the explicit aliases a transcript registers. */
export function useMessageIdentity(options: MessageIdentityOptions): MessageIdentity {
  const strings = useUiStrings();
  const labelId = useId();
  const authorName = options.author
    ? getDisplayName(options.author.name, strings.unnamed)
    : undefined;
  const transcript = useTranscriptMessage({
    id: options.id,
    authorName,
    origin: options.origin,
    status: options.status,
    error: options.isDeleted ? undefined : options.error,
  });
  return {
    labelId,
    domId: options.id ?? `${labelId}-message`,
    authorName,
    label: strings.chatMessageLabel(authorName, useAbsoluteTime(options.time)),
    transcript,
  };
}
