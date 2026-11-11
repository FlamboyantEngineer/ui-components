'use client';

// Comment mentions as a host makes them: its search, its token format and the text box that takes
// them (specs/COMMENT-COMPOSER.md, UIC-COMMENT-COMPOSER-2).

import {
  type CommentMentionOptions,
  type CommentMentions,
  parseMentions,
  serializeMention,
} from '../comment-mentions.js';
import { CommentMentionField } from './comment-mention-field.js';

/**
 * Mentions for `CommentComposer`, `CommentThread` and `CommentThreadReply`: `@` opens a list of the
 * people `search` finds, and a chosen person goes into the text as one token, `@[Name](id)` unless
 * `serialize` and `parse` say otherwise. Make it once, outside render or in `useMemo`.
 */
export function createCommentMentions(options: CommentMentionOptions): CommentMentions {
  const mentions: CommentMentions = {
    search: options.search,
    serialize: options.serialize ?? serializeMention,
    parse: options.parse ?? parseMentions,
    renderField: (field) => <CommentMentionField field={field} mentions={mentions} />,
  };
  return mentions;
}
