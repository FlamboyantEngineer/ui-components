import type { RichTextAttributes } from './rich-text-document.js';
/**
 * An editing command, as plain data, that the editor's controller runs, tests and reports on.
 * Node and mark names are the schema's (`heading`, `bulletList`, `bold`).
 */
export type RichTextCommand = 
/** Adds the mark to the selection, or removes it where the selection has it. */
{
    type: 'toggle-mark';
    mark: string;
    attrs?: RichTextAttributes | undefined;
}
/** Turns the selected text blocks into this type, such as `{ node: 'heading', attrs: { level: 2 } }`. */
 | {
    type: 'set-block';
    node: string;
    attrs?: RichTextAttributes | undefined;
}
/** Wraps the selected blocks in a list or quote, or unwraps them from it. */
 | {
    type: 'toggle-wrap';
    node: string;
    attrs?: RichTextAttributes | undefined;
}
/** Inserts a node in place of the selection, such as a divider or a hard break. */
 | {
    type: 'insert';
    node: string;
    attrs?: RichTextAttributes | undefined;
}
/** Inserts text in place of the selection. */
 | {
    type: 'insert-text';
    text: string;
}
/** Links the selection (or inserts the address, linked), changes the link at the caret, or removes it with `null`. */
 | {
    type: 'set-link';
    href: string | null;
} | {
    type: 'undo';
} | {
    type: 'redo';
}
/** Moves the top-level block holding the selection before the previous one or after the next one. */
 | {
    type: 'move-block';
    direction: 'up' | 'down';
}
/** Inserts a copy of the top-level block holding the selection after it. */
 | {
    type: 'duplicate-block';
}
/** Deletes the top-level block holding the selection. */
 | {
    type: 'delete-block';
};
//# sourceMappingURL=rich-text-command.d.ts.map