'use client';

import { isValidElement, type ReactNode, useEffect, useRef, useState } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { flattenChildren } from '../../utils/flatten-children.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { useFocusRequest } from '../../utils/use-focus-request.js';
import type { AvatarIdentity } from '../avatar/avatar.js';
import { Button } from '../button/button.js';
import {
  CommentComposer,
  type CommentComposerProps,
} from '../comment-composer/comment-composer.js';
import type { CommentMentions } from '../comment-composer/comment-mentions.js';
import { InlineError } from '../inline-error/inline-error.js';
import type { MenuEntry } from '../menu/menu.js';
import {
  type CommentThreadActivity,
  CommentThreadActivityList,
} from './comment-thread-activity.js';
import { CommentThreadContext, useThreadContext } from './comment-thread-context.js';
import { CommentThreadHeader } from './comment-thread-header.js';
import { commentThreadHooks as hooks } from './comment-thread-hooks.js';
import {
  createFirstCommentMenuStore,
  FirstCommentMenuContext,
  type FirstCommentMenuStore,
  useFirstCommentMenu,
} from './first-comment-menu.js';
import { useResolvedState } from './use-resolved-state.js';

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
  /**
   * Offers Resolve and Reopen; called with the new state. A returned promise holds the button
   * pending, and the state flips once it resolves.
   */
  onResolvedChange?: ((isResolved: boolean) => void | Promise<unknown>) | undefined;
  /** Shows Resolve and Reopen as icon buttons, named by their label, which their tooltip shows. */
  resolveIconOnly?: boolean | undefined;
  /**
   * Shows the thread's state chips, such as Resolved, as icon-only chips: each is named by its
   * label, which a tooltip shows on hover and keyboard focus. Defaults to text chips.
   */
  statusIconOnly?: boolean | undefined;
  /** Moves Reopen into the header menu while the thread is resolved. */
  resolveInMenu?: boolean | undefined;
  /** The caller's controls in the header, after the resolve button, such as Accept and Reject. */
  headerActions?: ReactNode;
  /**
   * Entries of a "More actions" menu at the header's end, shown also while the thread is resolved
   * or read-only, such as Copy link.
   */
  menu?: readonly MenuEntry[] | undefined;
  /** Called with the `id` of an entry of `menu` chosen. */
  onAction?: ((key: Key) => void) | undefined;
  /**
   * Moves the opening comment's menu (its Edit, Delete and own actions) into the header menu, before
   * `menu`; Edit there opens that comment's editor in place.
   */
  firstInMenu?: boolean | undefined;
  /** Who starts a thread that has no comments yet, such as a change's discussion, shown in the header. */
  author?: AvatarIdentity | undefined;
  /** When `author` started it: an ISO 8601 date and time, shown live. */
  time?: string | null | undefined;
  /** Hides the composer, which stays mounted, while the thread is not selected. */
  composerOnSelect?: boolean | undefined;
  /** Offers a close button at the header's end, such as for a thread being started. */
  onClose?: (() => void) | undefined;
  /** Indents every reply, whole, under the opening comment. */
  indentReplies?: boolean | undefined;
  /** Whether each comment's Delete asks for confirmation first; a comment's own prop wins. */
  confirmsDelete?: boolean | undefined;
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
  /**
   * Lets `@` mention people in the default composer and in each comment's default editor, and shows
   * the mentions of a comment without `children` as chips. From `createCommentMentions`.
   */
  mentions?: CommentMentions | undefined;
  /** A failure to report under the comments, such as a reply that could not be posted. */
  error?: ReactNode;
  /**
   * What is happening after the replies: a reply being posted (`pending`), someone typing
   * (`typing`) or a reply that failed (`error`), each with optional Cancel and Retry.
   */
  activity?: readonly CommentThreadActivity[] | undefined;
  /**
   * The `id` of the comment to point the reader at, such as the one a link opened: its list item
   * publishes `data-highlighted`, hidden replies are shown, and it scrolls into view.
   */
  highlightedId?: string | undefined;
}

