import type { FocusEvent, ReactNode, Ref } from 'react';
import { TextArea } from '../../primitives/index.js';
import type { AriaLabellingProps, KeyboardEventProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import {
  ControlCompletionList,
  type Completion,
  type CompletionListItemState,
  type CompletionSource,
} from '../completion-list/completion-list.js';
import { IconButton } from '../icon-button/icon-button.js';
import { useMessageComposer } from './use-message-composer.js';

/** The chord that sends: Enter (Shift+Enter breaks the line), or Ctrl+Enter (Cmd+Enter on macOS). */
export type MessageComposerSubmitShortcut = 'Enter' | 'Ctrl+Enter';

export interface MessageComposerProps extends BaseProps, AriaLabellingProps, KeyboardEventProps {
  /** The text, controlled. */
  value?: string | undefined;
  /** The text at first, uncontrolled. */
  defaultValue?: string | undefined;
  onChange?: ((value: string) => void) | undefined;
  /** Called with the text when the reader sends it; the composer then empties. */
  onSubmit?: ((value: string) => void) | undefined;
  /** Called when the reader stops the pending reply; with it, a pending composer offers Stop. */
  onStop?: (() => void) | undefined;
  /** A reply is on its way: sending waits, and Send becomes Stop when `onStop` is set. */
  isPending?: boolean | undefined;
  /** Refuses focus, edits and sending. */
  isDisabled?: boolean | undefined;
  /** Shown while the text is empty. */
  placeholder?: string | undefined;
  /** The chord that sends. Defaults to `Enter`. */
  submitShortcut?: MessageComposerSubmitShortcut | undefined;
  /** The rows the text area shows at least. Defaults to 1. */
  minRows?: number | undefined;
  /** The rows the text area grows to before it scrolls. Defaults to 8. */
  maxRows?: number | undefined;
  /** The most characters the text may hold. */
  maxLength?: number | undefined;
  /** Sends blank text too, as when attachments carry the message. */
  allowsEmptySubmit?: boolean | undefined;
  /** A vocabulary for the word before the caret, or a source such as `@` mentions. */
  completions?: readonly Completion[] | CompletionSource | undefined;
  /** Draws a completion's content in the list instead of its label and description. */
  renderCompletion?:
    | ((completion: Completion, state: CompletionListItemState) => ReactNode)
    | undefined;
  /** Content above the text, such as the files attached to the message. */
  attachments?: ReactNode;
  /** Tools before the send button, such as an attach button or a menu. */
  toolbar?: ReactNode;
  onFocus?: ((event: FocusEvent<HTMLTextAreaElement>) => void) | undefined;
  onBlur?: ((event: FocusEvent<HTMLTextAreaElement>) => void) | undefined;
  /** The text area. */
  ref?: Ref<HTMLTextAreaElement> | undefined;
}

const hooks = createHooks('message-composer', [
  'attachments',
  'input',
  'footer',
  'toolbar',
  'action',
  'completions',
]);

/** The send button, or Stop while a stoppable reply is pending, as one button that keeps focus. */
function ComposerAction({
  isStop,
  canSubmit,
  props,
  onSubmit,
}: {
  isStop: boolean;
  canSubmit: boolean;
  props: MessageComposerProps;
  onSubmit: () => void;
}) {
  const strings = useUiStrings();
  return (
    <IconButton
      className={hooks.slotClass('action')}
      icon={isStop ? 'stop' : 'send'}
      label={isStop ? strings.stop : strings.send}
      variant={isStop ? 'secondary' : 'primary'}
      shortcut={isStop ? undefined : (props.submitShortcut ?? 'Enter')}
      // A tooltip in both states keeps one button, so keyboard focus on it survives the switch.
      tooltip={isStop ? strings.stop : undefined}
      isPending={!isStop && Boolean(props.isPending)}
      isDisabled={props.isDisabled || (!isStop && !canSubmit)}
      focusableWhenDisabled={!props.isDisabled}
      preventFocusOnPress
      onPress={isStop ? props.onStop : onSubmit}
    />
  );
}

/**
 * A composer for chat messages and comments: a text area that grows with its text and sends on
 * Enter (or Ctrl+Enter), with attachments above it, tools and a send button below, completions
 * such as `@` mentions, and a pending state that offers Stop while a reply streams.
 */
export function MessageComposer(props: MessageComposerProps) {
  const { className, id, attachments, toolbar, completions } = props;
  const composer = useMessageComposer(props);
  const data = { pending: Boolean(props.isPending), disabled: Boolean(props.isDisabled) };
  return (
    <div {...hooks.root({ className, props, data })} id={id} ref={composer.rootRef}>
      {attachments ? <div {...hooks.slot('attachments')}>{attachments}</div> : null}
      <TextArea {...composer.inputProps} {...hooks.slot('input')} />
      <div {...hooks.slot('footer')}>
        {toolbar ? <div {...hooks.slot('toolbar')}>{toolbar}</div> : null}
        <ComposerAction
          isStop={Boolean(props.isPending && props.onStop)}
          canSubmit={composer.canSubmit}
          props={props}
          onSubmit={composer.submit}
        />
      </div>
      {completions ? (
        <ControlCompletionList
          model={composer.completion.model}
          listId={composer.completion.listId}
          anchorRef={composer.rootRef}
          renderCompletion={props.renderCompletion}
          className={hooks.slotClass('completions')}
        />
      ) : null}
    </div>
  );
}
