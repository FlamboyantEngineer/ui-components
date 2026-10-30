import { CloseGlyph, EditGlyph } from '../../core/glyphs.js';
import { useId, type RefObject } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { useRemovalFocus } from '../../utils/use-removal-focus.js';
import type { ChatQueuedMessage } from '../chat-controller/chat-controller.js';
import { Button } from '../button/button.js';
import { ChatAttachmentList } from '../chat-attachment/chat-attachment.js';
import { chatHooks as hooks } from './chat-hooks.js';

interface ChatQueueProps {
  queue: readonly ChatQueuedMessage[];
  /** Replaces the queue; without it the queued messages cannot be edited or removed. */
  onQueueChange: ((queue: readonly ChatQueuedMessage[]) => void) | undefined;
  /** Edits a queued message in the composer. */
  onEdit: (id: string) => void;
  /** The queued message the composer edits. */
  editingId: string | undefined;
  /** Where focus goes when the last queued message is removed. */
  composerRef: RefObject<HTMLDivElement | null>;
}

/**
 * The messages waiting for the running reply to end, in the order they will go out, each with its
 * text and files, Edit (in the composer) and Remove. Focus stays in the list as messages are removed.
 */
export function ChatQueue({
  queue,
  onQueueChange,
  onEdit,
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
