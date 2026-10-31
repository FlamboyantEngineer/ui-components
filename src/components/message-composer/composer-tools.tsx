'use client';

import {
  AttachGlyph,
  CloseGlyph,
  EmojiGlyph,
  SaveGlyph,
  SendGlyph,
  StopGlyph,
} from '../../core/glyphs.js';
import { useLayoutEffect } from 'react';
import { FileTrigger } from '../../primitives/index.js';
import { mergeClassNames } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useFocusHandback } from '../../utils/use-focus-handback.js';
import { EmojiPickerTrigger } from '../emoji-picker/emoji-picker.js';
import { Button } from '../button/button.js';
import { useComposerControlsValue, type ComposerControlsValue } from './composer-controls.js';
import { composerHooks as hooks } from './composer-hooks.js';
import { attachChosenFiles } from './use-file-drop.js';

export type MessageComposerAttachButtonProps = BaseProps;

export type MessageComposerEmojiButtonProps = BaseProps;

export type MessageComposerSendButtonProps = BaseProps;

/** What the action button does: send, stop the pending reply, or save the edited message. */
type ComposerActionMode = 'send' | 'stop' | 'save';

function toActionMode(composer: ComposerControlsValue): ComposerActionMode {
  if (composer.isEditing) return 'save';
  // A composer that sends while pending offers Stop only while there is nothing to send.
  const isSending = composer.allowsPendingSubmit && composer.canSubmit;
  return composer.isPending && composer.onStop && !isSending ? 'stop' : 'send';
}

/**
 * Opens the system file chooser and hands the chosen files to the composer's `onAttach`; without
 * `onAttach` it renders nothing.
 */
export function MessageComposerAttachButton(props: MessageComposerAttachButtonProps) {
  const strings = useUiStrings();
  const composer = useComposerControlsValue('MessageComposerAttachButton');
  const { onAttach } = composer;
  if (!onAttach) return null;
  return (
    <FileTrigger allowsMultiple onSelect={(list) => attachChosenFiles(list, onAttach)}>
      <Button
        {...props}
        className={mergeClassNames(hooks.slotClass('attach'), props.className)}
        icon={AttachGlyph}
        label={strings.attachFiles}
        size="sm"
        isDisabled={composer.isDisabled}
      />
    </FileTrigger>
  );
}

/**
 * Opens the emoji picker; the chosen emoji (or a custom emoji's `:shortcode:`) goes in at the
 * caret, and focus goes back to the text once the picker has closed.
 */
export function MessageComposerEmojiButton(props: MessageComposerEmojiButtonProps) {
  const strings = useUiStrings();
  const composer = useComposerControlsValue('MessageComposerEmojiButton');
  const handback = useFocusHandback(composer.focusInput);
  return (
    <EmojiPickerTrigger
      onSelect={(selection) => {
        composer.insertText(
          selection.kind === 'native' ? selection.unicode : `:${selection.emoji.shortcode}:`,
        );
        handback.request();
      }}
    >
      <Button
        {...props}
        ref={handback.ref}
        className={mergeClassNames(hooks.slotClass('emoji'), props.className)}
        icon={EmojiGlyph}
        label={strings.insertEmoji}
        size="sm"
        isDisabled={composer.isDisabled}
      />
    </EmojiPickerTrigger>
  );
}

/** Leaves edit mode without saving. */
function CancelButton({ composer }: { composer: ComposerControlsValue }) {
  const strings = useUiStrings();
  return (
    <Button
      className={hooks.slotClass('cancel')}
      icon={CloseGlyph}
      label={strings.cancel}
      variant="secondary"
      isDisabled={composer.isDisabled}
      preventFocusOnPress
      onPress={composer.onCancel}
    />
  );
}

/**
 * Cancel while editing, then the send button, Stop while a stoppable reply is pending, or Save
 * while editing: one button that keeps focus as it switches.
 */
export function ComposerSendControl({
  composer,
  ...props
}: MessageComposerSendButtonProps & { composer: ComposerControlsValue }) {
  const strings = useUiStrings();
  const { isDisabled } = composer;
  const mode = toActionMode(composer);
  const isStop = mode === 'stop';
  const isPending = composer.isPending && !composer.allowsPendingSubmit;
  return (
    <>
      {composer.isEditing ? <CancelButton composer={composer} /> : null}
      <Button
        {...props}
        className={mergeClassNames(hooks.slotClass('action'), props.className)}
        icon={{ send: SendGlyph, stop: StopGlyph, save: SaveGlyph }[mode]}
        label={strings[mode]}
        variant={isStop ? 'secondary' : 'primary'}
        shortcut={isStop ? undefined : composer.submitShortcut}
        // A tooltip in both states keeps one button, so keyboard focus on it survives the switch.
        tooltip={isStop ? strings.stop : undefined}
        isPending={!isStop && isPending}
        isDisabled={isDisabled || (!isStop && !composer.canSubmit)}
        focusableWhenDisabled={!isDisabled}
        preventFocusOnPress
        onPress={isStop ? composer.onStop : composer.submit}
      />
    </>
  );
}

/**
 * The composer's send button where the host places it among the controls, so the composer adds none
 * of its own: Send, Stop or Save, after Cancel while editing.
 */
export function MessageComposerSendButton(props: MessageComposerSendButtonProps) {
  const composer = useComposerControlsValue('MessageComposerSendButton');
  const { registerSendButton } = composer;
  useLayoutEffect(registerSendButton, [registerSendButton]);
  return <ComposerSendControl {...props} composer={composer} />;
}
