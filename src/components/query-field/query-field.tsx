'use client';

import { SearchGlyph } from '../../core/glyphs.js';
import { useId, useMemo, type KeyboardEvent } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { CodeEditor, type CodeDiagnostic, type CodeTokenizer } from '../code-editor/code-editor.js';
import type { Completions } from '../completion-list/completion-list.js';
import { Button } from '../button/button.js';

/** A query language, as the functions that read it. */
export interface QueryGrammar {
  /** Splits the query into tokens for highlighting. */
  tokenize?: CodeTokenizer | undefined;
  /** A vocabulary for the word before the caret, or a source that completes the place at the caret. */
  complete?: Completions | undefined;
  /** The problems in a query; an error keeps it from being submitted. */
  diagnose?: ((query: string) => readonly CodeDiagnostic[]) | undefined;
}

export interface QueryFieldProps extends BaseProps {
  /** The visible label, which names the input. */
  label: string;
  /** The language: tokens, completions and problems. */
  grammar: QueryGrammar;
  /** The query, controlled. */
  value?: string | undefined;
  /** The query to start with, uncontrolled. */
  defaultValue?: string | undefined;
  /** Called with the query on each change. */
  onChange?: ((value: string) => void) | undefined;
  /** Called with the query on Enter or the run button, while the grammar reports no error. */
  onSubmit?: ((query: string) => void) | undefined;
  /** Shown while the query is empty. */
  placeholder?: string | undefined;
  /** Keeps the query readable and selectable but refuses every edit. */
  isReadOnly?: boolean | undefined;
  /** Refuses focus and every edit. */
  isDisabled?: boolean | undefined;
}

const hooks = createHooks('query-field', ['label', 'control', 'editor', 'submit']);

/**
 * A one-line input for a query language on `CodeEditor`: the caller's grammar highlights tokens,
 * offers completions and reports problems, which mark the query and list below it. Enter, when no
 * completion is open, or the run button submits a query without errors.
 */
export function QueryField({
  label,
  grammar,
  value: controlledValue,
  defaultValue = '',
  onChange,
  onSubmit,
  placeholder,
  isReadOnly,
  isDisabled = false,
  className,
  id,
  ...rest
}: QueryFieldProps) {
  const strings = useUiStrings();
  const inputId = useId();
  const [value, setValue] = useControllableState(controlledValue, defaultValue, onChange);
  const { diagnose } = grammar;
  const diagnostics = useMemo(() => diagnose?.(value) ?? [], [diagnose, value]);
  const hasError = diagnostics.some(({ severity = 'error' }) => severity === 'error');
  const submit = () => {
    if (!hasError) onSubmit?.(value);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) submit();
  };
  return (
    <div
      {...hooks.root({ className, props: rest, data: { invalid: hasError, disabled: isDisabled } })}
      id={id}
    >
      <label {...hooks.slot('label')} htmlFor={inputId}>
        {label}
      </label>
      <div {...hooks.slot('control')}>
        <CodeEditor
          variant="surface"
          id={inputId}
          className={hooks.slotClass('editor')}
          multiline={false}
          value={value}
          onChange={setValue}
          tokenize={grammar.tokenize}
          completions={grammar.complete}
          diagnostics={diagnose ? diagnostics : undefined}
          placeholder={placeholder}
          isReadOnly={isReadOnly}
          isDisabled={isDisabled}
          onKeyDown={onKeyDown}
        />
        {onSubmit ? (
          <Button
            icon={SearchGlyph}
            size="sm"
            label={strings.runQuery}
            className={hooks.slotClass('submit')}
            isDisabled={isDisabled || hasError}
            onPress={submit}
          />
        ) : null}
      </div>
    </div>
  );
}
