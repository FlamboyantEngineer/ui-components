import { useRef, type ReactNode, type RefObject } from 'react';
import {
  ComposerControlsContext,
  useCompactRow,
  useSendButtonRegistry,
  type ComposerControlsValue,
} from './composer-controls.js';
import { composerHooks as hooks } from './composer-hooks.js';
import type { MessageComposerToken } from './composer-message.js';
import { ComposerSendControl } from './composer-tools.js';
import type { ComposerKeys } from './composer-keys.js';
import type { MessageComposerSharedProps } from './message-composer.js';
import { useFileDrop } from './use-file-drop.js';

/** What the frame needs from the composer's input, plain or rich. */
export interface ComposerFrameModel {
  isEditing: boolean;
  canSubmit: boolean;
  isSubmitting: boolean;
  submit: () => void;
  /** The chords that send now; the first shows on the send button. */
  keys: ComposerKeys;
  /** Inserts text at the caret, as a chosen emoji. */
  insertText: (text: string) => void;
  /** Inserts a mention or command at the caret: a pill in the rich composer, its text in the plain one. */
  insertPill: (pill: Pick<MessageComposerToken, 'kind' | 'id' | 'label' | 'recordType'>) => void;
  focusInput: () => void;
}

interface ComposerFrameProps {
  props: MessageComposerSharedProps;
  rootRef: RefObject<HTMLDivElement | null>;
  model: ComposerFrameModel;
  /** The input and its completion list. */
  children: ReactNode;
}

/**
 * The composer around its input: the banner, the attachments, the input, then the row of the host's
 * controls at its start and end, with the send button last unless the host placed it. Files dragged
 * onto it, pasted or chosen go to `onAttach`.
 */
export function ComposerFrame({ props, rootRef, model, children }: ComposerFrameProps) {
  const { className, id, banner, attachments, startControls, endControls } = props;
  const isDisabled = Boolean(props.isDisabled);
  const drop = useFileDrop(isDisabled ? undefined : props.onAttach);
  const footerRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const isCompact = useCompactRow(footerRef, [startRef, endRef]);
  const { hasHostSendButton, registerSendButton } = useSendButtonRegistry();
  const controls: ComposerControlsValue = {
    props,
    model,
    rootRef,
    isCompact,
    isDisabled,
    registerSendButton,
  };
  const data = {
    pending: Boolean(props.isPending),
    disabled: isDisabled,
    editing: model.isEditing,
    submitting: model.isSubmitting,
    dropTarget: drop.isDropTarget,
    compact: isCompact,
  };
  return (
    <div {...hooks.root({ className, props, data })} id={id} ref={rootRef} {...drop.dropProps}>
      {banner ? <div {...hooks.slot('banner')}>{banner}</div> : null}
      {attachments ? <div {...hooks.slot('attachments')}>{attachments}</div> : null}
      {children}
      <ComposerControlsContext.Provider value={controls}>
        <div {...hooks.slot('footer')} ref={footerRef}>
          <div {...hooks.slot('start')} ref={startRef}>
            {startControls}
          </div>
          <div {...hooks.slot('end')} ref={endRef}>
            {endControls}
            {hasHostSendButton ? null : <ComposerSendControl composer={controls} />}
          </div>
        </div>
      </ComposerControlsContext.Provider>
    </div>
  );
}
