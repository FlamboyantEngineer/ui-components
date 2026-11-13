'use client';

import {
  DeleteGlyph,
  DragHandleGlyph,
  EditGlyph,
  MoreGlyph,
  SendGlyph,
} from '../../core/glyphs.js';
import { useUiStrings } from '../../core/provider.js';
import { armElementDrag } from '../../utils/pointer-drag.js';
import { Button } from '../button/button.js';
import { ChatAttachmentList } from '../chat-attachment/chat-attachment.js';
import type { ChatQueuedMessage } from '../chat-controller/chat-controller.js';
import { Menu, MenuItem, MenuPopover, MenuTrigger } from '../menu/menu.js';
import { chatHooks as hooks } from './chat-hooks.js';
import { chatProgressDelay } from './chat-progress.js';
import { type ChatQueueReorder, useQueueRowDrag } from './chat-queue-reorder.js';

interface ChatQueueItemProps {
  entry: ChatQueuedMessage;
  position: number;
  isEditing: boolean;
  isSteering: boolean;
  isSteerDisabled: boolean;
  reorder: ChatQueueReorder;
  onSteer: (() => void | Promise<unknown>) | undefined;
  onEdit: (() => void) | undefined;
  onRemove: (() => void | Promise<unknown>) | undefined;
  onError: ((error: unknown) => void) | undefined;
  registerRemove: (button: HTMLButtonElement | null) => void;
}

function QueueActions(props: ChatQueueItemProps) {
  const strings = useUiStrings();
  const { position, onSteer, onEdit, onRemove, onError, isSteerDisabled, registerRemove } = props;
  return (
    <>
      {onSteer ? (
        <Button
          startIcon={SendGlyph}
          aria-label={strings.chatSteerQueued(position)}
          size="sm"
          className={hooks.slotClass('queue-steer')}
          isDisabled={isSteerDisabled}
          pendingDelay={chatProgressDelay}
          onError={onError}
          onPress={onSteer}
          variant="ghost"
        >
          {strings.chatSteer}
        </Button>
      ) : null}
      {onRemove ? (
        <Button
          ref={registerRemove}
          icon={DeleteGlyph}
          variant="ghost"
          label={strings.chatRemoveQueued(position)}
          size="sm"
          className={hooks.slotClass('queue-remove')}
          pendingDelay={chatProgressDelay}
          onError={onError}
          onPress={onRemove}
        />
      ) : null}
      {onEdit ? (
        <MenuTrigger>
          <Button
            icon={MoreGlyph}
            variant="ghost"
            label={strings.chatQueueActions(position)}
            size="sm"
            className={hooks.slotClass('queue-menu')}
          />
          <MenuPopover placement="top end">
            <Menu aria-label={strings.chatQueueActions(position)}>
              <MenuItem
                id="edit"
                icon={EditGlyph}
                className={hooks.slotClass('queue-edit')}
                onAction={onEdit}
              >
                {strings.chatEditQueued(position)}
              </MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>
      ) : null}
    </>
  );
}

/** One queued instruction, with handle-only dragging and its actions in a stable order. */
export function ChatQueueItem(props: ChatQueueItemProps) {
  const { entry, position, reorder } = props;
  const strings = useUiStrings();
  const { ref, dragProps, startDrag, describedBy, isDragging, dropPosition } = useQueueRowDrag(
    entry,
    reorder,
  );
  return (
    <li
      ref={ref}
      {...dragProps}
      draggable={false}
      {...hooks.slot('queue-item', {
        editing: props.isEditing,
        steering: props.isSteering,
        dragging: isDragging,
        dropPosition,
      })}
    >
      {reorder.onMove ? (
        <Button
          icon={DragHandleGlyph}
          variant="ghost"
          label={strings.chatReorderQueued(position)}
          size="sm"
          className={hooks.slotClass('queue-handle')}
          aria-describedby={describedBy}
          onPressStart={(event) => {
            const row = event.target.closest('li');
            if (row && event.pointerType !== 'keyboard' && event.pointerType !== 'virtual')
              armElementDrag(row);
          }}
          onPress={startDrag}
        />
      ) : null}
      {entry.text ? (
        <span {...hooks.slot('queue-text')} title={entry.text}>
          {entry.text}
        </span>
      ) : null}
      {entry.attachments?.length ? (
        <ChatAttachmentList
          attachments={entry.attachments}
          className={hooks.slotClass('queue-attachments')}
        />
      ) : null}
      <QueueActions {...props} />
    </li>
  );
}
