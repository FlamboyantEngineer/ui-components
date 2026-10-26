import { useMemo, type ReactNode } from 'react';
import { mergeClassNames } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Field, useFieldControl, type FieldInputProps } from '../field/field.js';
import { createEmptyDocument, isDocumentEmpty } from './editor-state.js';
import { EditorSurface } from './editor-surface.js';
import { richTextEditorHooks as hooks } from './rich-text-context.js';
import type { RichTextDocument } from './rich-text-document.js';
import { getEngineSchema } from './engine-schema.js';
import { getDefaultRichTextSchema, type RichTextSchema } from './rich-text-schema.js';

export interface RichTextEditorProps extends FieldInputProps<RichTextDocument> {
  /** The node and mark types the document may hold. Defaults to the default schema. */
  schema?: RichTextSchema | undefined;
  /** Shown while the document is empty. */
  placeholder?: string | undefined;
  /** Shown in a row above the document, such as a `FormatToolbar`. */
  toolbar?: ReactNode;
  /** Chrome that floats over the document: `SelectionToolbar`, `InsertMenu`, `BlockHandle`. */
  children?: ReactNode;
}

/**
 * A field for formatted text: headings, lists, tasks, quotes, code, links and inline marks, with
 * undo history, Markdown-style shortcuts as you type and keyboard shortcuts. The value is the
 * document as JSON. Its toolbar and floating chrome drive it through `useRichTextController`.
 */
export function RichTextEditor(props: RichTextEditorProps) {
  const strings = useUiStrings();
  const schema = props.schema ?? getDefaultRichTextSchema();
  const engine = getEngineSchema(schema);
  const empty = useMemo(() => createEmptyDocument(engine), [engine]);
  const { state, field, rest } = useFieldControl<RichTextDocument, RichTextEditorProps>(props, {
    initialValue: empty,
    emptyValue: empty,
    check: (value) =>
      props.isRequired && isDocumentEmpty(value, engine)
        ? { severity: 'error', message: strings.valueRequired, validity: 'valueMissing' }
        : null,
  });
  return (
    <Field
      state={state}
      {...field}
      className={mergeClassNames(hooks.className, field.className)}
      commitOnBlur
    >
      {(control) => (
        <EditorSurface
          control={control}
          schema={engine}
          value={state.value}
          onChange={state.setValue}
          placeholder={rest.placeholder}
          toolbar={rest.toolbar}
        >
          {rest.children}
        </EditorSurface>
      )}
    </Field>
  );
}

export { createRichTextSchema } from './rich-text-schema.js';
export type {
  RichTextAttributeSpec,
  RichTextDomAttributes,
  RichTextDomOutput,
  RichTextElementData,
  RichTextMarkSpec,
  RichTextNodeSpec,
  RichTextParseRule,
  RichTextSchema,
  RichTextSchemaOptions,
} from './rich-text-schema.js';
export type {
  RichTextAttributes,
  RichTextAttributeValue,
  RichTextDocument,
  RichTextMark,
  RichTextNode,
} from './rich-text-document.js';
export type { RichTextCommand } from './rich-text-command.js';
export { useRichTextController } from './rich-text-controller.js';
export type { RichTextController } from './rich-text-controller.js';
export { serializeRichTextHtml, serializeRichTextText } from './rich-text-export.js';
export type { RichTextExportOptions } from './rich-text-export.js';
