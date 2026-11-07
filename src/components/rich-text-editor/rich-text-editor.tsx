'use client';

import { type ReactNode, useMemo } from 'react';
import { mergeClassNames } from '../../core/hooks.js';
import { Field, FieldFormValue, type FieldInputProps, useFieldControl } from '../field/field.js';
import type { RichTextBlockMarker } from './block-markers.js';
import {
  createEditorPlugins,
  createEditorState,
  createEmptyDocument,
  isDocumentBlank,
  replaceDocument,
  toRichTextJson,
} from './editor-state.js';
import { EditorSurface, useSyncedEditorState, withEditorHistory } from './editor-surface.js';
import { getRichTextKit } from './engine-schema.js';
import { richTextEditorHooks as hooks } from './rich-text-context.js';
import { isRichTextEqual, type RichTextDocument } from './rich-text-document.js';
import { getDefaultRichTextSchema, type RichTextSchema } from './rich-text-schema.js';

// The engine glue the rich composer shares (`message-composer/rich`), kept out of the entry point.
export { domSelectionEvents } from './dom-selection-sync.js';
export { decoratePlaceholder } from './editor-state.js';
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
  /**
   * The host's own findings about top-level blocks, by index into the document's `content`:
   * each marks its blocks (`data-severity`, its message as their description) and, while the
   * surface scrolls, its place in the scroll track. The editor checks nothing itself.
   */
  blockMarkers?: readonly RichTextBlockMarker[] | undefined;
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
  const kit = getRichTextKit(schema);
  const engine = kit.schema;
  const empty = useMemo(() => createEmptyDocument(engine), [engine]);
  const fieldControl = useFieldControl<RichTextDocument, RichTextEditorProps>(props, {
    initialValue: empty,
    emptyValue: empty,
    isEmpty: (value) => isDocumentBlank(value, engine),
    isEqual: isRichTextEqual,
    hasOwnHistory: true,
  });
  const { field, rest } = fieldControl;
  const plugins = useMemo(() => createEditorPlugins(kit, undefined), [kit]);
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
            blockMarkers={rest.blockMarkers}
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

export type { RichTextBlockMarker } from './block-markers.js';
export { getRichTextKit } from './engine-schema.js';
export type { RichTextCommand } from './rich-text-command.js';
export type { RichTextController } from './rich-text-controller.js';
export { useRichTextController } from './rich-text-controller.js';
export type {
  RichTextAttributes,
  RichTextAttributeValue,
  RichTextDocument,
  RichTextMark,
  RichTextNode,
} from './rich-text-document.js';
export type { RichTextExportOptions } from './rich-text-export.js';
export { serializeRichTextHtml, serializeRichTextText } from './rich-text-export.js';
export type { RichTextKit } from './rich-text-extension.js';
export type {
  RichTextExtension,
  RichTextExtensionMark,
  RichTextExtensionNode,
  RichTextPluginContribution,
} from './rich-text-extension.js';
export { createRichTextKit } from './rich-text-extension.js';
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
export { createRichTextSchema } from './rich-text-schema.js';
