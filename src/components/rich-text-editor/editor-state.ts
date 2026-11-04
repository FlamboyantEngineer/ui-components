'use client';

// The engine state behind the editor: created from a document, replaced when the value changes.

import { reactKeys } from '@handlewithcare/react-prosemirror';
import { closeHistory } from 'prosemirror-history';
import type { Node, Schema } from 'prosemirror-model';
import { EditorState, type Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import {
  isRichTextEqual,
  isSameData,
  type RichTextAttributes,
  type RichTextDocument,
  type RichTextMark,
  type RichTextNode,
} from './rich-text-document.js';
import { createEditingPlugins } from './rich-text-keys.js';

/** The document of a new editor: the top node holding one empty default block. */
export function createEmptyDocument(schema: Schema): RichTextDocument {
  return (schema.topNodeType.createAndFill() as Node).toJSON() as RichTextDocument;
}

/**
 * Whether a node holds nothing a reader would count as content, whatever structure it has: text
 * that is only whitespace, line breaks (leaves whose text is whitespace) and blocks holding only
 * those. Any other leaf, such as a divider or a caller's atom, is content.
 */
export function isDocumentBlank(node: RichTextNode, schema: Schema): boolean {
  if (node.type === 'text') return !node.text?.trim();
  const type = schema.nodes[node.type];
  if (type?.isLeaf) {
    const text = type.spec.leafText?.(type.create(node.attrs));
    return text !== undefined && text.trim() === '';
  }
  return (node.content ?? []).every((child) => isDocumentBlank(child, schema));
}

/** The plugins every editor runs; `reactKeys` lets the React view keep node identities. */
export function createEditorPlugins(schema: Schema): Plugin[] {
  return [reactKeys(), ...createEditingPlugins(schema)];
}

/** The JSON of each engine node, built once: nodes are immutable and edits share unchanged ones. */
const nodeJson = new WeakMap<Node, RichTextNode>();

/**
 * The node as JSON, in the engine's own form (`Node.toJSON`), built once per node. An edit makes
 * new nodes only along its path, so the JSON of the edited document is new along that path and is
 * the earlier JSON everywhere else: building it and comparing it with earlier values (`isRichTextEqual`)
 * cost as much as the edited path, not as the document.
 */
export function toRichTextJson(node: Node): RichTextNode {
  let json = nodeJson.get(node);
  if (json) return json;
  if (node.childCount === 0) {
    json = node.toJSON() as RichTextNode;
  } else {
    const content: RichTextNode[] = [];
    node.forEach((child) => content.push(toRichTextJson(child)));
    json = {
      type: node.type.name,
      ...(Object.keys(node.attrs).length > 0 ? { attrs: node.attrs as RichTextAttributes } : {}),
      content,
      ...(node.marks.length > 0
        ? { marks: node.marks.map((mark) => mark.toJSON() as RichTextMark) }
        : {}),
    };
  }
  nodeJson.set(node, json);
  return json;
}

/** Records `json` as the JSON of `node` and of each of its descendants. */
function adoptJson(node: Node, json: RichTextNode) {
  nodeJson.set(node, json);
  node.forEach((child, _offset, index) => adoptJson(child, json.content?.[index] as RichTextNode));
}

/**
 * Reads a document into the engine. When the document is already in the engine's form, it becomes
 * the JSON of the nodes read from it, so the documents of later edits share its unchanged parts.
 */
function readDocument(schema: Schema, document: RichTextNode): Node {
  const node = schema.nodeFromJSON(document);
  if (isRichTextEqual(toRichTextJson(node), document)) adoptJson(node, document);
  return node;
}

export function createEditorState(
  schema: Schema,
  document: RichTextNode,
  plugins: readonly Plugin[],
): EditorState {
  return EditorState.create({ schema, doc: readDocument(schema, document), plugins });
}

/**
 * The state with its document replaced by `document`, its content and its root attributes, as one
 * step of the undo history of its own, or the same state when the documents are equal.
 */
export function replaceDocument(state: EditorState, document: RichTextNode): EditorState {
  const next = readDocument(state.schema, document);
  if (next.eq(state.doc)) return state;
  const { tr } = state;
  if (!next.content.eq(state.doc.content)) tr.replaceWith(0, state.doc.content.size, next.content);
  for (const [name, value] of Object.entries(next.attrs)) {
    if (!isSameData(state.doc.attrs[name], value)) tr.setDocAttribute(name, value);
  }
  return state.apply(closeHistory(tr));
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
