// Commands on the top-level blocks the selection touches: move, duplicate and delete.

import {
  AllSelection,
  Selection,
  TextSelection,
  type Command,
  type EditorState,
  type Transaction,
} from 'prosemirror-state';
import { StepMap } from 'prosemirror-transform';

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
export function findTopBlocks(state: EditorState): TopBlocks | null {
  const { $from, $to } = state.selection;
  const from = $from.depth > 0 ? $from.before(1) : $from.pos;
  const to = $to.depth > 0 ? $to.after(1) : $to.pos;
  if (to <= from) return null;
  return { from, to, index: $from.index(0), endIndex: $to.indexAfter(0) };
}

/** The selection moved by `delta` with its blocks; a select-all becomes the text of the moved run. */
function shiftSelection(tr: Transaction, selection: Selection, delta: number): Selection {
  if (!(selection instanceof AllSelection)) return selection.map(tr.doc, StepMap.offset(delta));
  const { from, to } = selection;
  return TextSelection.between(tr.doc.resolve(from + delta), tr.doc.resolve(to + delta));
}

/** Swaps the blocks with the block before (`up`) or after (`down`), keeping the selection in them. */
export function moveBlock(direction: 'up' | 'down'): Command {
  return (state, dispatch) => {
    const blocks = findTopBlocks(state);
    const neighbour =
      blocks && state.doc.maybeChild(direction === 'up' ? blocks.index - 1 : blocks.endIndex);
    if (!blocks || !neighbour) return false;
    if (!dispatch) return true;
    const content = state.doc.slice(blocks.from, blocks.to).content;
    const tr =
      direction === 'up'
        ? state.tr.replaceWith(
            blocks.from - neighbour.nodeSize,
            blocks.to,
            content.addToEnd(neighbour),
          )
        : state.tr.replaceWith(
            blocks.from,
            blocks.to + neighbour.nodeSize,
            content.addToStart(neighbour),
          );
    const delta = direction === 'up' ? -neighbour.nodeSize : neighbour.nodeSize;
    dispatch(tr.setSelection(shiftSelection(tr, state.selection, delta)).scrollIntoView());
    return true;
  };
}

/** Inserts a copy of the blocks after them and moves the selection into the copy. */
export const duplicateBlock: Command = (state, dispatch) => {
  const blocks = findTopBlocks(state);
  if (!blocks) return false;
  if (!dispatch) return true;
  const { from, to } = blocks;
  const tr = state.tr.insert(to, state.doc.slice(from, to).content);
  dispatch(tr.setSelection(shiftSelection(tr, state.selection, to - from)).scrollIntoView());
  return true;
};

/** Deletes the blocks; when they are the whole document, an empty paragraph takes their place. */
export const deleteBlock: Command = (state, dispatch) => {
  const blocks = findTopBlocks(state);
  if (!blocks) return false;
  if (!dispatch) return true;
  const { from, to } = blocks;
  const filler =
    blocks.index === 0 && blocks.endIndex === state.doc.childCount
      ? state.schema.topNodeType.contentMatch.defaultType
      : null;
  const tr = filler
    ? state.tr.replaceWith(from, to, filler.createAndFill() ?? [])
    : state.tr.delete(from, to);
  const near = tr.doc.resolve(Math.min(from, tr.doc.content.size));
  dispatch(tr.setSelection(Selection.near(near)).scrollIntoView());
  return true;
};
