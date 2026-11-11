'use client';

// A comment's body as text and its default editor, with the thread's mentions
// (specs/COMMENT-THREAD.md, UIC-COMMENT-THREAD-2.3, UIC-COMMENT-THREAD-3.1).

import { useUiStrings } from '../../core/provider.js';
import { CommentComposer } from '../comment-composer/comment-composer.js';
import type { CommentMentions } from '../comment-composer/comment-mentions.js';
import { CommentText } from './comment-text.js';
import type { CommentEditorOptions, CommentThreadReplyProps } from './comment-thread-reply.js';

/** The default editor: a `CommentComposer` holding the comment's text and its mentions. */
function DefaultEditor({
  mentions,
  ...options
}: CommentEditorOptions & { mentions: CommentMentions | undefined }) {
  const strings = useUiStrings();
  return (
    <CommentComposer
      {...options}
      mentions={mentions}
      label={strings.editComment}
      submitLabel={strings.save}
      autoFocus
    />
  );
}

/** The caller's editor, else the default one with the comment's mentions. */
export function ReplyEditor({
  renderEditor,
  options,
  mentions,
}: Pick<CommentThreadReplyProps, 'renderEditor'> & {
  options: CommentEditorOptions;
  mentions: CommentMentions | undefined;
}) {
  if (renderEditor) return renderEditor(options);
  // An element, so its hooks belong to the editor and not to the reply.
  return <DefaultEditor {...options} mentions={mentions} />;
}

/** The comment's `text` as its body: with its mentions as chips when there are mentions. */
export function ReplyText({
  text,
  mentions,
}: {
  text: string;
  mentions: CommentMentions | undefined;
}) {
  return mentions ? <CommentText text={text} parse={mentions.parse} /> : text;
}
