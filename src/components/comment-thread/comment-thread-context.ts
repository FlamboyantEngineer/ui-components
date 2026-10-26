import { createContext } from 'react';

/** What a thread tells the comments inside it. */
interface CommentThreadContextValue {
  /** The thread refuses changes, so its comments offer no actions. */
  isReadOnly: boolean;
}

export const CommentThreadContext = createContext<CommentThreadContextValue>({ isReadOnly: false });
