'use client';

import { useRef, type RefObject, type TextareaHTMLAttributes } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
import { useAutoGrow } from '../../utils/use-auto-grow.js';
import { useTextCompletions, type TextCompletions } from '../completion-list/completion-list.js';
import type { ComposerFrameModel } from './composer-frame.js';
import { runComposerKey, useComposerKeys } from './composer-keys.js';
import {
  createMessageCodec,
  tokenTriggers,
  type MessageComposerToken,
} from './composer-message.js';
import type { MessageComposerProps, MessageComposerSharedProps } from './message-composer.js';
import { useComposerState, type ComposerFormat } from './use-composer-state.js';
import { attachPastedFiles } from './use-file-drop.js';

interface MessageComposerModel {
  rootRef: RefObject<HTMLDivElement | null>;
  /** The text area's props: its value, name, limits and handlers. */
  inputProps: TextareaHTMLAttributes<HTMLTextAreaElement> & {
    ref: (node: HTMLTextAreaElement | null) => void;
  };
  completion: TextCompletions;
  /** What the frame around the text area shows and calls. */
  frame: ComposerFrameModel;
}

const plainFormat: ComposerFormat<string> = {
  empty: '',
  toText: (value) => value,
  fromText: (text) => text,
  codec: createMessageCodec(
    (text) => ({ text, tokens: [] }),
    (message) => message.text,
  ),
};

/** The input's name: the caller's label or labelling element, else the provider's `message`. */
export function toComposerLabelling(props: MessageComposerSharedProps, fallback: string) {
  const labelledBy = props['aria-labelledby'];
  return {
    'aria-label': labelledBy ? props['aria-label'] : (props['aria-label'] ?? fallback),
    'aria-labelledby': labelledBy,
    'aria-describedby': props['aria-describedby'],
    'aria-details': props['aria-details'],
  };
}

/**
 * Inserting text at the text area's caret, and putting the caret after it once focus is back. A
 * mention or command goes in as its text, since the plain composer has no pills. A disabled
 * composer takes nothing, such as an emoji chosen as it locked.
 */
function useCaretInsertion(
  inputRef: RefObject<HTMLTextAreaElement | null>,
  text: { value: string; setValue: (value: string) => void },
  isDisabled: boolean,
) {
  const caret = useRef<number | null>(null);
  const insertText = (inserted: string) => {
    if (isDisabled) return;
    const area = inputRef.current;
    const start = area?.selectionStart ?? text.value.length;
    const end = area?.selectionEnd ?? start;
    caret.current = start + inserted.length;
    text.setValue(`${text.value.slice(0, start)}${inserted}${text.value.slice(end)}`);
  };
  return {
    insertText,
    insertPill(pill: Pick<MessageComposerToken, 'kind' | 'label'>) {
      insertText(`${tokenTriggers[pill.kind]}${pill.label} `);
    },
    focusInput() {
      const area = inputRef.current;
      area?.focus();
      if (area && caret.current !== null) area.setSelectionRange(caret.current, caret.current);
      caret.current = null;
    },
  };
}

/**
 * The plain composer: its text, the growing text area, its completions and its keys. The
 * completion list's keys come first, then the sending chords, Escape and the recall arrows, then the
 * caller's keys.
 */
export function useMessageComposer(props: MessageComposerProps): MessageComposerModel {
  const { completions, isPending = false, isDisabled = false, minRows = 1, maxRows = 8 } = props;
  const strings = useUiStrings();
  const state = useComposerState({
    ...props,
    isBlocked: isDisabled || (isPending && !props.allowsPendingSubmit),
    onSubmitNow: isPending && !isDisabled ? props.onSubmitNow : undefined,
    format: plainFormat,
  });
  const keys = useComposerKeys(props.shortcuts, { isPending, isEditing: state.isEditing });
  const rootRef = useRef<HTMLDivElement>(null);
  const [inputRef, textAreaRef] = useForwardedRef(props.ref);
  useAutoGrow(inputRef, { minRows, maxRows, value: state.value });
  const completion = useTextCompletions({
    completions,
    inputRef,
    isLocked: isDisabled,
    setValue: state.setValue,
  });
  const model = completions ? completion.model : null;
  const caret = useCaretInsertion(inputRef, state, isDisabled);
  const actions = { ...state, keys, onCancel: props.onCancel };
  const inputProps: MessageComposerModel['inputProps'] = {
    ...(completions ? completion.inputProps : {}),
    ...toComposerLabelling(props, strings.message),
    id: props.inputId,
    ref: textAreaRef,
    value: state.value,
    rows: minRows,
    placeholder: props.placeholder,
    maxLength: props.maxLength,
    disabled: isDisabled,
    onChange: (event) => {
      state.setValue(event.target.value);
      model?.track('input');
    },
    onKeyDown: (event) => {
      if (model?.handleKeyDown(event) || model?.revealOnTab(event)) return;
      if (!runComposerKey(event.nativeEvent, actions)) return props.onKeyDown?.(event);
      event.preventDefault();
    },
    onKeyUp: (event) => {
      model?.handleKeyUp(event);
      props.onKeyUp?.(event);
    },
    onPaste: (event) => attachPastedFiles(event, isDisabled ? undefined : props.onAttach),
    onFocus: props.onFocus,
    onBlur: (event) => {
      model?.close();
      state.flushDraft();
      props.onBlur?.(event);
    },
  };
  return { rootRef, inputProps, completion, frame: { ...state, keys, ...caret } };
}
