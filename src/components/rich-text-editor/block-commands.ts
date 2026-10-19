// Commands on the top-level block holding the selection: move, duplicate and delete.

import type { Node } from 'prosemirror-model';
import {
  NodeSelection,
  Selection,
  TextSelection,
  type Command,
  type EditorState,
  type Transaction,
} from 'prosemirror-state';

interface TopBlock {
  node: Node;
  index: number;
  pos: number;
}

/** The top-level block holding the whole selection, or null when the selection spans several. */
export function findTopBlock(state: EditorState): TopBlock | null {
  const { $from, $to } = state.selection;
  const index = $from.index(0);
  const node = state.doc.maybeChild(index);
  if (!node || ($to.depth > 0 && $to.index(0) !== index)) return null;
  let pos = 0;
  for (let child = 0; child < index; child += 1) pos += state.doc.child(child).nodeSize;
  return { node, index, pos };
}

/** The selection moved by `delta`, as it was inside the block that moved. */
function shiftSelection(tr: Transaction, selection: Selection, delta: number): Selection {
  if (selection instanceof NodeSelection)
    return NodeSelection.create(tr.doc, selection.from + delta);
  return TextSelection.create(tr.doc, selection.anchor + delta, selection.head + delta);
}

/** Swaps the block with the one before (`up`) or after (`down`), keeping the selection in it. */
export function moveBlock(direction: 'up' | 'down'): Command {
  return (state, dispatch) => {
    const block = findTopBlock(state);
    const neighbour = block && state.doc.maybeChild(block.index + (direction === 'up' ? -1 : 1));
    if (!block || !neighbour) return false;
    if (!dispatch) return true;
    const { node, pos } = block;
    const from = direction === 'up' ? pos - neighbour.nodeSize : pos;
    const to = from + node.nodeSize + neighbour.nodeSize;
    const order = direction === 'up' ? [node, neighbour] : [neighbour, node];
    const tr = state.tr.replaceWith(from, to, order);
    const moved = direction === 'up' ? from : from + neighbour.nodeSize;
    dispatch(tr.setSelection(shiftSelection(tr, state.selection, moved - pos)).scrollIntoView());
    return true;
  };
}

/** Inserts a copy of the block after it and moves the selection into the copy. */
export const duplicateBlock: Command = (state, dispatch) => {
  const block = findTopBlock(state);
  if (!block) return false;
  if (!dispatch) return true;
  const after = block.pos + block.node.nodeSize;
  const tr = state.tr.insert(after, block.node);
  dispatch(
    tr.setSelection(shiftSelection(tr, state.selection, block.node.nodeSize)).scrollIntoView(),
  );
  return true;
};

/** Deletes the block; the document's last block gives way to an empty paragraph. */
export const deleteBlock: Command = (state, dispatch) => {
  const block = findTopBlock(state);
  if (!block) return false;
  if (!dispatch) return true;
  const { node, pos } = block;
  const filler =
    state.doc.childCount === 1 ? state.schema.topNodeType.contentMatch.defaultType : null;
  const tr = filler
    ? state.tr.replaceWith(pos, pos + node.nodeSize, filler.createAndFill() ?? [])
    : state.tr.delete(pos, pos + node.nodeSize);
  const near = tr.doc.resolve(Math.min(pos, tr.doc.content.size));
  dispatch(tr.setSelection(Selection.near(near)).scrollIntoView());
  return true;
};
