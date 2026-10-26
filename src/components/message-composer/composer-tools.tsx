import { FileTrigger } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { useFocusHandback } from '../../utils/use-focus-handback.js';
import { EmojiPickerTrigger } from '../emoji-picker/emoji-picker.js';
import { Button } from '../button/button.js';
import { composerHooks as hooks } from './composer-hooks.js';
import type { MessageComposerSubmitShortcut } from './message-composer.js';
import { attachChosenFiles } from './use-file-drop.js';

/** What the action button does: send, stop the pending reply, or save the edited message. */
export type ComposerActionMode = 'send' | 'stop' | 'save';

export interface ComposerActionProps {
  mode: ComposerActionMode;
  canSubmit: boolean;
  isPending: boolean;
  isDisabled: boolean;
  shortcut: MessageComposerSubmitShortcut;
  onSubmit: () => void;
  onStop: (() => void) | undefined;
}

/** Opens the system file chooser and hands the chosen files to `onAttach`. */
export function AttachButton({
  onAttach,
  isDisabled,
}: {
  onAttach: (files: File[]) => void;
  isDisabled: boolean;
}) {
  const strings = useUiStrings();
  return (
    <FileTrigger allowsMultiple onSelect={(list) => attachChosenFiles(list, onAttach)}>
      <Button
        className={hooks.slotClass('attach')}
        icon="attach"
        label={strings.attachFiles}
        size="sm"
        isDisabled={isDisabled}
      />
    </FileTrigger>
  );
}

/**
 * Opens the emoji picker; the chosen emoji (or a custom emoji's `:shortcode:`) goes in at the
 * caret, and focus goes back to the text once the picker has closed.
 */
export function EmojiButton({
  onInsert,
  focusInput,
  isDisabled,
}: {
  onInsert: (text: string) => void;
  focusInput: () => void;
  isDisabled: boolean;
}) {
  const strings = useUiStrings();
  const handback = useFocusHandback(focusInput);
  return (
    <EmojiPickerTrigger
      onSelect={(selection) => {
        onInsert(
          selection.kind === 'native' ? selection.unicode : `:${selection.emoji.shortcode}:`,
        );
        handback.request();
      }}
    >
      <Button
        ref={handback.ref}
        className={hooks.slotClass('emoji')}
        icon="emoji"
        label={strings.insertEmoji}
        size="sm"
        isDisabled={isDisabled}
      />
    </EmojiPickerTrigger>
  );
}

/** Leaves edit mode without saving. */
export function CancelButton({
  onCancel,
  isDisabled,
}: {
  onCancel: (() => void) | undefined;
  isDisabled: boolean;
}) {
  const strings = useUiStrings();
  return (
    <Button
      className={hooks.slotClass('cancel')}
      icon="close"
      label={strings.cancel}
      variant="secondary"
      isDisabled={isDisabled}
      preventFocusOnPress
      onPress={onCancel}
    />
  );
}

/** The send button, Stop while a stoppable reply is pending, or Save while editing: one button that keeps focus. */
export function ComposerAction(props: ComposerActionProps) {
  const { mode, isDisabled } = props;
  const strings = useUiStrings();
  const isStop = mode === 'stop';
  return (
    <Button
      className={hooks.slotClass('action')}
      icon={mode}
      label={strings[mode]}
      variant={isStop ? 'secondary' : 'primary'}
      shortcut={isStop ? undefined : props.shortcut}
      // A tooltip in both states keeps one button, so keyboard focus on it survives the switch.
      tooltip={isStop ? strings.stop : undefined}
      isPending={!isStop && props.isPending}
      isDisabled={isDisabled || (!isStop && !props.canSubmit)}
      focusableWhenDisabled={!isDisabled}
      preventFocusOnPress
      onPress={isStop ? props.onStop : props.onSubmit}
    />
  );
}
