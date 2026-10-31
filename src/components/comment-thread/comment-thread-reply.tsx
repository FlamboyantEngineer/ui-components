'use client';

import { DeleteGlyph, EditGlyph } from '../../core/glyphs.js';
import { useContext, useRef, useState, type ReactNode, type Ref } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Key, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Attribution, type AttributionProps } from '../attribution/attribution.js';
import { getDisplayName, type AvatarIdentity } from '../avatar/avatar.js';
import { CommentComposer } from '../comment-composer/comment-composer.js';
import { Modal } from '../modal/modal.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import type { MenuEntry } from '../menu/menu.js';
import { UserIdentity } from '../user-identity/user-identity.js';
import { CommentThreadContext } from './comment-thread-context.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';

/** What a comment hands the editor that replaces its body while the reader edits it. */
export interface CommentEditorOptions {
  /** The comment's `text`, where the edit starts. */
  defaultValue: string;
  /** Saves the edited text through `onEdit` and closes the editor. */
  onSubmit: (text: string) => void;
  /** Closes the editor without saving. */
  onCancel: () => void;
}

export interface CommentThreadReplyProps
  extends
    BaseProps,
    Pick<AttributionProps, 'fallbackAfterDays' | 'getNow' | 'timeZone'>,
    RefProps<HTMLElement> {
  /** Who wrote the comment. */
  author: AvatarIdentity;
  /** When it was posted: an ISO 8601 date and time. */
  time: string | null | undefined;
  /** Marks the comment as changed after it was posted. */
  isEdited?: boolean | undefined;
  /** The comment's plain text: the body when there are no `children`, and where an edit starts. */
  text?: string | undefined;
  /** The body as the caller renders it (plain text, Markdown or rich text). Defaults to `text`. */
  children?: ReactNode;
  /** Content under the body, usually a `ReactionBar`. */
  reactions?: ReactNode;
  /** Actions of the comment's menu, before the built-in Edit and Delete. */
  actions?: readonly MenuEntry[] | undefined;
  /** Called with the `id` of a caller action chosen in the menu. */
  onAction?: ((key: Key) => void) | undefined;
  /** Offers Edit in the menu, which swaps the body for an editor; called with the saved text. */
  onEdit?: ((text: string) => void) | undefined;
  /** Offers Delete in the menu, which asks for confirmation before calling it. */
  onDelete?: (() => void) | undefined;
  /** Renders the editor in place of the default `CommentComposer`, for mentions or rich text. */
  renderEditor?: ((options: CommentEditorOptions) => ReactNode) | undefined;
}

const hooks = createHooks('comment-thread-reply', [
  'header',
  'author',
  'time',
  'edited',
  'actions',
  'body',
  'editor',
  'reactions',
]);

const editKey = 'edit';
const deleteKey = 'delete';

/** The default editor: a `CommentComposer` holding the comment's text. */
function DefaultEditor(options: CommentEditorOptions) {
  const strings = useUiStrings();
  return (
    <CommentComposer
      {...options}
      label={strings.editComment}
      submitLabel={strings.save}
      autoFocus
    />
  );
}

/** The comment's menu entries: the caller's actions, then Edit and Delete when offered. */
function useMenuEntries({
  actions = [],
  onEdit,
  onDelete,
}: Pick<CommentThreadReplyProps, 'actions' | 'onEdit' | 'onDelete'>): MenuEntry[] {
  const strings = useUiStrings();
  return [
    ...actions,
    ...(onEdit ? [{ id: editKey, label: strings.edit, icon: EditGlyph }] : []),
    ...(onDelete
      ? [{ id: deleteKey, label: strings.delete, icon: DeleteGlyph, tone: 'danger' as const }]
      : []),
  ];
}

type TimeOptions = Pick<CommentThreadReplyProps, 'fallbackAfterDays' | 'getNow' | 'timeZone'>;

