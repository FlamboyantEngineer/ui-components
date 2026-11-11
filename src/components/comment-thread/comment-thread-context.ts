'use client';

import { createContext } from 'react';
import type { CommentMentions } from '../comment-composer/comment-mentions.js';

/** What a thread tells the comments inside it. */
interface CommentThreadContextValue {
  /** The thread refuses changes, so its comments offer no actions. */
  isReadOnly: boolean;
  /** The thread's mentions, for its comments' editors and bodies. */
  mentions?: CommentMentions | undefined;
}

export const CommentThreadContext = createContext<CommentThreadContextValue>({ isReadOnly: false });
