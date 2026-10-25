import type { ReactNode, RefObject } from 'react';
import { composerHooks as hooks } from './composer-hooks.js';
import { AttachButton, CancelButton, ComposerAction, EmojiButton } from './composer-tools.js';
import type {
  MessageComposerSharedProps,
  MessageComposerSubmitShortcut,
} from './message-composer.js';
import { useFileDrop } from './use-file-drop.js';

/** What the frame needs from the composer's input, plain or rich. */
export interface ComposerFrameModel {
  isEditing: boolean;
  canSubmit: boolean;
  submit: () => void;
  shortcut: MessageComposerSubmitShortcut;
  /** Inserts text at the caret, as a chosen emoji. */
  insertText: (text: string) => void;
  focusInput: () => void;
}

export interface ComposerFrameProps {
  props: MessageComposerSharedProps;
  rootRef: RefObject<HTMLDivElement | null>;
  model: ComposerFrameModel;
  /** The input and its completion list. */
  children: ReactNode;
}

function toActionMode(props: MessageComposerSharedProps, model: ComposerFrameModel) {
  if (model.isEditing) return 'save';
  // A composer that sends while pending offers Stop only while there is nothing to send.
  const isSending = props.allowsPendingSubmit && model.canSubmit;
  return props.isPending && props.onStop && !isSending ? 'stop' : 'send';
}

/** The built-in tools (attach, emoji) and the caller's, before the button. */
function ComposerToolbar({ props, model }: Pick<ComposerFrameProps, 'props' | 'model'>) {
  const { onAttach, showEmojiPicker, toolbar } = props;
  const isDisabled = Boolean(props.isDisabled);
  if (!onAttach && !showEmojiPicker && !toolbar) return null;
  return (
    <div {...hooks.slot('toolbar')}>
      {onAttach ? <AttachButton onAttach={onAttach} isDisabled={isDisabled} /> : null}
      {showEmojiPicker ? (
        <EmojiButton
          onInsert={model.insertText}
          focusInput={model.focusInput}
          isDisabled={isDisabled}
        />
      ) : null}
      {toolbar}
    </div>
  );
}

/**
 * The composer around its input: the banner, the attachments, the input, then the tools, Cancel
 * while editing and the action button. Files dragged onto it or attached go to `onAttach`.
 */
export function ComposerFrame({ props, rootRef, model, children }: ComposerFrameProps) {
  const { className, id, banner, attachments } = props;
  const isDisabled = Boolean(props.isDisabled);
  const drop = useFileDrop(isDisabled ? undefined : props.onAttach);
  const data = {
    pending: Boolean(props.isPending),
    disabled: isDisabled,
    editing: model.isEditing,
    dropTarget: drop.isDropTarget,
  };
  return (
    <div {...hooks.root({ className, props, data })} id={id} ref={rootRef} {...drop.dropProps}>
      {banner ? <div {...hooks.slot('banner')}>{banner}</div> : null}
      {attachments ? <div {...hooks.slot('attachments')}>{attachments}</div> : null}
      {children}
      <div {...hooks.slot('footer')}>
        <ComposerToolbar props={props} model={model} />
        {model.isEditing ? (
          <CancelButton onCancel={props.onCancel} isDisabled={isDisabled} />
        ) : null}
        <ComposerAction
          mode={toActionMode(props, model)}
          canSubmit={model.canSubmit}
          isPending={Boolean(props.isPending) && !props.allowsPendingSubmit}
          isDisabled={isDisabled}
          shortcut={model.shortcut}
          onSubmit={model.submit}
          onStop={props.onStop}
        />
      </div>
    </div>
  );
}