/** The author, the live time and the edited marker. */
function CommentAuthor({
  author,
  time,
  isEdited,
  timeOptions,
}: Pick<CommentThreadReplyProps, 'author' | 'time'> & {
  isEdited: boolean;
  timeOptions: TimeOptions;
}) {
  const strings = useUiStrings();
  return (
    <UserIdentity
      {...author}
      size="sm"
      className={hooks.slotClass('author')}
      description={
        <>
          <Attribution time={time} {...timeOptions} className={hooks.slotClass('time')} />
          {isEdited ? (
            <>
              {' '}
              <span {...hooks.slot('edited')}>{strings.edited}</span>
            </>
          ) : null}
        </>
      }
    />
  );
}

/** The comment's menu, and the confirmation its Delete opens. */
function CommentMenu({
  actions,
  onAction,
  onEdit,
  onDelete,
  onEditStart,
  menuRef,
}: Pick<CommentThreadReplyProps, 'actions' | 'onAction' | 'onEdit' | 'onDelete'> & {
  onEditStart: () => void;
  menuRef: Ref<HTMLButtonElement | HTMLAnchorElement>;
}) {
  const strings = useUiStrings();
  const [isConfirming, setIsConfirming] = useState(false);
  const entries = useMenuEntries({ actions, onEdit, onDelete });
  if (entries.length === 0) return null;
  const runAction = (key: Key) => {
    if (key === editKey && onEdit) onEditStart();
    else if (key === deleteKey && onDelete) setIsConfirming(true);
    else onAction?.(key);
  };
  return (
    <>
      <DropdownMenu
        ref={menuRef}
        label={strings.commentActions}
        iconOnly
        size="sm"
        placement="bottom end"
        className={hooks.slotClass('actions')}
        items={entries}
        onAction={runAction}
      />
      {onDelete ? (
        <Modal
          role="alertdialog"
          isOpen={isConfirming}
          onOpenChange={setIsConfirming}
          tone="danger"
          title={strings.deleteComment}
          description={strings.deleteCommentMessage}
          cancelAction={{ autoFocus: true }}
          primaryAction={{
            label: strings.delete,
            onPress: (close) => {
              onDelete();
              close();
            },
          }}
        />
      ) : null}
    </>
  );
}

/**
 * One comment: its author, a live time, an edited marker, the body as caller content, reactions
 * and a menu of actions with Edit (in place) and Delete (after confirmation).
 */
export function CommentThreadReply({
  author,
  time,
  isEdited = false,
  text = '',
  children,
  reactions,
  actions,
  onAction,
  onEdit,
  onDelete,
  renderEditor = DefaultEditor,
  fallbackAfterDays,
  getNow,
  timeZone,
  className,
  ...rest
}: CommentThreadReplyProps) {
  const { isReadOnly } = useContext(CommentThreadContext);
  const [isEditing, setIsEditing] = useState(false);
  const strings = useUiStrings();
  const menuRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null);
  const editing = isEditing && !isReadOnly;
  const closeEditor = () => {
    setIsEditing(false);
    menuRef.current?.focus();
  };
  return (
    <article
      {...rest}
      {...hooks.root({ className, data: { edited: isEdited, editing } })}
      aria-label={getDisplayName(author.name, strings.unnamed)}
    >
      <div {...hooks.slot('header')}>
        <CommentAuthor
          author={author}
          time={time}
          isEdited={isEdited}
          timeOptions={{ fallbackAfterDays, getNow, timeZone }}
        />
        {isReadOnly ? null : (
          <CommentMenu
            actions={actions}
            onAction={onAction}
            onEdit={onEdit}
            onDelete={onDelete}
            onEditStart={() => setIsEditing(true)}
            menuRef={menuRef}
          />
        )}
      </div>
      {editing ? (
        <div {...hooks.slot('editor')}>
          {renderEditor({
            defaultValue: text,
            onSubmit: (edited) => {
              closeEditor();
              onEdit?.(edited);
            },
            onCancel: closeEditor,
          })}
        </div>
      ) : (
        <div {...hooks.slot('body')}>{children ?? text}</div>
      )}
      {!isEmptyNode(reactions) && !editing ? (
        <div {...hooks.slot('reactions')}>{reactions}</div>
      ) : null}
    </article>
  );
}
