'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CloseGlyph, EditGlyph, SendGlyph } from '../../core/glyphs.js';
import { useUiStrings } from '../../core/provider.js';
import { isThenable } from '../../utils/is-thenable.js';
import { useLatest } from '../../utils/use-latest.js';
import { useRemovalFocus } from '../../utils/use-removal-focus.js';
import { Button } from '../button/button.js';
import { ChatAttachmentList } from '../chat-attachment/chat-attachment.js';
import type { ChatQueuedMessage } from '../chat-controller/chat-controller.js';
import type { ChatComposerOptions } from './chat-composer.js';
import { chatHooks as hooks } from './chat-hooks.js';
import { type ChatProgress, chatProgressDelay } from './chat-progress.js';
import type { ChatState } from './use-chat-state.js';

const noQueue: readonly ChatQueuedMessage[] = [];

interface ChatQueueProps {
  options: Pick<
    ChatComposerOptions,
    'conversationId' | 'queue' | 'onQueueChange' | 'onSteer' | 'onQueuedEditChange' | 'onSendError'
  >;
  /** The chat's state: the edit, and the composer that focus goes to when the last message leaves. */
  state: Pick<ChatState, 'editing' | 'startEdit' | 'cancelEdit' | 'composerRef'>;
  /** Shows the host's answer under way above the composer while it takes time. */
  track: ChatProgress['track'];
  removals: ChatQueueRemovals;
}

/** The removals of queued messages the host has not answered yet. */
export interface ChatQueueRemovals {
  /** The queue as the next change builds on it: without the messages being removed. */
  without: (queue: readonly ChatQueuedMessage[]) => ChatQueuedMessage[];
  /** Counts the message `id` as being removed until the host's answer `result` settles. */
  hold: <T>(id: string, result: T) => T;
}

/**
 * Remembers which queued messages the host is still removing, so a change made meanwhile (another
 * removal, a saved edit) replaces the queue without them rather than bringing them back.
 */
export function useChatQueueRemovals(): ChatQueueRemovals {
  const removing = useRef(new Set<string>());
  return useMemo(
    () => ({
      without: (queue) => queue.filter((entry) => !removing.current.has(entry.id)),
      hold(id, result) {
        if (!isThenable(result)) return result;
        removing.current.add(id);
        const release = () => removing.current.delete(id);
        result.then(release, release);
        return result;
      },
    }),
    [],
  );
}

/** A steer the host has not accepted yet, in the conversation it was started in. */
interface PendingSteer {
  id: string;
  conversationId: string | undefined;
}

/**
 * The queued message of the shown conversation whose steer the host has not accepted yet, while
 * its other Steer buttons wait for it, and the press that starts one: its button shows its own
 * wait. Each steer waits in its own conversation, so another conversation's buttons stay free.
 */
function useSteering(options: ChatQueueProps['options'], track: ChatProgress['track']) {
  const { conversationId } = options;
  const [steers, setSteers] = useState<readonly PendingSteer[]>([]);
  const latestConversation = useLatest(conversationId);
  const steer = (id: string) => {
    const result = track('steer', options.onSteer?.(id));
    if (!isThenable(result)) return undefined;
    const entry = { id, conversationId: latestConversation.current };
    setSteers((list) => [...list, entry]);
    const settle = () => setSteers((list) => list.filter((item) => item !== entry));
    return Promise.resolve(result).finally(settle);
  };
  const steeringId = steers.find((entry) => entry.conversationId === conversationId)?.id;
  return { steeringId, steer };
}

/** Tells the host which queued message the composer edits, and when the edit ends. */
function useQueuedEditReport(
  editingId: string | undefined,
  onQueuedEditChange: ((id: string | undefined) => void) | undefined,
) {
  useEffect(() => {
    if (editingId === undefined || !onQueuedEditChange) return undefined;
    onQueuedEditChange(editingId);
    return () => onQueuedEditChange(undefined);
  }, [editingId, onQueuedEditChange]);
}

/**
 * The messages waiting for the running reply to end, in the order they will go out, each with its
 * text and files, Steer (send it now), Edit (in the composer) and Remove. Focus stays in the list as
 * messages leave it. The message the composer edits has no Steer, and the host hears which one it
 * is, so an unsaved edit is never sent or lost; removing it ends the edit at once. A steer or a
 * removal the host takes time to accept shows its button busy, and a steer marks its message.
 */
export function ChatQueue({ options, state, track, removals }: ChatQueueProps) {
  const { queue = noQueue, onQueueChange, onSteer, onQueuedEditChange } = options;
  const editingId = state.editing?.kind === 'queued' ? state.editing.id : undefined;
  const { cancelEdit, composerRef } = state;
  const strings = useUiStrings();
  useQueuedEditReport(editingId, onQueuedEditChange);
  const labelId = useId();
  const removal = useRemovalFocus(queue, composerRef);
  const { steeringId, steer } = useSteering(options, track);
  if (queue.length === 0) return null;
  return (
    <div {...hooks.slot('queue')}>
      <div id={labelId} {...hooks.slot('queue-label')}>
        {strings.chatQueuedMessages(queue.length)}
      </div>
      <ol {...hooks.slot('queue-list')} aria-labelledby={labelId}>
        {queue.map((entry, index) => (
          <li
            key={entry.id}
            {...hooks.slot('queue-item', {
              editing: entry.id === editingId,
              steering: entry.id === steeringId,
            })}
          >
            {entry.text ? <span {...hooks.slot('queue-text')}>{entry.text}</span> : null}
            {entry.attachments?.length ? (
              <ChatAttachmentList
                attachments={entry.attachments}
                className={hooks.slotClass('queue-attachments')}
              />
            ) : null}
            {onSteer && entry.id !== editingId ? (
              <Button
                icon={SendGlyph}
                label={strings.chatSteerQueued(index + 1)}
                size="sm"
                className={hooks.slotClass('queue-steer')}
                isDisabled={steeringId !== undefined && steeringId !== entry.id}
                pendingDelay={chatProgressDelay}
                onError={options.onSendError}
                onPress={() => {
                  removal.willRemove(entry.id);
                  return steer(entry.id);
                }}
              />
            ) : null}
            {onQueueChange ? (
              <>
                <Button
                  icon={EditGlyph}
                  label={strings.chatEditQueued(index + 1)}
                  size="sm"
                  className={hooks.slotClass('queue-edit')}
                  onPress={() => state.startEdit({ kind: 'queued', id: entry.id })}
                />
                <Button
                  ref={(button) => removal.register(entry.id, button)}
                  icon={CloseGlyph}
                  label={strings.chatRemoveQueued(index + 1)}
                  size="sm"
                  className={hooks.slotClass('queue-remove')}
                  pendingDelay={chatProgressDelay}
                  onError={options.onSendError}
                  onPress={() => {
                    removal.willRemove(entry.id);
                    // The edit ends with the press, whenever the host drops the message.
                    if (entry.id === editingId) cancelEdit();
                    const rest = removals.without(queue).filter((item) => item.id !== entry.id);
                    return removals.hold(entry.id, track('remove', onQueueChange(rest)));
                  }}
                />
              </>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
