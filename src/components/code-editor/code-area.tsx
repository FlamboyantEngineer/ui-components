'use client';

import type { FocusEvent, Ref, RefObject, TextareaHTMLAttributes } from 'react';
import { TextArea } from '../../primitives/index.js';
import type { AriaLabellingProps, KeyboardEventProps } from '../../core/events.js';
import { toCompletionInputAttributes } from '../completion-list/completion-list.js';
import type { FieldTextInputProps } from '../field/field.js';
import { CodeHighlight } from './code-layers.js';
import { codeEditorHooks as hooks } from './code-editor-hooks.js';
import { alignLayers, type CodeEditorModel } from './use-code-editor.js';
import { isComposingKey } from '../../utils/is-composing-key.js';

/**
 * The caller's props the text area takes as they are. Of the text-entry attributes it takes the
 * hint and the Enter key label; autofill, spelling and the virtual keyboard stay off for code.
 */
export interface CodeTextAreaProps
  extends
    AriaLabellingProps,
    KeyboardEventProps,
    Pick<FieldTextInputProps, 'placeholder' | 'enterKeyHint'> {
  /** The form name: a form submits the source under it. */
  name?: string | undefined;
  /** The id of the element holding the message for an invalid source. */
  'aria-errormessage'?: string | undefined;
  onFocus?: ((event: FocusEvent<HTMLTextAreaElement>) => void) | undefined;
  onBlur?: ((event: FocusEvent<HTMLTextAreaElement>) => void) | undefined;
}

/** What locks the text area and whether it reports a required source. */
interface CodeAreaLocks {
  isReadOnly: boolean;
  isDisabled: boolean;
  isRequired: boolean | undefined;
}

interface CodeAreaProps {
  model: CodeEditorModel;
  value: string;
  onChange: ((value: string) => void) | undefined;
  wrap: 'soft' | 'off';
  /** `false` turns typed and pasted line breaks into spaces. */
  multiline: boolean;
  id: string | undefined;
  /** The caller's text area props, without data attributes. */
  props: CodeTextAreaProps;
  locks: CodeAreaLocks;
  inputRef: Ref<HTMLTextAreaElement>;
  caretRef: RefObject<HTMLSpanElement | null>;
  isInvalid: boolean;
  describedBy: string | undefined;
  /** The completion list's id, when the editor offers completions. */
  listId: string | undefined;
}

type TextAreaAttributes = TextareaHTMLAttributes<HTMLTextAreaElement>;

/** The text area's keys: the completion list, the snippet fields, the editing keys, then the caller's. */
function useKeyProps(model: CodeEditorModel, props: CodeTextAreaProps): TextAreaAttributes {
  const { completion, snippet, hover } = model;
  return {
    onKeyDown: (event) => {
      // Keys an input method owns go to the caller alone: no completion, field, hover or edit.
      if (isComposingKey(event.nativeEvent)) return props.onKeyDown?.(event);
      // Escape ends snippet stepping first, so Escape then Tab leaves even past an open list.
      if (event.key === 'Escape') snippet.end();
      if (completion.handleKeyDown(event) || snippet.handleKeyDown(event)) return;
      if (event.key === 'Escape' && hover.tip) {
        // Handled, so an overlay around the editor stays open for the next Escape.
        event.preventDefault();
        hover.close();
        return;
      }
      if (!model.handleKeyDown(event)) props.onKeyDown?.(event);
    },
    onKeyUp: (event) => {
      completion.handleKeyUp(event);
      props.onKeyUp?.(event);
    },
  };
}

/** The text area's props: the caller's, with the editor's handlers run first. */
function useInputProps(
  model: CodeEditorModel,
  { props, onChange, multiline }: Pick<CodeAreaProps, 'props' | 'onChange' | 'multiline'>,
): TextAreaAttributes {
  const { layers, completion, hover, snippet } = model;
  return {
    spellCheck: false,
    autoComplete: 'off',
    autoCapitalize: 'off',
    autoCorrect: 'off',
    ...props,
    ...useKeyProps(model, props),
    onChange: (event) => {
      const text = event.target.value;
      onChange?.(multiline ? text : text.replace(/\r?\n/g, ' '));
      hover.close();
      completion.track('input');
    },
    onClick: () => completion.track('move'),
    onSelect: (event) => {
      const input = event.currentTarget;
      model.setCaret(input.selectionStart === input.selectionEnd ? input.selectionStart : null);
    },
    onBlur: (event) => {
      completion.close();
      hover.close();
      snippet.end();
      model.setCaret(null);
      props.onBlur?.(event);
    },
    onScroll: () => {
      alignLayers(layers);
      if (completion.isOpen) completion.reposition();
    },
    onPointerMove: (event) => hover.onPointerMove(event),
    onPointerLeave: () => hover.onPointerLeave(),
  };
}

/** The highlighted copy and the text area over it. */
export function CodeArea({ model, props, locks, onChange, ...area }: CodeAreaProps) {
  const { listId, caretRef, inputRef, id, value, wrap, multiline, isInvalid, describedBy } = area;
  const inputProps = useInputProps(model, { props, onChange, multiline });
  return (
    <div {...hooks.slot('code')}>
      <CodeHighlight
        segments={model.segments}
        caretRef={caretRef}
        highlightRef={model.layers.highlight}
      />
      <TextArea
        {...inputProps}
        {...hooks.slot('input')}
        readOnly={locks.isReadOnly}
        disabled={locks.isDisabled}
        aria-required={locks.isRequired || undefined}
        id={id}
        ref={inputRef}
        value={value}
        wrap={wrap}
        rows={multiline ? undefined : 1}
        aria-multiline={multiline ? undefined : false}
        aria-invalid={isInvalid || undefined}
        aria-describedby={describedBy}
        {...(listId === undefined ? {} : toCompletionInputAttributes(model.completion, listId))}
      />
    </div>
  );
}
