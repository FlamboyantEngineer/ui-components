// The engine state behind the editor: created from a document, replaced when the value changes.
import { reactKeys } from '@handlewithcare/react-prosemirror';
import { EditorState } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { createEditingPlugins } from './rich-text-keys.js';
/** The document of a new editor: the top node holding one empty default block. */
export function createEmptyDocument(schema) {
    return schema.topNodeType.createAndFill().toJSON();
}
/** Whether a document holds only one empty text block. */
export function isDocumentEmpty(document, schema) {
    const content = document.content ?? [];
    const [first] = content;
    if (content.length > 1 || !first)
        return content.length === 0;
    return Boolean(schema.nodes[first.type]?.isTextblock) && !first.content?.length;
}
/** The plugins every editor runs; `reactKeys` lets the React view keep node identities. */
export function createEditorPlugins(schema) {
    return [reactKeys(), ...createEditingPlugins(schema)];
}
export function createEditorState(schema, document, plugins) {
    return EditorState.create({ schema, doc: schema.nodeFromJSON(document), plugins });
}
/**
 * The state with its document replaced by `document`, as one step that stays off the undo
 * history, or the same state when the documents are equal.
 */
export function replaceDocument(state, document) {
    const next = state.schema.nodeFromJSON(document);
    if (next.eq(state.doc))
        return state;
    const tr = state.tr.replaceWith(0, state.doc.content.size, next.content);
    return state.apply(tr.setMeta('addToHistory', false));
}
/** Marks the empty document's only block with the placeholder text. */
export function decoratePlaceholder(state, placeholder, className) {
    const { doc } = state;
    const first = doc.firstChild;
    const isEmpty = doc.childCount === 1 && first?.isTextblock && first.content.size === 0;
    if (!placeholder || !first || !isEmpty)
        return DecorationSet.empty;
    const attrs = { class: className, 'data-placeholder': placeholder };
    return DecorationSet.create(doc, [Decoration.node(0, first.nodeSize, attrs)]);
}
//# sourceMappingURL=editor-state.js.map