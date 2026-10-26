import type { NodeType } from 'prosemirror-model';
import { type Command, type Transaction } from 'prosemirror-state';
import type { RichTextAttributes } from './rich-text-document.js';
/** Puts the caret after an inserted leaf block, adding an empty text block when none follows. */
export declare function placeAfterLeaf(tr: Transaction, end: number): Transaction;
/**
 * Inserts a node: an inline node in place of the selection, a text block by turning the current
 * block into it, and another block in place of an empty text block or after the current one.
 */
export declare function insertNode(type: NodeType, attrs: RichTextAttributes | undefined): Command;
/**
 * Links the selection to `href`; at a caret, changes the link around it or inserts the address as
 * linked text. `null` removes the link from the selection or around the caret. Unsafe addresses
 * (`javascript:`) are refused.
 */
export declare function setLink(href: string | null): Command;
//# sourceMappingURL=insert-commands.d.ts.map