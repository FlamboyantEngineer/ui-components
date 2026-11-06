'use client';

import {
  type CompositionEvent,
  type KeyboardEvent,
  type RefObject,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { useMergedRefs } from '../../utils/use-merged-refs.js';
import { FieldFormValue, type FieldIssues } from '../field/field.js';
import {
  TextField,
  type TextFieldControlProps,
  type TextFieldElement,
  type TextFieldProps,
} from '../text-field/text-field.js';
import {
  deleteAcrossLiterals,
  isMaskComplete,
  isNumericMask,
  maskPlaceholder,
  maskText,
  type MaskToken,
  parseTextMask,
  type TextMask,
  unmaskText,
} from './text-mask.js';

/** What a masked field submits with its form: the raw characters, or the formatted text. */
export type MaskedTextFieldFormValue = 'raw' | 'formatted';

export interface MaskedTextFieldProps extends Omit<
  TextFieldProps,
  | 'type'
  | 'multiline'
  | 'minRows'
  | 'maxRows'
  | 'textAreaRef'
  | 'transformInput'
  | 'displayValue'
  | 'completions'
  | 'renderCompletion'
  | 'allowsReveal'
  | 'isRevealed'
  | 'defaultRevealed'
  | 'onRevealChange'
  | 'showCount'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'trim'
  | 'getLength'
> {
  /**
   * The mask: `9` takes a digit, `a` a letter, `A` a letter in upper case and `*` a letter or a
   * digit; every other character is a literal separator, and `\` makes the next one literal.
   */
  mask: string;
  /** The tokens the mask reads instead of the default ones, each a one-character test. */
  tokens?: Readonly<Record<string, MaskToken>> | undefined;
  /** What the form submits under `name`. Defaults to `raw`. */
  formValue?: MaskedTextFieldFormValue | undefined;
}

const hooks = createHooks('masked-text-field');

/**
 * Backspace and Delete at a collapsed caret next to literals (UIC-MASKED-TEXT-FIELD-2.2): the key
 * removes the nearest slot character past them, and the caret is put back where it was once the
 * value renders.
 */
function useLiteralDeletion({
  input,
  mask,
  setRaw,
}: {
  input: RefObject<HTMLInputElement | null>;
  mask: TextMask;
  setRaw: (raw: string) => void;
}) {
  const caret = useRef<number | null>(null);
  const [revision, renderAgain] = useReducer((count: number) => count + 1, 0);
  useLayoutEffect(() => {
    const at = caret.current;
    caret.current = null;
    if (at !== null) input.current?.setSelectionRange(at, at);
  }, [revision, input]);
  return (event: KeyboardEvent) => {
    const control = input.current;
    if (!control || control.readOnly || isComposingKey(event.nativeEvent)) return;
    if (event.key !== 'Backspace' && event.key !== 'Delete') return;
    const { selectionStart, selectionEnd } = control;
    if (selectionStart === null || selectionStart !== selectionEnd) return;
    const direction = event.key === 'Backspace' ? -1 : 1;
    const edit = deleteAcrossLiterals(control.value, selectionStart, { direction, mask });
    if (!edit) return;
    event.preventDefault();
    setRaw(edit.raw);
    caret.current = edit.caret;
    renderAgain();
  };
}

/**
 * The text of an input method composition, kept as the browser writes it: the mask reads it once
 * the composition ends, so an upper-case token never rewrites a candidate the reader is choosing.
 */
function useComposition({
  controlProps,
  onEnd,
}: {
  controlProps: TextFieldControlProps | undefined;
  onEnd: (text: string) => void;
}) {
  const [text, setText] = useState<string | null>(null);
  const isComposing = useRef(false);
  return {
    text,
    isActive: () => isComposing.current,
    edit: setText,
    controlProps: {
      ...controlProps,
      onCompositionStart: (event: CompositionEvent<TextFieldElement>) => {
        isComposing.current = true;
        setText(event.currentTarget.value);
        controlProps?.onCompositionStart?.(event);
      },
      onCompositionEnd: (event: CompositionEvent<TextFieldElement>) => {
        isComposing.current = false;
        setText(null);
        onEnd(event.currentTarget.value);
        controlProps?.onCompositionEnd?.(event);
      },
    },
  };
}

/**
 * A text field with a fixed token mask (`(999) 999-9999`, `AAA-9999`). Its value is the raw
 * characters the slots hold, never the separators; the input shows them formatted, with each
 * literal written once a slot after it is filled. Typing, pasting, dropping and autofill keep only
 * the characters each slot accepts, the caret stays after the same accepted characters, and
 * Backspace and Delete next to a separator remove the nearest character past it.
 */
export function MaskedTextField({
  mask: pattern,
  tokens,
  formValue = 'raw',
  value,
  defaultValue,
  committedValue,
  onChange,
  onCommit,
  validate,
  name,
  placeholder,
  inputMode,
  onKeyDown,
  inputRef,
  controlProps,
  className,
  ...props
}: MaskedTextFieldProps) {
  const strings = useUiStrings();
  const mask = useMemo(() => parseTextMask(pattern, tokens), [pattern, tokens]);
  const toRaw = (text: string) => unmaskText(text, mask);
  const toText = (raw: string | undefined) =>
    raw === undefined ? undefined : maskText(toRaw(raw), mask);
  const [raw, setRaw] = useControllableState(
    value === undefined ? undefined : toRaw(value),
    toRaw(defaultValue ?? ''),
    onChange,
  );
  const input = useRef<HTMLInputElement | null>(null);
  const ref = useMergedRefs(input, inputRef);
  const composition = useComposition({ controlProps, onEnd: (text) => setRaw(toRaw(text)) });
  const isComplete = isMaskComplete(raw, mask);
  const check = (text: string): FieldIssues => {
    const characters = toRaw(text);
    if (characters !== '' && !isMaskComplete(characters, mask)) {
      return { severity: 'error', message: strings.maskIncomplete, validity: 'patternMismatch' };
    }
    return validate?.(characters);
  };
  const deleteKey = useLiteralDeletion({ input, mask, setRaw });
  return (
    <>
      <TextField
        {...props}
        {...hooks.root({ className, data: { complete: isComplete } })}
        value={composition.text ?? maskText(raw, mask)}
        defaultValue={toText(defaultValue)}
        committedValue={toText(committedValue)}
        onChange={(text) => (composition.isActive() ? composition.edit(text) : setRaw(toRaw(text)))}
        controlProps={composition.controlProps}
        onCommit={onCommit ? (text) => onCommit(toRaw(text)) : undefined}
        validate={check}
        transformInput={(text) => maskText(toRaw(text), mask)}
        name={formValue === 'formatted' ? name : undefined}
        placeholder={placeholder ?? maskPlaceholder(mask)}
        inputMode={inputMode ?? (isNumericMask(mask) ? 'numeric' : undefined)}
        inputRef={ref}
        onKeyDown={(event) => {
          deleteKey(event);
          if (!event.isDefaultPrevented()) onKeyDown?.(event);
        }}
      />
      {formValue === 'raw' ? (
        <FieldFormValue name={name} value={raw} isDisabled={props.isDisabled ?? false} />
      ) : null}
    </>
  );
}

export type { MaskToken } from './text-mask.js';
