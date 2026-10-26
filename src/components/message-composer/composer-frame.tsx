import type { ReactNode, RefObject } from 'react';
import { composerHooks as hooks } from './composer-hooks.js';
import { ComposerMenu } from './composer-menu.js';
import type { MessageComposerToken } from './composer-message.js';
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
  isSubmitting: boolean;
  submit: () => void;
  shortcut: MessageComposerSubmitShortcut;
  /** Inserts text at the caret, as a chosen emoji. */
  insertText: (text: string) => void;
  /** Inserts a mention or command at the caret: a pill in the rich composer, its text in the plain one. */
  insertPill: (pill: Pick<MessageComposerToken, 'kind' | 'id' | 'label'>) => void;
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

/** The built-in tools (the menu or the attach button, then emoji) and the caller's, before the button. */
function ComposerToolbar({ props, model }: Pick<ComposerFrameProps, 'props' | 'model'>) {
  const { menu, onAttach, showEmojiPicker, toolbar } = props;
  const isDisabled = Boolean(props.isDisabled);
  if (!menu && !onAttach && !showEmojiPicker && !toolbar) return null;
  return (
    <div {...hooks.slot('toolbar')}>
      {menu ? (
        <ComposerMenu menu={menu} model={model} onAttach={onAttach} isDisabled={isDisabled} />
      ) : onAttach ? (
        <AttachButton onAttach={onAttach} isDisabled={isDisabled} />
      ) : null}
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
 * while editing and the action button. Files dragged onto it, pasted or chosen go to `onAttach`.
 */
export function ComposerFrame({ props, rootRef, model, children }: ComposerFrameProps) {
  const { className, id, banner, attachments } = props;
  const isDisabled = Boolean(props.isDisabled);
  const drop = useFileDrop(isDisabled ? undefined : props.onAttach);
  const data = {
    pending: Boolean(props.isPending),
    disabled: isDisabled,
    editing: model.isEditing,
    submitting: model.isSubmitting,
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
