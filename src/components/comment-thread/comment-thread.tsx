'use client';

import { CheckGlyph, UndoGlyph } from '../../core/glyphs.js';
import { isValidElement, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { useControllableState } from '../../core/controllable-state.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { flattenChildren } from '../../utils/flatten-children.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Badge } from '../badge/badge.js';
import { Button } from '../button/button.js';
import {
  CommentComposer,
  type CommentComposerProps,
} from '../comment-composer/comment-composer.js';
import { InlineError } from '../inline-error/inline-error.js';
import { CommentThreadContext } from './comment-thread-context.js';

export interface CommentThreadProps
  extends BaseProps, AriaLabellingProps, RefProps<HTMLDivElement> {
  /** The comments, usually `CommentThreadReply` elements: the opening comment, then the replies. */
  children?: ReactNode;
  /** The commented text or other anchor the thread is about, quoted above the comments. */
  quote?: ReactNode;
  /** Whether the discussion is closed, controlled. */
  isResolved?: boolean | undefined;
  /** Whether the discussion starts closed, uncontrolled. */
  defaultResolved?: boolean | undefined;
  /** Offers Resolve and Reopen; called with the new state. */
  onResolvedChange?: ((isResolved: boolean) => void) | undefined;
  /** Shows the comments without the composer, the resolve button or the comments' menus. */
  isReadOnly?: boolean | undefined;
  /** The thread is the current one, such as when its anchor is selected. */
  isSelected?: boolean | undefined;
  /**
   * How many of the latest replies a long thread shows; the replies between them and the opening
   * comment hide behind a button that reveals them. Defaults to every reply.
   */
  visibleReplies?: number | undefined;
  /** Draws the default `CommentComposer` and receives its text, like its `onSubmit`. */
  onReply?: CommentComposerProps['onSubmit'] | undefined;
  /** The caller's own composer, in place of the default one. */
  composer?: ReactNode;
  /** A failure to report under the comments, such as a reply that could not be posted. */
  error?: ReactNode;
}

const hooks = createHooks('comment-thread', [
  'header',
  'quote',
  'status',
  'resolve',
  'comments',
  'item',
  'more',
  'show-more',
  'error',
  'composer',
]);

/**
 * The comments, with the middle replies of a long thread hidden behind a button until it is pressed.
 * Comments inside fragments count as comments of their own.
 */
function CommentList({
  comments,
  visibleReplies,
}: Pick<CommentThreadProps, 'visibleReplies'> & { comments: readonly ReactNode[] }) {
  const strings = useUiStrings();
  const [isExpanded, setIsExpanded] = useState(false);
  const revealedRef = useRef<HTMLLIElement>(null);
  // The first revealed reply takes focus from the button, which disappears.
  useEffect(() => {
    if (isExpanded) revealedRef.current?.focus();
  }, [isExpanded]);
  const [first, ...replies] = comments;
  if (first === undefined) return null;
  const hidden = isExpanded || visibleReplies === undefined ? 0 : replies.length - visibleReplies;
  const shown = hidden > 0 ? replies.slice(hidden) : replies;
  return (
    <ol {...hooks.slot('comments')}>
      <li {...hooks.slot('item')}>{first}</li>
      {hidden > 0 ? (
        <li {...hooks.slot('more')}>
          <Button
            variant="ghost"
            size="sm"
            className={hooks.slotClass('show-more')}
            onPress={() => setIsExpanded(true)}
          >
            {strings.showMoreReplies(hidden)}
          </Button>
        </li>
      ) : null}
      {shown.map((reply, index) => (
        <li
          key={isValidElement(reply) ? reply.key : index}
          {...hooks.slot('item')}
          {...(isExpanded && index === 0 ? { ref: revealedRef, tabIndex: -1 } : {})}
        >
          {reply}
        </li>
      ))}
    </ol>
  );
}

