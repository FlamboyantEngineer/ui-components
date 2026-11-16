'use client';

import { createContext, useMemo } from 'react';
import type { CommentMentions } from '../comment-composer/comment-mentions.js';

/** What a thread tells the comments inside it. */
interface CommentThreadContextValue {
  /** The thread refuses changes, so its comments offer no actions. */
  isReadOnly: boolean;
  /** The thread's mentions, for its comments' editors and bodies. */
  mentions?: CommentMentions | undefined;
  /** Whether Delete asks for confirmation before calling `onDelete`. */
  confirmsDelete: boolean;
}

export const CommentThreadContext = createContext<CommentThreadContextValue>({
  isReadOnly: false,
  confirmsDelete: true,
});

/** What the thread tells its comments; Delete confirms unless the thread says otherwise. */
export function useThreadContext(
  isReadOnly: boolean,
  mentions: CommentMentions | undefined,
  confirmsDelete = true,
) {
  return useMemo(
    () => ({ isReadOnly, mentions, confirmsDelete }),
    [isReadOnly, mentions, confirmsDelete],
  );
}
