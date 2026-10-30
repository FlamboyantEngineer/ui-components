'use client';

// The engine state behind the editor: created from a document, replaced when the value changes.

import { reactKeys } from '@handlewithcare/react-prosemirror';
import type { Node, Schema } from 'prosemirror-model';
import { EditorState, type Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import type { RichTextDocument, RichTextNode } from './rich-text-document.js';
import { createEditingPlugins } from './rich-text-keys.js';

/** The document of a new editor: the top node holding one empty default block. */
export function createEmptyDocument(schema: Schema): RichTextDocument {
  return (schema.topNodeType.createAndFill() as Node).toJSON() as RichTextDocument;
}

/** Whether a document holds only one empty text block. */
export function isDocumentEmpty(document: RichTextNode, schema: Schema): boolean {
  const content = document.content ?? [];
  const [first] = content;
  if (content.length > 1 || !first) return content.length === 0;
  return Boolean(schema.nodes[first.type]?.isTextblock) && !first.content?.length;
}

/** The plugins every editor runs; `reactKeys` lets the React view keep node identities. */
export function createEditorPlugins(schema: Schema): Plugin[] {
  return [reactKeys(), ...createEditingPlugins(schema)];
}

export function createEditorState(
  schema: Schema,
  document: RichTextNode,
  plugins: readonly Plugin[],
): EditorState {
  return EditorState.create({ schema, doc: schema.nodeFromJSON(document), plugins });
}

/**
 * The state with its document replaced by `document`, as one step that stays off the undo
 * history, or the same state when the documents are equal.
 */
export function replaceDocument(state: EditorState, document: RichTextNode): EditorState {
  const next = state.schema.nodeFromJSON(document);
  if (next.eq(state.doc)) return state;
  const tr = state.tr.replaceWith(0, state.doc.content.size, next.content);
  return state.apply(tr.setMeta('addToHistory', false));
}

/** Marks the empty document's only block with the placeholder text. */
export function decoratePlaceholder(
  state: EditorState,
  placeholder: string | undefined,
  className: string,
): DecorationSet {
  const { doc } = state;
  const first = doc.firstChild;
  const isEmpty = doc.childCount === 1 && first?.isTextblock && first.content.size === 0;
  if (!placeholder || !first || !isEmpty) return DecorationSet.empty;
  const attrs = { class: className, 'data-placeholder': placeholder };
  return DecorationSet.create(doc, [Decoration.node(0, first.nodeSize, attrs)]);
}
