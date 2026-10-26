import { type Node, type Schema } from 'prosemirror-model';
import { EditorState, type Plugin } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { PillAttributes } from './composer-schema.js';
/** Whether the caret or selection is in a code block. */
export declare function isInCode(state: EditorState): boolean;
/** The pill right before (`-1`) or after (`1`) an empty selection, with where it starts. */
export declare function findAdjacentPill(state: EditorState, side: -1 | 1): {
    from: number;
    to: number;
    label: string;
} | null;
/** Replaces `from`–`to` with a pill, followed by a space unless one follows already. */
export declare function replaceWithPill(view: EditorView, range: {
    from: number;
    to: number;
}, pill: PillAttributes): void;
/** Puts a pill in place of the selection; in a code block, where pills do not occur, its text. */
export declare function insertPillAtSelection(view: EditorView, pill: PillAttributes): void;
/**
 * Puts a pill at the caret, or after the selection, keeping the selected text: a space separates
 * it from a word before it, and one follows unless a space does already. In a code block, where
 * pills do not occur, the pill goes on a new line after the block. The insertion is one step of
 * the undo history of its own, and the caret ends after it.
 */
export declare function insertPillAtCaret(view: EditorView, pill: PillAttributes): void;
/**
 * Reads the browser's selection into the editor when the editor has not heard of its change yet:
 * the browser reports a selection change a moment after the key that moved it, so a key pressed
 * right after (by a quick hand or a script) would act on the old selection. Only a text selection
 * the document can map is read.
 */
export declare function syncSelectionFromDom(view: EditorView): void;
/** The editing plugins: node identities, undo history, the code fence rule and the keys. */
export declare function createComposerPlugins(schema: Schema): Plugin[];
/** A fresh state for `doc`, with its own history, the caret at its end. */
export declare function createComposerState(doc: Node, plugins: readonly Plugin[]): EditorState;
/**
 * Pastes text as it was copied: in a code block as one run, elsewhere a line per paragraph,
 * keeping every space and tab. Formatting from HTML is dropped, since only the plain text is read.
 */
export declare function pastePlainText(view: EditorView, text: string): void;
//# sourceMappingURL=composer-commands.d.ts.map