/** The quote, the resolved badge and the resolve button, when there is any of them. */
function CommentThreadHeader({
  quote,
  isResolved,
  onToggle,
}: Pick<CommentThreadProps, 'quote'> & { isResolved: boolean; onToggle: (() => void) | null }) {
  const strings = useUiStrings();
  if (isEmptyNode(quote) && !isResolved && !onToggle) return null;
  return (
    <div {...hooks.slot('header')}>
      {isEmptyNode(quote) ? null : <blockquote {...hooks.slot('quote')}>{quote}</blockquote>}
      {isResolved ? (
        <Badge tone="success" size="sm" className={hooks.slotClass('status')}>
          {strings.resolved}
        </Badge>
      ) : null}
      {onToggle ? (
        <Button
          variant="ghost"
          size="sm"
          startIcon={isResolved ? UndoGlyph : CheckGlyph}
          className={hooks.slotClass('resolve')}
          onPress={onToggle}
        >
          {isResolved ? strings.reopen : strings.resolve}
        </Button>
      ) : null}
    </div>
  );
}

/**
 * The caller's composer, or the default one when the thread takes replies. While replying is not
 * possible it stays mounted but hidden, so an unsent reply and a pending one outlast a resolve or a
 * read-only spell.
 */
function ThreadComposer({
  composer,
  onReply,
  isFirst,
  isHidden,
}: Pick<CommentThreadProps, 'composer' | 'onReply'> & { isFirst: boolean; isHidden: boolean }) {
  const strings = useUiStrings();
  const content =
    composer ??
    (onReply ? (
      <CommentComposer
        onSubmit={onReply}
        label={isFirst ? strings.addComment : strings.reply}
        submitLabel={isFirst ? strings.comment : strings.reply}
      />
    ) : null);
  return isEmptyNode(content) ? null : (
    <div {...hooks.slot('composer')} hidden={isHidden || undefined}>
      {content}
    </div>
  );
}

/**
 * A discussion: the quoted anchor, an opening comment and its replies, resolve and reopen, an error
 * and a composer for the next reply. A long thread hides its middle replies behind a button.
 */
export function CommentThread({
  children,
  quote,
  isResolved,
  defaultResolved = false,
  onResolvedChange,
  isReadOnly = false,
  isSelected = false,
  visibleReplies,
  onReply,
  composer,
  error,
  className,
  ...rest
}: CommentThreadProps) {
  const strings = useUiStrings();
  const threadContext = useMemo(() => ({ isReadOnly }), [isReadOnly]);
  const [resolved, setResolved] = useControllableState(
    isResolved,
    defaultResolved,
    onResolvedChange,
  );
  const comments = flattenChildren(children);
  // The composer mounts once replying is possible, then stays: hidden while it is not.
  const canReply = !isReadOnly && !resolved;
  const [hasComposer, setHasComposer] = useState(canReply);
  if (canReply && !hasComposer) setHasComposer(true);
  return (
    <div
      {...rest}
      {...hooks.root({
        className,
        data: { resolved, readonly: isReadOnly, selected: isSelected },
      })}
      role="group"
      aria-label={
        rest['aria-label'] ?? (rest['aria-labelledby'] ? undefined : strings.commentThread)
      }
    >
      <CommentThreadContext value={threadContext}>
        <CommentThreadHeader
          quote={quote}
          isResolved={resolved}
          onToggle={onResolvedChange && !isReadOnly ? () => setResolved(!resolved) : null}
        />
        <CommentList visibleReplies={visibleReplies} comments={comments} />
        {isEmptyNode(error) ? null : (
          <InlineError className={hooks.slotClass('error')}>{error}</InlineError>
        )}
        {hasComposer ? (
          <ThreadComposer
            composer={composer}
            onReply={onReply}
            isFirst={comments.length === 0}
            isHidden={!canReply}
          />
        ) : null}
      </CommentThreadContext>
    </div>
  );
}
