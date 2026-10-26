import type { Schema } from 'prosemirror-model';
import { EditorState, type Plugin } from 'prosemirror-state';
import { DecorationSet } from 'prosemirror-view';
import type { RichTextDocument, RichTextNode } from './rich-text-document.js';
/** The document of a new editor: the top node holding one empty default block. */
export declare function createEmptyDocument(schema: Schema): RichTextDocument;
/** Whether a document holds only one empty text block. */
export declare function isDocumentEmpty(document: RichTextNode, schema: Schema): boolean;
/** The plugins every editor runs; `reactKeys` lets the React view keep node identities. */
export declare function createEditorPlugins(schema: Schema): Plugin[];
export declare function createEditorState(schema: Schema, document: RichTextNode, plugins: readonly Plugin[]): EditorState;
/**
 * The state with its document replaced by `document`, as one step that stays off the undo
 * history, or the same state when the documents are equal.
 */
export declare function replaceDocument(state: EditorState, document: RichTextNode): EditorState;
/** Marks the empty document's only block with the placeholder text. */
export declare function decoratePlaceholder(state: EditorState, placeholder: string | undefined, className: string): DecorationSet;
//# sourceMappingURL=editor-state.d.ts.map