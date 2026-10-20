import { useMemo } from 'react';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { CodeEditor, type CodeEditorSize } from '../code-editor/code-editor.js';
import { Field, useFieldControl, type FieldInputProps } from '../field/field.js';
import { checkJsonText } from './json-check.js';
import { createJsonCompletion, describeJsonAt } from './json-complete.js';
import type { JsonSchema } from './json-schema.js';
import { formatJson, tokenizeJson } from './json-text.js';

export interface JsonEditorProps extends FieldInputProps<string> {
  /** Spaces per level when the text is formatted or indented. Defaults to 2. */
  indent?: number | undefined;
  /** Starting height. Defaults to `md`. */
  size?: CodeEditorSize | undefined;
  /** Numbers the lines. Defaults to `true`. */
  lineNumbers?: boolean | undefined;
  /** Shown while the text is empty. */
  placeholder?: string | undefined;
  /** Checks the value against this JSON Schema subset and completes keys and values from it. */
  schema?: JsonSchema | undefined;
  /** Typing an opening bracket or quote inserts its partner. */
  autoCloseBrackets?: boolean | undefined;
}

const hooks = createHooks('json-editor', ['format']);

/**
 * A field for JSON text: a highlighted code editor whose text must parse, and follow `schema` when
 * given, with problems marked where they are, completions and hover documentation from the schema,
 * and a Format button that rewrites valid text with standard indentation. It commits when it loses
 * focus and when the text is formatted. Blank text is valid unless the field is required.
 */
export function JsonEditor(props: JsonEditorProps) {
  const strings = useUiStrings();
  const { schema } = props;
  const { state, field, rest } = useFieldControl<string, JsonEditorProps>(props, {
    initialValue: '',
    emptyValue: '',
    check: (value) => checkJsonText(value, schema, strings).issue,
  });
  const { indent = 2, size = 'md', lineNumbers = true, placeholder, autoCloseBrackets } = rest;
  const formatted = formatJson(state.value, indent);
  const { diagnostics } = checkJsonText(state.value, schema, strings);
  const completions = useMemo(() => (schema ? createJsonCompletion(schema) : undefined), [schema]);
  const format = () => {
    if (formatted === null) return;
    state.setValue(formatted);
    state.commit();
  };
  // A disabled editor keeps the button, disabled, so disabling never changes the editor's size.
  const toolbar = state.isReadOnly ? undefined : (
    <Button
      className={hooks.slotClass('format')}
      size="xs"
      variant="ghost"
      isDisabled={state.isDisabled || formatted === null || formatted === state.value}
      onPress={format}
    >
      {strings.format}
    </Button>
  );
  return (
    <Field state={state} {...field} className={mergeClassNames(hooks.className, field.className)}>
      {(control) => (
        <CodeEditor
          id={control.id}
          ref={control.ref}
          aria-label={control['aria-label']}
          aria-labelledby={control['aria-labelledby']}
          aria-describedby={control['aria-describedby']}
          aria-errormessage={control['aria-errormessage']}
          isInvalid={control['aria-invalid']}
          isRequired={control['aria-required']}
          isReadOnly={control.readOnly}
          isDisabled={control.disabled}
          value={state.value}
          onChange={state.setValue}
          onBlur={() => state.commit()}
          tokenize={tokenizeJson}
          diagnostics={diagnostics}
          listDiagnostics={false}
          completions={completions}
          renderHover={schema ? (offset) => describeJsonAt(schema, state.value, offset) : undefined}
          indent={indent}
          autoCloseBrackets={autoCloseBrackets}
          size={size}
          wrap="off"
          lineNumbers={lineNumbers}
          placeholder={placeholder}
          toolbar={toolbar}
        />
      )}
    </Field>
  );
}

export type { JsonSchema, JsonSchemaType } from './json-schema.js';
