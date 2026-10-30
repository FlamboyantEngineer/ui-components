'use client';

import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { MessageActionsBar } from './message-actions-bar.js';
import { MessageCommandOverlays } from './message-command-overlays.js';
import {
  hasCommands,
  splitCommands,
  useMessageCommands,
  type ChatMessageCommandProps,
} from './message-commands.js';

export interface ChatMessageActionsProps
  extends BaseProps, AriaLabellingProps, ChatMessageCommandProps {}

/**
 * The action bar for a message's `actions`: a toolbar of the commands whose callbacks are given
 * (Copy, the ratings, Reply, React, Edit, Delete), with the feedback details, the emoji picker and
 * the delete confirmation they open. Arrow keys move between the commands. To offer the same
 * commands on a secondary click or long press, use `ChatMessageActionsMenu`, which draws this bar.
 */
export function ChatMessageActions(props: ChatMessageActionsProps) {
  const [commands, rest] = splitCommands(props);
  const state = useMessageCommands(commands);
  if (!hasCommands(commands)) return null;
  return (
    <MessageActionsBar {...rest} state={state}>
      <MessageCommandOverlays state={state} />
    </MessageActionsBar>
  );
}

export { ChatMessageActionsMenu } from './chat-message-actions-menu.js';
export type { ChatMessageActionsMenuProps } from './chat-message-actions-menu.js';
export type {
  ChatFeedback,
  ChatFeedbackRating,
  ChatMessageCommandProps,
} from './message-commands.js';