/** Whether a comment is the element whose `id` prop is `id`. */
function hasId(comment: ReactNode, id: string): boolean {
  return isValidElement<{ id?: unknown }>(comment) && comment.props.id === id;
}

/**
 * The comments, with the middle replies of a long thread hidden behind a button until it is pressed.
 * Comments inside fragments count as comments of their own.
 */
function CommentList({
  comments,
  visibleReplies,
  highlightedId,
  firstMenu,
}: Pick<CommentThreadProps, 'visibleReplies' | 'highlightedId'> & {
  comments: readonly ReactNode[];
  /** Where the opening comment hands its menu to the header, with `firstInMenu`. */
  firstMenu: FirstCommentMenuStore | null;
}) {
  const strings = useUiStrings();
  const [isExpanded, setIsExpanded] = useState(false);
  const revealedRef = useRef<HTMLLIElement>(null);
  const highlightedRef = useRef<HTMLLIElement>(null);
  const requestFocus = useFocusRequest();
  const [first, ...replies] = comments;
  const highlightedIndex =
    highlightedId === undefined ? -1 : replies.findIndex((reply) => hasId(reply, highlightedId));
  const isHighlightHidden =
    visibleReplies !== undefined &&
    highlightedIndex >= 0 &&
    highlightedIndex < replies.length - visibleReplies;
  if (isHighlightHidden && !isExpanded) setIsExpanded(true);
  // Scrolls once the highlighted comment is drawn, also when it arrives after its id.
  const isHighlightShown =
    highlightedId !== undefined && comments.some((c) => hasId(c, highlightedId));
  useEffect(() => {
    if (isHighlightShown)
      highlightedRef.current?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [highlightedId, isHighlightShown]);
  if (first === undefined) return null;
  const hidden = isExpanded || visibleReplies === undefined ? 0 : replies.length - visibleReplies;
  const shown = hidden > 0 ? replies.slice(hidden) : replies;
  const isHighlighted = (comment: ReactNode) =>
    highlightedId !== undefined && hasId(comment, highlightedId);
  return (
    <ol {...hooks.slot('comments')}>
      <li
        ref={isHighlighted(first) ? highlightedRef : undefined}
        {...hooks.slot('item', { highlighted: isHighlighted(first) })}
      >
        <FirstCommentMenuContext value={firstMenu}>{first}</FirstCommentMenuContext>
      </li>
      {hidden > 0 ? (
        <li {...hooks.slot('more', { reply: true })}>
          <Button
            variant="ghost"
            size="sm"
            className={hooks.slotClass('show-more')}
            onPress={() => {
              setIsExpanded(true);
              // The first revealed reply takes focus from the button, which disappears; a reveal
              // for a highlighted comment leaves focus where it is.
              requestFocus(() => revealedRef.current);
            }}
          >
            {strings.showMoreReplies(hidden)}
          </Button>
        </li>
      ) : null}
      {shown.map((reply, index) => {
        const highlighted = isHighlighted(reply);
        const isRevealed = isExpanded && index === 0;
        return (
          <li
            key={isValidElement(reply) ? reply.key : index}
            {...hooks.slot('item', { reply: true, highlighted })}
            ref={(element) => {
              if (isRevealed) revealedRef.current = element;
              if (highlighted) highlightedRef.current = element;
            }}
            tabIndex={isRevealed ? -1 : undefined}
          >
            {reply}
          </li>
        );
      })}
    </ol>
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
  mentions,
  isFirst,
  isHidden,
}: Pick<CommentThreadProps, 'composer' | 'onReply' | 'mentions'> & {
  isFirst: boolean;
  isHidden: boolean;
}) {
  const strings = useUiStrings();
  const content =
    composer ??
    (onReply ? (
      <CommentComposer
        onSubmit={onReply}
        mentions={mentions}
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

/** The comments, the activity, the error and the composer, under the header. */
function ThreadBody({
  comments,
  visibleReplies,
  highlightedId,
  firstMenu,
  activity,
  error,
  composer,
  onReply,
  mentions,
  composerState,
}: Pick<
  CommentThreadProps,
  'visibleReplies' | 'highlightedId' | 'activity' | 'error' | 'composer' | 'onReply' | 'mentions'
> & {
  comments: readonly ReactNode[];
  firstMenu: FirstCommentMenuStore | null;
  composerState: { isMounted: boolean; isHidden: boolean };
}) {
  return (
    <>
      <CommentList
        visibleReplies={visibleReplies}
        comments={comments}
        highlightedId={highlightedId}
        firstMenu={firstMenu}
      />
      <CommentThreadActivityList activity={activity} />
      {isEmptyNode(error) ? null : (
        <InlineError className={hooks.slotClass('error')}>{error}</InlineError>
      )}
      {composerState.isMounted ? (
        <ThreadComposer
          composer={composer}
          onReply={onReply}
          mentions={mentions}
          isFirst={comments.length === 0}
          isHidden={composerState.isHidden}
        />
      ) : null}
    </>
  );
}

/**
 * Whether the composer is drawn and hidden: it mounts once replying is possible, then stays, hidden
 * while it is not, and with `composerOnSelect` while the thread is not selected.
 */
function useComposerState(canReply: boolean, isShown: boolean) {
  const [isMounted, setIsMounted] = useState(canReply);
  if (canReply && !isMounted) setIsMounted(true);
  return { isMounted: isMounted || canReply, isHidden: !canReply || !isShown };
}

/**
 * A discussion: the quoted anchor, an opening comment and its replies, resolve and reopen, an error
 * and a composer for the next reply. A long thread hides its middle replies behind a button. The
 * header can hold the caller's controls, a menu, a close button and, before any comment, its author.
 */
export function CommentThread({
  children,
  quote,
  isResolved,
  defaultResolved = false,
  onResolvedChange,
  resolveIconOnly,
  statusIconOnly,
  resolveInMenu,
  headerActions,
  menu,
  onAction,
  firstInMenu,
  author,
  time,
  composerOnSelect,
  onClose,
  indentReplies = false,
  isReadOnly = false,
  confirmsDelete,
  isSelected = false,
  className,
  ...rest
}: CommentThreadProps) {
  const strings = useUiStrings();
  const threadContext = useThreadContext(isReadOnly, rest.mentions, confirmsDelete);
  const { resolved, isPending, toggle } = useResolvedState({
    isResolved,
    defaultResolved,
    onResolvedChange,
  });
  const [firstMenuStore] = useState(createFirstCommentMenuStore);
  const firstMenu = useFirstCommentMenu(firstInMenu ? firstMenuStore : null);
  const comments = flattenChildren(children);
  const canReply = !isReadOnly && !resolved;
  const composerState = useComposerState(canReply, isSelected || !composerOnSelect);
  const { visibleReplies, highlightedId, activity, error, composer, onReply, mentions, ...root } =
    rest;
  return (
    <div
      {...root}
      {...hooks.root({
        className,
        data: { resolved, readonly: isReadOnly, selected: isSelected, indentReplies },
      })}
      role="group"
      aria-label={
        root['aria-label'] ?? (root['aria-labelledby'] ? undefined : strings.commentThread)
      }
    >
      <CommentThreadContext value={threadContext}>
        <CommentThreadHeader
          {...{ quote, statusIconOnly, resolveInMenu, headerActions, menu, onAction, onClose }}
          {...{ author, time, isPending, firstMenu }}
          isResolved={resolved}
          onToggle={onResolvedChange && !isReadOnly ? toggle : null}
          iconOnly={resolveIconOnly}
          hasComments={comments.length > 0}
        />
        <ThreadBody
          {...{ visibleReplies, highlightedId, activity, error, composer, onReply, mentions }}
          comments={comments}
          firstMenu={firstInMenu ? firstMenuStore : null}
          composerState={composerState}
        />
      </CommentThreadContext>
    </div>
  );
}
