'use client';

import { useEffect, useId } from 'react';
import { CloseGlyph, EditGlyph, SendGlyph } from '../../core/glyphs.js';
import { useUiStrings } from '../../core/provider.js';
import { useRemovalFocus } from '../../utils/use-removal-focus.js';
import { Button } from '../button/button.js';
import { ChatAttachmentList } from '../chat-attachment/chat-attachment.js';
import type { ChatQueuedMessage } from '../chat-controller/chat-controller.js';
import type { ChatComposerOptions } from './chat-composer.js';
import { chatHooks as hooks } from './chat-hooks.js';
import type { ChatState } from './use-chat-state.js';

const noQueue: readonly ChatQueuedMessage[] = [];

interface ChatQueueProps {
  options: Pick<ChatComposerOptions, 'queue' | 'onQueueChange' | 'onSteer' | 'onQueuedEditChange'>;
  /** The chat's state: the edit, and the composer that focus goes to when the last message leaves. */
  state: Pick<ChatState, 'editing' | 'startEdit' | 'cancelEdit' | 'composerRef'>;
}

/**
 * The messages waiting for the running reply to end, in the order they will go out, each with its
 * text and files, Steer (send it now), Edit (in the composer) and Remove. Focus stays in the list as
 * messages leave it. The message the composer edits has no Steer, and the host hears which one it
 * is, so an unsaved edit is never sent or lost; removing it ends the edit at once.
 */
export function ChatQueue({ options, state }: ChatQueueProps) {
  const { queue = noQueue, onQueueChange, onSteer, onQueuedEditChange } = options;
  const editingId = state.editing?.kind === 'queued' ? state.editing.id : undefined;
  const { cancelEdit, composerRef } = state;
  const strings = useUiStrings();
  useEffect(() => {
    if (editingId === undefined || !onQueuedEditChange) return undefined;
    onQueuedEditChange(editingId);
    return () => onQueuedEditChange(undefined);
  }, [editingId, onQueuedEditChange]);
  const labelId = useId();
  const removal = useRemovalFocus(queue, composerRef);
  if (queue.length === 0) return null;
  return (
    <div {...hooks.slot('queue')}>
      <div id={labelId} {...hooks.slot('queue-label')}>
        {strings.chatQueuedMessages(queue.length)}
      </div>
      <ol {...hooks.slot('queue-list')} aria-labelledby={labelId}>
        {queue.map((entry, index) => (
          <li key={entry.id} {...hooks.slot('queue-item', { editing: entry.id === editingId })}>
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
                onPress={() => {
                  removal.willRemove(entry.id);
                  onSteer(entry.id);
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
                  onPress={() => {
                    removal.willRemove(entry.id);
                    // The edit ends with the press, whenever the host drops the message.
                    if (entry.id === editingId) cancelEdit();
                    onQueueChange(queue.filter((item) => item.id !== entry.id));
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
