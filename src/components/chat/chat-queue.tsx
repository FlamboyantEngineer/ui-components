'use client';

import { type RefObject, useId } from 'react';
import { CloseGlyph, EditGlyph, SendGlyph } from '../../core/glyphs.js';
import { useUiStrings } from '../../core/provider.js';
import { useRemovalFocus } from '../../utils/use-removal-focus.js';
import { Button } from '../button/button.js';
import { ChatAttachmentList } from '../chat-attachment/chat-attachment.js';
import type { ChatQueuedMessage } from '../chat-controller/chat-controller.js';
import { chatHooks as hooks } from './chat-hooks.js';

const noQueue: readonly ChatQueuedMessage[] = [];

interface ChatQueueProps {
  queue: readonly ChatQueuedMessage[] | undefined;
  /** Replaces the queue; without it the queued messages cannot be edited or removed. */
  onQueueChange: ((queue: readonly ChatQueuedMessage[]) => void) | undefined;
  /** Sends a queued message into the conversation now; without it there is no Steer. */
  onSteer: ((id: string) => void) | undefined;
  /** Edits a queued message in the composer. */
  onEdit: (id: string) => void;
  /** Ends the composer's edit of a queued message. */
  onCancelEdit: () => void;
  /** The queued message the composer edits. */
  editingId: string | undefined;
  /** Where focus goes when the last queued message is removed. */
  composerRef: RefObject<HTMLDivElement | null>;
}

/**
 * The messages waiting for the running reply to end, in the order they will go out, each with its
 * text and files, Steer (send it now), Edit (in the composer) and Remove. Focus stays in the list as
 * messages leave it. The message the composer edits has no Steer, so an unsaved edit is never lost,
 * and removing it ends the edit at once.
 */
export function ChatQueue({
  queue = noQueue,
  onQueueChange,
  onSteer,
  onEdit,
  onCancelEdit,
  editingId,
  composerRef,
}: ChatQueueProps) {
  const strings = useUiStrings();
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
                  onPress={() => onEdit(entry.id)}
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
                    if (entry.id === editingId) onCancelEdit();
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
