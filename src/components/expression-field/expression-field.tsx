'use client';

import { type KeyboardEvent, type ReactNode, useId } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { joinIds } from '../../utils/join-ids.js';
import { type CodeDiagnostic, CodeEditor, type CodeTokenizer } from '../code-editor/code-editor.js';
import type { Completions } from '../completion-list/completion-list.js';
import {
  Field,
  FieldFormValue,
  type FieldInputProps,
  type FieldState,
  type FieldTextInputProps,
  toAriaControlProps,
  useFieldControl,
} from '../field/field.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';

/**
 * The host's evaluation of an expression. Each result but `unavailable` names the `source` it was
 * evaluated from, so a result for older source shows as stale rather than as the current one.
 */
export type ExpressionFieldResult =
  | { status: 'pending'; source: string }
  | { status: 'ready'; source: string; value: string }
  | { status: 'invalid'; source: string; message: string }
  | { status: 'unavailable'; message?: string | undefined };

export interface ExpressionFieldProps
  extends FieldInputProps<string>, Pick<FieldTextInputProps, 'placeholder'> {
  /** The host's evaluation, shown after the source; the field evaluates and converts nothing. */
  result?: ExpressionFieldResult | undefined;
  /** The expression language: splits the source into tokens for highlighting. */
  tokenize?: CodeTokenizer | undefined;
  /** Names, constants or references to complete at the caret, or a source that completes it. */
  completions?: Completions | undefined;
  /** Problems the host found in the source, marked where they are. */
  diagnostics?: readonly CodeDiagnostic[] | undefined;
  /** The unit the result is in, shown after the source. */
  unit?: string | undefined;
  /** Host controls after the source, such as a button that inserts a reference. */
  actions?: ReactNode;
  /** The form name the source submits under, as typed. */
  name?: string | undefined;
}

const hooks = createHooks('expression-field', [
  'editor',
  'unit',
  'actions',
  'result',
  'result-value',
]);

/** Whether a result was evaluated from source other than `value`, the source the field shows. */
function isStaleResult(result: ExpressionFieldResult, value: string) {
  return result.status !== 'unavailable' && result.source !== value;
}

function ExpressionResult({
  id,
  result,
  value,
}: {
  id: string;
  result: ExpressionFieldResult;
  value: string;
}) {
  const strings = useUiStrings();
  const isStale = isStaleResult(result, value);
  const text =
    result.status === 'ready'
      ? result.value
      : result.status === 'pending'
        ? strings.expressionPending
        : result.status === 'invalid'
          ? result.message
          : (result.message ?? strings.expressionUnavailable);
  return (
    <span {...hooks.slot('result', { status: result.status, stale: isStale })} id={id}>
      <VisuallyHidden as="span">{strings.expressionResult}</VisuallyHidden>{' '}
      <span {...hooks.slot('result-value')}>{text}</span>
      {isStale ? (
        <>
          {' '}
          <VisuallyHidden as="span">({strings.expressionStale})</VisuallyHidden>
        </>
      ) : null}
    </span>
  );
}

/** Enter commits the source; Escape puts the committed source back and goes no further. */
function createKeyHandler(state: FieldState<string>) {
  return (event: KeyboardEvent) => {
    if (isComposingKey(event.nativeEvent)) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      state.commit();
    } else if (event.key === 'Escape' && state.isDirty) {
      event.preventDefault();
      event.stopPropagation();
      state.restore();
    }
  };
}

/**
 * A field for authored expression or decimal text, kept as the string the reader typed: never
 * parsed, rounded or converted to a number, so `1e-100` or a literal with more digits than a
 * number holds survives as written. The host evaluates the source and passes its `result`; Enter or
 * leaving the field commits, Escape restores the committed source.
 */
export function ExpressionField(props: ExpressionFieldProps) {
  const resultId = useId();
  const { state, field, rest } = useFieldControl<string, ExpressionFieldProps>(props, {
    initialValue: '',
    emptyValue: '',
  });
  const { result, tokenize, completions, diagnostics, unit, actions, placeholder, name } = rest;
  const status = result ? result.status : null;
  return (
    <Field
      state={state}
      {...field}
      {...hooks.root({
        className: field.className,
        data: {
          status,
          stale: result ? isStaleResult(result, state.value) : false,
        },
      })}
      commitOnBlur
    >
      {(control) => {
        const { validationBehavior: _behavior, ...ariaProps } = toAriaControlProps(control);
        return (
          <>
            <CodeEditor
              {...ariaProps}
              aria-describedby={joinIds(ariaProps['aria-describedby'], result ? resultId : null)}
              variant="surface"
              ref={control.ref}
              className={hooks.slotClass('editor')}
              multiline={false}
              value={state.value}
              onChange={state.setValue}
              tokenize={tokenize}
              completions={completions}
              diagnostics={diagnostics}
              placeholder={placeholder}
              onKeyDown={createKeyHandler(state)}
            />
            {unit ? <span {...hooks.slot('unit')}>{unit}</span> : null}
            {actions ? <span {...hooks.slot('actions')}>{actions}</span> : null}
            <FieldFormValue name={name} value={state.value} isDisabled={state.isDisabled} />
            {result ? <ExpressionResult id={resultId} result={result} value={state.value} /> : null}
          </>
        );
      }}
    </Field>
  );
}
