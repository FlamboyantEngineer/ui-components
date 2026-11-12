'use client';

import { type KeyboardEvent, useId } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { joinIds } from '../../utils/join-ids.js';
import { CodeEditor, type CodeToken } from '../code-editor/code-editor.js';
import {
  Field,
  type FieldInputProps,
  type FieldState,
  type FieldTextInputProps,
  toAriaControlProps,
  useFieldControl,
} from '../field/field.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { renderKatexMath } from './katex-renderer.js';
import { MathPreviewContent } from './math-preview.js';
import { mathFieldHooks as hooks, mathPreviewHooks } from './math-preview-hooks.js';
import {
  DEFAULT_MATH_MAX_LENGTH,
  type MathDisplay,
  type MathRenderer,
  useMathRender,
} from './math-render.js';

export interface MathFieldProps
  extends FieldInputProps<string>, Pick<FieldTextInputProps, 'placeholder'> {
  /** How the preview sets the math: `inline` or `display` (the default). */
  display?: MathDisplay | undefined;
  /** Typesets the source to MathML. Defaults to KaTeX, loaded the first time it is needed. */
  renderer?: MathRenderer | undefined;
  /** The longest source previewed, in characters. Defaults to 10000. */
  maxLength?: number | undefined;
  /**
   * Finishes the edit from the keyboard: the source commits and `onSubmit` runs with it, changed or
   * not. Inline math is then one line and Enter submits; display math submits on Ctrl or Cmd with
   * Enter, and Enter breaks the line. Without it, Enter breaks the line.
   */
  onSubmit?: ((value: string) => void) | undefined;
  /** Called on Escape, after a changed source goes back to the committed one; Escape stops here. */
  onCancel?: (() => void) | undefined;
}

/** Splits LaTeX into commands, braces, digits and plain text for highlighting. */
function tokenizeLatex(source: string): CodeToken[] {
  return [
    ...source.matchAll(
      /(\\(?:[A-Za-z]+|.?))|([{}[\]])|([_^&])|(\d+(?:\.\d+)?)|([^\\{}[\]_^&\d]+)/gs,
    ),
  ].map((match) => ({
    text: match[0],
    type: match[1]
      ? 'keyword'
      : match[2]
        ? 'punctuation'
        : match[3]
          ? 'operator'
          : match[4]
            ? 'number'
            : null,
  }));
}

interface MathKeyOptions {
  state: FieldState<string>;
  display: MathDisplay;
  onSubmit: ((value: string) => void) | undefined;
  onCancel: (() => void) | undefined;
}

/**
 * Escape puts the committed source back, and goes no further when it changed something or the
 * caller cancels; the submit key submits when the caller asked for it.
 */
function createKeyHandler({ state, display, onSubmit, onCancel }: MathKeyOptions) {
  return (event: KeyboardEvent) => {
    if (isComposingKey(event.nativeEvent)) return;
    const isSubmitKey =
      event.key === 'Enter' && (display === 'inline' || event.ctrlKey || event.metaKey);
    if (isSubmitKey && onSubmit && !state.isReadOnly) {
      event.preventDefault();
      event.stopPropagation();
      state.commit();
      onSubmit(state.value);
      return;
    }
    if (event.key !== 'Escape' || (!state.isDirty && !onCancel)) return;
    event.preventDefault();
    event.stopPropagation();
    state.restore();
    onCancel?.();
  };
}

/**
 * A field for LaTeX source with a live preview below it: the source editor keeps its text, caret
 * and focus while the preview typesets, and a source that does not typeset says why. Leaving the
 * field commits; Escape restores the committed source. With `onSubmit` Enter (inline) or Ctrl or
 * Cmd with Enter (display) commits too, and with
 * `onCancel` Escape always stops at the field, so the field can edit math in place inside a document
 * (where `controlRef` focuses it and it takes focus on mount only with `autoFocus`). Inserting the math into a document,
 * numbering equations and storing the source stay with the host.
 */
export function MathField(props: MathFieldProps) {
  const strings = useUiStrings();
  const previewId = useId();
  const { state, field, rest } = useFieldControl<string, MathFieldProps>(props, {
    initialValue: '',
    emptyValue: '',
  });
  const {
    display = 'display',
    renderer = renderKatexMath,
    maxLength = DEFAULT_MATH_MAX_LENGTH,
  } = rest;
  const preview = useMathRender({ source: state.value, display, renderer, maxLength });
  const problem =
    preview.status === 'invalid'
      ? preview.isTooLong
        ? strings.mathTooLong(maxLength)
        : preview.message
      : null;
  return (
    <Field
      state={state}
      {...field}
      {...hooks.root({ className: field.className, data: { display, status: preview.status } })}
      commitOnBlur
    >
      {(control) => {
        const { validationBehavior: _behavior, ...ariaProps } = toAriaControlProps(control);
        return (
          <>
            <CodeEditor
              {...ariaProps}
              aria-describedby={joinIds(ariaProps['aria-describedby'], previewId)}
              variant="surface"
              ref={control.ref}
              className={hooks.slotClass('editor')}
              lineNumbers={false}
              wrap="soft"
              size="sm"
              value={state.value}
              onChange={state.setValue}
              tokenize={tokenizeLatex}
              placeholder={rest.placeholder}
              multiline={!(rest.onSubmit && display === 'inline')}
              onKeyDown={createKeyHandler({
                state,
                display,
                onSubmit: rest.onSubmit,
                onCancel: rest.onCancel,
              })}
            />
            <div
              {...hooks.slot('preview')}
              id={previewId}
              aria-label={strings.mathPreview}
              role="group"
            >
              <span
                {...mathPreviewHooks.root({
                  data: { display, status: preview.status, stale: preview.isStale },
                })}
              >
                <MathPreviewContent preview={preview} source={state.value} maxLength={maxLength} />
              </span>
            </div>
            <VisuallyHidden as="span" className={hooks.slotClass('status')} role="status">
              {problem ?? ''}
            </VisuallyHidden>
          </>
        );
      }}
    </Field>
  );
}
