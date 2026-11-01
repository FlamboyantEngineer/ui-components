'use client';

import { useMemo, type ReactNode } from 'react';
import { mergeClassNames } from '../../core/hooks.js';
import { Field, FieldFormValue, useFieldControl, type FieldInputProps } from '../field/field.js';
import {
  createEditorPlugins,
  createEditorState,
  createEmptyDocument,
  isDocumentBlank,
  replaceDocument,
  toRichTextJson,
} from './editor-state.js';
import { EditorSurface, useSyncedEditorState, withEditorHistory } from './editor-surface.js';
import { richTextEditorHooks as hooks } from './rich-text-context.js';
import { isRichTextEqual, type RichTextDocument } from './rich-text-document.js';
import { getEngineSchema } from './engine-schema.js';
import { getDefaultRichTextSchema, type RichTextSchema } from './rich-text-schema.js';

// The engine glue the rich composer shares (`message-composer/rich`), kept out of the entry point.
export { decoratePlaceholder } from './editor-state.js';
export { domSelectionEvents } from './dom-selection-sync.js';
export { useEditable, useSyncedEditorState } from './editor-surface.js';

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
 * The document in its form, under the field's `name`: a hidden input holding the document's JSON,
 * which `JSON.parse` turns back into the value. It reads the field's value, so it keeps no copy.
 */
function DocumentFormValue({
  name,
  value,
  isDisabled,
}: {
  name: string;
  value: RichTextDocument;
  isDisabled: boolean;
}) {
  const json = useMemo(() => JSON.stringify(value), [value]);
  return <FieldFormValue name={name} value={json} isDisabled={isDisabled} />;
}

/**
 * A field for formatted text: headings, lists, tasks, quotes, code, links and inline marks, with
 * undo history, Markdown-style shortcuts as you type and keyboard shortcuts. The value is the
 * document as JSON. Its toolbar and floating chrome drive it through `useRichTextController`.
 */
export function RichTextEditor(props: RichTextEditorProps) {
  const schema = props.schema ?? getDefaultRichTextSchema();
  const engine = getEngineSchema(schema);
  const empty = useMemo(() => createEmptyDocument(engine), [engine]);
  const fieldControl = useFieldControl<RichTextDocument, RichTextEditorProps>(props, {
    initialValue: empty,
    emptyValue: empty,
    isEmpty: (value) => isDocumentBlank(value, engine),
    isEqual: isRichTextEqual,
    hasOwnHistory: true,
  });
  const { field, rest } = fieldControl;
  const plugins = useMemo(() => createEditorPlugins(engine), [engine]);
  // A new value is one undo step of the shown history; the documents share unchanged nodes.
  const editor = useSyncedEditorState({
    schema: engine,
    value: fieldControl.state.value,
    onChange: fieldControl.state.setValue,
    parse: (value) => createEditorState(engine, value, plugins),
    serialize: (doc) => toRichTextJson(doc) as RichTextDocument,
    replace: replaceDocument,
  });
  const state = withEditorHistory(fieldControl.state, editor);
  return (
    <Field
      state={state}
      {...field}
      className={mergeClassNames(hooks.className, field.className)}
      commitOnBlur
    >
      {(control) => (
        <>
          <EditorSurface
            control={control}
            editor={editor}
            placeholder={rest.placeholder}
            toolbar={rest.toolbar}
          >
            {rest.children}
          </EditorSurface>
          {rest.name ? (
            <DocumentFormValue
              name={rest.name}
              value={fieldControl.state.value}
              isDisabled={state.isDisabled}
            />
          ) : null}
        </>
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
