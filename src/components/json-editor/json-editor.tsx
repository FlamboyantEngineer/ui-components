import { createHooks, mergeClassNames } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import { Button } from '../button/button.js';
import { CodeEditor, type CodeEditorSize } from '../code-editor/code-editor.js';
import { Field, useFieldControl, type FieldInputProps, type FieldIssue } from '../field/field.js';
import { findJsonError, formatJson, tokenizeJson } from './json-text.js';

export interface JsonEditorProps extends FieldInputProps<string> {
  /** Spaces per level when the text is formatted. Defaults to 2. */
  indent?: number | undefined;
  /** Starting height. Defaults to `md`. */
  size?: CodeEditorSize | undefined;
  /** Numbers the lines. Defaults to `true`. */
  lineNumbers?: boolean | undefined;
  /** Shown while the text is empty. */
  placeholder?: string | undefined;
}

const hooks = createHooks('json-editor', ['format']);

function checkJson(value: string, strings: UiStrings): FieldIssue | null {
  const error = findJsonError(value);
  if (!error) return null;
  const { location } = error;
  return {
    severity: 'error',
    message: location ? strings.invalidJsonAt(location.line, location.column) : strings.invalidJson,
  };
}

/**
 * A field for JSON text: a highlighted code editor whose text must parse, with a Format button
 * that rewrites valid text with standard indentation. It commits when it loses focus and when the
 * text is formatted. Blank text is valid unless the field is required.
 */
export function JsonEditor(props: JsonEditorProps) {
  const strings = useUiStrings();
  const { state, field, rest } = useFieldControl<string, JsonEditorProps>(props, {
    initialValue: '',
    emptyValue: '',
    check: (value) => checkJson(value, strings),
  });
  const { indent = 2, size = 'md', lineNumbers = true, placeholder } = rest;
  const isEditable = !state.isReadOnly && !state.isDisabled;
  const formatted = formatJson(state.value, indent);
  const format = () => {
    if (formatted === null) return;
    state.setValue(formatted);
    state.commit();
  };
  const toolbar = isEditable ? (
    <Button
      className={hooks.slotClass('format')}
      size="xs"
      variant="ghost"
      isDisabled={formatted === null || formatted === state.value}
      onPress={format}
    >
      {strings.format}
    </Button>
  ) : undefined;
  return (
    <Field state={state} {...field} className={mergeClassNames(hooks.className, field.className)}>
      {(control) => (
        <CodeEditor
          {...control}
          value={state.value}
          onChange={state.setValue}
          onBlur={() => state.commit()}
          tokenize={tokenizeJson}
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
