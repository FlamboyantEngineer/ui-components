'use client';

import { useEffect, useId, useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { isThenable } from '../../utils/is-thenable.js';
import { useRemovalFocus } from '../../utils/use-removal-focus.js';
import type { ChatQueuedMessage } from '../chat-controller/chat-controller.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import type { ChatComposerOptions } from './chat-composer.js';
import { chatHooks as hooks } from './chat-hooks.js';
import type { ChatProgress } from './chat-progress.js';
import { ChatQueueItem } from './chat-queue-item.js';
import { useQueueReorder } from './chat-queue-reorder.js';
import type { ChatState } from './use-chat-state.js';

const noQueue: readonly ChatQueuedMessage[] = [];

interface ChatQueueProps {
  options: Pick<
    ChatComposerOptions,
    'queue' | 'onQueueChange' | 'onSteer' | 'onQueuedEditChange' | 'onSendError'
  >;
  /** The chat's state: the edit, and the composer that focus goes to when the last message leaves. */
  state: Pick<ChatState, 'editing' | 'startEdit' | 'cancelEdit' | 'composerRef'>;
  /** Shows the host's answer under way above the composer while it takes time. */
  track: ChatProgress['track'];
}

/**
 * The queued message whose steer the host has not accepted yet, while the other Steer buttons wait
 * for it, and the press that starts one: its button shows its own wait.
 */
function useSteering(options: ChatQueueProps['options'], track: ChatProgress['track']) {
  const [steeringId, setSteeringId] = useState<string>();
  const steer = (id: string) => {
    const result = track('steer', options.onSteer?.(id));
    if (!isThenable(result)) return undefined;
    setSteeringId(id);
    const settle = () => setSteeringId((current) => (current === id ? undefined : current));
    return Promise.resolve(result).finally(settle);
  };
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
export function ChatQueue({ options, state, track }: ChatQueueProps) {
  const { queue = noQueue, onQueueChange, onSteer, onQueuedEditChange } = options;
  const editingId = state.editing?.kind === 'queued' ? state.editing.id : undefined;
  const { cancelEdit, composerRef } = state;
  const strings = useUiStrings();
  useQueuedEditReport(editingId, onQueuedEditChange);
  const labelId = useId();
  const removal = useRemovalFocus(queue, composerRef);
  const { steeringId, steer } = useSteering(options, track);
  const reorder = useQueueReorder(
    queue,
    onQueueChange
      ? (next) => {
          try {
            const result = onQueueChange(next);
            if (isThenable(result))
              void Promise.resolve(result).catch((error: unknown) => {
                if (!options.onSendError) throw error;
                options.onSendError(error);
              });
          } catch (error) {
            if (!options.onSendError) throw error;
            options.onSendError(error);
          }
        }
      : undefined,
  );
  if (queue.length === 0) return null;
  return (
    <div {...hooks.slot('queue')}>
      <VisuallyHidden as="div" id={labelId} className={hooks.slotClass('queue-label')}>
        {strings.chatQueuedMessages(queue.length)}
      </VisuallyHidden>
      <ol {...hooks.slot('queue-list')} aria-labelledby={labelId}>
        {queue.map((entry, index) => (
          <ChatQueueItem
            key={entry.id}
            entry={entry}
            position={index + 1}
            isEditing={entry.id === editingId}
            isSteering={entry.id === steeringId}
            isSteerDisabled={steeringId !== undefined && steeringId !== entry.id}
            reorder={reorder}
            onSteer={
              onSteer && entry.id !== editingId
                ? () => {
                    removal.willRemove(entry.id);
                    return steer(entry.id);
                  }
                : undefined
            }
            onEdit={
              onQueueChange ? () => state.startEdit({ kind: 'queued', id: entry.id }) : undefined
            }
            onRemove={
              onQueueChange
                ? () => {
                    removal.willRemove(entry.id);
                    if (entry.id === editingId) cancelEdit();
                    return track(
                      'remove',
                      onQueueChange(queue.filter((item) => item.id !== entry.id)),
                    );
                  }
                : undefined
            }
            onError={options.onSendError}
            registerRemove={(button) => removal.register(entry.id, button)}
          />
        ))}
      </ol>
    </div>
  );
}
