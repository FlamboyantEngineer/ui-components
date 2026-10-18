import { useRef, type KeyboardEvent, type RefObject, type TextareaHTMLAttributes } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { useUiStrings } from '../../core/provider.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { useAutoGrow } from '../../utils/use-auto-grow.js';
import { useTextCompletions, type TextCompletions } from '../completion-list/completion-list.js';
import type { MessageComposerProps, MessageComposerSubmitShortcut } from './message-composer.js';

export interface MessageComposerModel {
  rootRef: RefObject<HTMLDivElement | null>;
  /** The text area's props: its value, name, limits and handlers. */
  inputProps: TextareaHTMLAttributes<HTMLTextAreaElement> & {
    ref: (node: HTMLTextAreaElement | null) => void;
  };
  completion: TextCompletions;
  /** The text can be sent now. */
  canSubmit: boolean;
  /** Sends the text when it can be sent, then empties the composer. */
  submit: () => void;
}

/** Whether a key sends: the shortcut's chord, outside an input method composition. */
function isSubmitKey(event: KeyboardEvent, shortcut: MessageComposerSubmitShortcut): boolean {
  if (event.key !== 'Enter' || event.altKey || event.shiftKey || event.nativeEvent.isComposing) {
    return false;
  }
  const hasCommand = event.ctrlKey || event.metaKey;
  return shortcut === 'Enter' ? !hasCommand : hasCommand;
}

/** The text area's name: the caller's label or labelling element, else the provider's `message`. */
function toLabelling(props: MessageComposerProps, fallback: string) {
  const labelledBy = props['aria-labelledby'];
  return {
    'aria-label': labelledBy ? props['aria-label'] : (props['aria-label'] ?? fallback),
    'aria-labelledby': labelledBy,
    'aria-describedby': props['aria-describedby'],
    'aria-details': props['aria-details'],
  };
}

/**
 * The composer's state: its text, the growing text area, its completions and the send key. The
 * completion list's keys come first, then the send chord, then the caller's keys.
 */
export function useMessageComposer(props: MessageComposerProps): MessageComposerModel {
  const { completions, isPending = false, isDisabled = false, minRows = 1, maxRows = 8 } = props;
  const strings = useUiStrings();
  const [value, setValue] = useControllableState(
    props.value,
    props.defaultValue ?? '',
    props.onChange,
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useAutoGrow(inputRef, { minRows, maxRows, value });
  const completion = useTextCompletions({ completions, inputRef, isLocked: isDisabled, setValue });
  const model = completions ? completion.model : null;
  const canSubmit = !isDisabled && !isPending && (props.allowsEmptySubmit || value.trim() !== '');
  const submit = () => {
    if (!canSubmit) return;
    props.onSubmit?.(value);
    setValue('');
  };
  const inputProps: MessageComposerModel['inputProps'] = {
    ...(completions ? completion.inputProps : {}),
    ...toLabelling(props, strings.message),
    ref: mergeRefs(inputRef, props.ref),
    value,
    rows: minRows,
    placeholder: props.placeholder,
    maxLength: props.maxLength,
    disabled: isDisabled,
    onChange: (event) => {
      setValue(event.target.value);
      model?.track('input');
    },
    onKeyDown: (event) => {
      if (model?.handleKeyDown(event)) return;
      if (!isSubmitKey(event, props.submitShortcut ?? 'Enter')) return props.onKeyDown?.(event);
      event.preventDefault();
      submit();
    },
    onKeyUp: (event) => {
      model?.handleKeyUp(event);
      props.onKeyUp?.(event);
    },
    onFocus: props.onFocus,
    onBlur: (event) => {
      model?.close();
      props.onBlur?.(event);
    },
  };
  return { rootRef, inputProps, completion, canSubmit, submit };
}
