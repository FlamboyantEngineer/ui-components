'use client';

import { useDeferredValue, useMemo } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { CodeSurface, type CodeSurfaceProps } from './code-surface.js';
import type { CodeEditorFieldProps } from './code-editor.js';
import { resolveCodeTokenizer } from './code-languages.js';
import {
  Field,
  toAriaControlProps,
  useFieldControl,
  type FieldControlProps,
} from '../field/field.js';
import { createJsonChecker } from './json-check.js';
import { createJsonCompletion, describeJsonAt } from './json-complete.js';
import { formatJson } from './json-text.js';
import { codeEditorHooks as hooks } from './code-editor-hooks.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';

/** The field's control props the surface takes: all of them but the validation behaviour. */
function toSurfaceControlProps(control: FieldControlProps) {
  const { validationBehavior: _behavior, ...props } = toAriaControlProps(control);
  return props;
}

/**
 * A code field with optional JSON parsing and schema validation. JSON follows `schema` when
 * given, with problems marked where they are, completions and hover documentation from the schema,
 * and a Format button that rewrites valid text with standard indentation. It commits when focus
 * leaves the field and when the text is formatted. Blank text is valid unless the field is required.
 */
function CodeFormat({ isDisabled, onPress }: { isDisabled: boolean; onPress: () => void }) {
  const strings = useUiStrings();
  return (
    <Button
      className={hooks.slotClass('format')}
      size="xs"
      variant="ghost"
      isDisabled={isDisabled}
      onPress={onPress}
    >
      {strings.format}
    </Button>
  );
}

function useCodeField({ size = 'md', variant: _variant, ...props }: CodeEditorFieldProps) {
  const strings = useUiStrings();
  const { schema, language = 'text' } = props;
  const isJson = language === 'json';
  const problem = props.diagnostics?.find(
    (problem) => !problem.severity || problem.severity === 'error',
  );
  const check = useMemo(() => createJsonChecker(schema, strings), [schema, strings]);
  const { state, field, rest } = useFieldControl<string, CodeEditorFieldProps>(props, {
    initialValue: '',
    emptyValue: '',
    check: (value) =>
      (isJson ? check(value).issue : null) ??
      (problem ? { severity: 'error', message: problem.message } : null),
  });
  const {
    indent = 2,
    lineNumbers = true,
    placeholder,
    autoCloseBrackets,
    language: _language,
    syntax,
    schema: _schema,
    tokenize,
    diagnostics: suppliedDiagnostics,
    completions: suppliedCompletions,
    renderHover: suppliedHover,
    toolbar: suppliedToolbar,
    ...options
  } = rest;
  // Formatting a large text is slow and only enables the button, so typing never waits for it.
  const shownValue = useDeferredValue(state.value);
  const formatted = useMemo(
    () => (isJson ? formatJson(shownValue, indent) : null),
    [isJson, shownValue, indent],
  );
  const isFormattable = formatted !== null && formatted !== shownValue;
  const diagnostics = [
    ...(isJson ? check(state.value).diagnostics : []),
    ...(suppliedDiagnostics ?? []),
  ];
  const completions = useMemo(() => (schema ? createJsonCompletion(schema) : undefined), [schema]);
  const format = () => {
    const next = formatJson(state.value, indent);
    if (next === null || next === state.value) return;
    state.setValue(next);
    state.commit();
  };
  // A disabled editor keeps the button, disabled, so disabling never changes the editor's size.
  const hasFormat = isJson && !state.isReadOnly;
  // One shape whatever the language and read-only state, so the host's toolbar keeps its elements.
  const toolbar =
    isEmptyNode(suppliedToolbar) && !hasFormat ? null : (
      <>
        {suppliedToolbar}
        {hasFormat ? (
          <CodeFormat isDisabled={state.isDisabled || !isFormattable} onPress={format} />
        ) : null}
      </>
    );
  return {
    state,
    field,
    size,
    language,
    schema,
    isJson,
    options,
    tokenize,
    syntax,
    diagnostics,
    suppliedCompletions,
    completions,
    suppliedHover,
    indent,
    autoCloseBrackets,
    lineNumbers,
    placeholder,
    toolbar,
    wrap: props.wrap ?? 'off',
  };
}
export function CodeField(props: CodeEditorFieldProps) {
  const {
    state,
    field,
    size,
    language,
    schema,
    isJson,
    options,
    tokenize,
    syntax,
    diagnostics,
    suppliedCompletions,
    completions,
    suppliedHover,
    indent,
    autoCloseBrackets,
    lineNumbers,
    placeholder,
    toolbar,
    wrap,
  } = useCodeField(props);
  return (
    <Field
      state={state}
      {...field}
      size={size}
      {...hooks.root({
        className: field.className,
        data: { variant: 'field', language, invalid: state.validation.status === 'invalid' },
      })}
      commitOnBlur
    >
      {(control) => (
        <CodeSurface
          {...(options as Partial<CodeSurfaceProps>)}
          language={language}
          {...toSurfaceControlProps(control)}
          ref={control.ref}
          value={state.value}
          onChange={state.setValue}
          tokenize={tokenize ?? resolveCodeTokenizer({ language, syntax })}
          diagnostics={diagnostics}
          listDiagnostics={props.listDiagnostics ?? false}
          completions={suppliedCompletions ?? (isJson ? completions : undefined)}
          renderHover={
            suppliedHover ??
            (isJson && schema ? (offset) => describeJsonAt(schema, state.value, offset) : undefined)
          }
          indent={indent}
          autoCloseBrackets={autoCloseBrackets}
          size={size}
          wrap={wrap}
          lineNumbers={lineNumbers}
          placeholder={placeholder}
          toolbar={toolbar}
        />
      )}
    </Field>
  );
}
