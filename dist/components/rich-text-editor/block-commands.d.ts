import { type Command, type EditorState } from 'prosemirror-state';
/** The run of top-level blocks the selection touches. */
interface TopBlocks {
    /** The position before the first block. */
    from: number;
    /** The position after the last block. */
    to: number;
    /** The index of the first block. */
    index: number;
    /** The index after the last block. */
    endIndex: number;
}
/**
 * The top-level blocks the selection touches, or null when it touches none. An end resolved
 * between top-level blocks (a select-all or a selected top-level node) bounds the run there.
 */
export declare function findTopBlocks(state: EditorState): TopBlocks | null;
/** Swaps the blocks with the block before (`up`) or after (`down`), keeping the selection in them. */
export declare function moveBlock(direction: 'up' | 'down'): Command;
/** Inserts a copy of the blocks after them and moves the selection into the copy. */
export declare const duplicateBlock: Command;
/** Deletes the blocks; when they are the whole document, an empty paragraph takes their place. */
export declare const deleteBlock: Command;
export {};
//# sourceMappingURL=block-commands.d.ts.map