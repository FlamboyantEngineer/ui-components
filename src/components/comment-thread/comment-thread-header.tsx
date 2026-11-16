'use client';

import type { ReactNode } from 'react';
import { CheckGlyph, CloseGlyph, UndoGlyph } from '../../core/glyphs.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Focusable } from '../../primitives/index.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Attribution } from '../attribution/attribution.js';
import type { AvatarIdentity } from '../avatar/avatar.js';
import { Badge } from '../badge/badge.js';
import { Button } from '../button/button.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import type { MenuEntry } from '../menu/menu.js';
import { Tooltip } from '../tooltip/tooltip.js';
import { UserIdentity } from '../user-identity/user-identity.js';
import { commentThreadHooks as hooks } from './comment-thread-hooks.js';
import type { FirstCommentMenu } from './first-comment-menu.js';

/** What the header shows and does. */
interface CommentThreadHeaderProps {
  quote: ReactNode;
  isResolved: boolean;
  /** Resolves or reopens, when the thread offers it. */
  onToggle: (() => void) | null;
  isPending: boolean;
  iconOnly: boolean | undefined;
  statusIconOnly: boolean | undefined;
  /** Reopen is an entry of the header menu, not a button, while the thread is resolved. */
  resolveInMenu: boolean | undefined;
  /** The caller's controls after the resolve button. */
  headerActions: ReactNode;
  /** The caller's entries of the header menu. */
  menu: readonly MenuEntry[] | undefined;
  onAction: ((key: Key) => void) | undefined;
  /** The opening comment's menu, moved here. */
  firstMenu: FirstCommentMenu | null;
  onClose: (() => void) | undefined;
  /** Who starts the thread, and when: shown while it has no comments. */
  author: AvatarIdentity | undefined;
  time: string | null | undefined;
  hasComments: boolean;
}

const reopenKey = 'ui-comment-thread-reopen';

/**
 * The Resolved state chip: a text badge, or an icon-only one named by its label, focusable so the
 * tooltip that shows the label reaches keyboard readers too. It is an image, not a button.
 */
function ResolvedStatus({ iconOnly }: { iconOnly: boolean | undefined }) {
  const strings = useUiStrings();
  if (!iconOnly) {
    return (
      <Badge tone="success" size="sm" className={hooks.slotClass('status')}>
        {strings.resolved}
      </Badge>
    );
  }
  return (
    <Tooltip content={strings.resolved}>
      <Focusable>
        <span
          {...hooks.slot('status', { iconOnly: true })}
          role="img"
          aria-label={strings.resolved}
          aria-describedby=""
          tabIndex={0}
        >
          <Badge tone="success" size="sm" startIcon={CheckGlyph} aria-hidden>
            {null}
          </Badge>
        </span>
      </Focusable>
    </Tooltip>
  );
}

/**
 * The header menu: the opening comment's entries (its Edit and Delete, then its own actions), Reopen
 * when it moved here, then the caller's entries. A key the opening comment offers goes to it.
 */
function HeaderMenu({
  menu = [],
  onAction,
  firstMenu,
  reopen,
}: Pick<CommentThreadHeaderProps, 'menu' | 'onAction' | 'firstMenu'> & {
  reopen: (() => void) | null;
}) {
  const strings = useUiStrings();
  const first = firstMenu?.entries ?? [];
  const items = [
    ...first,
    ...(reopen ? [{ id: reopenKey, label: strings.reopen, icon: UndoGlyph }] : []),
    ...menu,
  ];
  if (items.length === 0) return null;
  const run = (key: Key) => {
    if (key === reopenKey) reopen?.();
    else if (first.some((entry) => entry.id === key)) firstMenu?.run(key);
    else onAction?.(key);
  };
  return (
    <DropdownMenu
      label={strings.moreActions}
      iconOnly
      size="sm"
      placement="bottom end"
      className={hooks.slotClass('menu')}
      items={items}
      onAction={run}
    />
  );
}

/** The resolve or reopen button. */
function ResolveButton({
  isResolved,
  onToggle,
  isPending,
  iconOnly,
}: Pick<CommentThreadHeaderProps, 'isResolved' | 'isPending' | 'iconOnly'> & {
  onToggle: () => void;
}) {
  const strings = useUiStrings();
  const label = isResolved ? strings.reopen : strings.resolve;
  const icon = isResolved ? UndoGlyph : CheckGlyph;
  return (
    <Button
      variant="ghost"
      size="sm"
      className={hooks.slotClass('resolve')}
      onPress={onToggle}
      isPending={isPending}
      {...(iconOnly ? { icon, label, tooltip: label } : { startIcon: icon, children: label })}
    />
  );
}

/** Whether the header has anything to show. */
function hasContent(props: CommentThreadHeaderProps, showsAuthor: boolean): boolean {
  const { quote, isResolved, onToggle, headerActions, menu = [], firstMenu, onClose } = props;
  return (
    !isEmptyNode(quote) ||
    isResolved ||
    onToggle !== null ||
    !isEmptyNode(headerActions) ||
    menu.length > 0 ||
    (firstMenu?.entries.length ?? 0) > 0 ||
    onClose !== undefined ||
    showsAuthor
  );
}

/**
 * The thread's header: the author of a thread with no comments yet, the quote, the resolved chip,
 * the resolve button, the caller's controls, the header menu and the close button.
 */
export function CommentThreadHeader(props: CommentThreadHeaderProps) {
  const { quote, isResolved, onToggle, headerActions, author, onClose } = props;
  const strings = useUiStrings();
  const showsAuthor = author !== undefined && !props.hasComments;
  if (!hasContent(props, showsAuthor)) return null;
  const isReopenInMenu = props.resolveInMenu === true && isResolved && onToggle !== null;
  return (
    <div {...hooks.slot('header')}>
      {author && showsAuthor ? (
        <UserIdentity
          {...author}
          size="sm"
          className={hooks.slotClass('author')}
          description={props.time ? <Attribution time={props.time} /> : undefined}
        />
      ) : null}
      {isEmptyNode(quote) ? null : <blockquote {...hooks.slot('quote')}>{quote}</blockquote>}
      {isResolved ? <ResolvedStatus iconOnly={props.statusIconOnly} /> : null}
      {onToggle && !isReopenInMenu ? <ResolveButton {...props} onToggle={onToggle} /> : null}
      {isEmptyNode(headerActions) ? null : (
        <div {...hooks.slot('header-actions')}>{headerActions}</div>
      )}
      <HeaderMenu {...props} reopen={isReopenInMenu ? onToggle : null} />
      {onClose ? (
        <Button
          variant="ghost"
          size="sm"
          className={hooks.slotClass('close')}
          icon={CloseGlyph}
          label={strings.close}
          tooltip={strings.close}
          onPress={onClose}
        />
      ) : null}
    </div>
  );
}
