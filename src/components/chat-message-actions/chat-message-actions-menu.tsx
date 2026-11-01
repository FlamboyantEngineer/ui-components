'use client';

import {
  CopyGlyph,
  DeleteGlyph,
  EditGlyph,
  EmojiGlyph,
  ReplyGlyph,
  ThumbsDownGlyph,
  ThumbsUpGlyph,
} from '../../core/glyphs.js';
import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import type { BaseProps, Key, Selection } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
import { ContextMenuTrigger } from '../context-menu/context-menu.js';
import { Menu, MenuItem, MenuSection } from '../menu/menu.js';
import { MessageActionsBar } from './message-actions-bar.js';
import { MessageCommandOverlays } from './message-command-overlays.js';
import {
  hasCommands,
  splitCommands,
  useMessageCommands,
  type ChatFeedbackRating,
  type ChatMessageCommandProps,
  type MessageCommands,
} from './message-commands.js';

export interface ChatMessageActionsMenuProps extends BaseProps, ChatMessageCommandProps {
  /**
   * Draws the message, given its action bar (`null` without commands) for the message's `actions`.
   * The element it returns takes event handlers and a ref, as `ChatMessage` does.
   */
  children: (actions: ReactNode) => ReactElement;
  /** Names the menu. Defaults to the provider's `messageActions` string. */
  'aria-label'?: string | undefined;
}

/** The rating a menu selection change chose, or the shown rating when the reader unchecked it. */
function toChosenRating(keys: Selection, shown: ChatFeedbackRating | null) {
  const chosen = keys === 'all' ? undefined : [...keys].find((key) => key !== shown);
  return chosen === 'up' || chosen === 'down' ? chosen : shown;
}

/** The menu of the commands, in the bar's order; the ratings are checkable. */
function CommandMenu({
  state,
  anchor,
}: {
  state: MessageCommands;
  anchor: RefObject<HTMLElement | null>;
}) {
  const strings = useUiStrings();
  const { commands, rating } = state;
  const run = (key: Key) => {
    if (key === 'copy') state.copy(anchor.current);
    else if (key === 'reply') commands.onReply?.();
    else if (key === 'edit') commands.onEdit?.();
    else if (key === 'react' || key === 'delete') state.openOverlay(key, anchor);
  };
  return (
    <Menu onAction={run}>
      {commands.copyText === undefined ? null : (
        <MenuItem id="copy" icon={CopyGlyph}>
          {strings.copy}
        </MenuItem>
      )}
      {commands.onFeedback ? (
        <MenuSection
          aria-label={strings.messageFeedback}
          selectionMode="multiple"
          selectedKeys={rating ? [rating] : []}
          shouldCloseOnSelect
          onSelectionChange={(keys) => {
            const chosen = toChosenRating(keys, rating);
            if (chosen) state.rate(chosen, anchor);
          }}
        >
          <MenuItem id="up" icon={ThumbsUpGlyph}>
            {strings.goodResponse}
          </MenuItem>
          <MenuItem id="down" icon={ThumbsDownGlyph}>
            {strings.badResponse}
          </MenuItem>
        </MenuSection>
      ) : null}
      {commands.onReply ? (
        <MenuItem id="reply" icon={ReplyGlyph}>
          {strings.reply}
        </MenuItem>
      ) : null}
      {commands.onReact ? (
        <MenuItem id="react" icon={EmojiGlyph}>
          {strings.addReaction}
        </MenuItem>
      ) : null}
      {commands.onEdit ? (
        <MenuItem id="edit" icon={EditGlyph}>
          {strings.edit}
        </MenuItem>
      ) : null}
      {commands.onDelete ? (
        <MenuItem id="delete" icon={DeleteGlyph} tone="danger">
          {strings.delete}
        </MenuItem>
      ) : null}
    </Menu>
  );
}

/**
 * Offers a message's commands in a context menu, on a secondary click, a long touch, the Context
 * Menu key or Shift+F10 on the message, and hands the message its action bar. The menu and the bar
 * share one state: a rating, a copy or an overlay opened from either shows in both. Overlays opened
 * from the menu are placed against the message.
 */
export function ChatMessageActionsMenu(props: ChatMessageActionsMenuProps) {
  const strings = useUiStrings();
  const [commands, { children, 'aria-label': ariaLabel, ...rest }] = splitCommands(props);
  const state = useMessageCommands(commands);
  const isEnabled = hasCommands(commands);
  const message = children(isEnabled ? <MessageActionsBar state={state} /> : null);
  const target = isValidElement<{ ref?: Ref<HTMLElement> }>(message) ? message : null;
  // The menu anchors to the message, whose own ref still receives it.
  const [targetRef, ref] = useForwardedRef<HTMLElement>(target?.props.ref);
  if (!target) {
    throw new Error('ChatMessageActionsMenu needs its children to return a message element.');
  }
  return (
    <>
      <ContextMenuTrigger
        {...rest}
        isDisabled={!isEnabled}
        aria-label={ariaLabel ?? strings.messageActions}
      >
        {cloneElement(target, { ref })}
        <CommandMenu state={state} anchor={targetRef} />
      </ContextMenuTrigger>
      {isEnabled ? <MessageCommandOverlays state={state} /> : null}
    </>
  );
}
