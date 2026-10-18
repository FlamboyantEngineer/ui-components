// Commands that insert nodes and set links.

import { setBlockType } from 'prosemirror-commands';
import type { MarkType, NodeType, ResolvedPos } from 'prosemirror-model';
import {
  Selection,
  TextSelection,
  type Command,
  type EditorState,
  type Transaction,
} from 'prosemirror-state';
import { isSafeUrl } from '../../utils/safe-url.js';
import type { RichTextAttributes } from './rich-text-document.js';

/** Puts the caret after an inserted leaf block, adding an empty text block when none follows. */
export function placeAfterLeaf(tr: Transaction, end: number): Transaction {
  const $end = tr.doc.resolve(end);
  if (!$end.nodeAfter?.isTextblock) {
    const filler = $end.parent.contentMatchAt($end.index()).defaultType;
    if (filler?.isTextblock) tr.insert(end, filler.create());
  }
  return tr.setSelection(Selection.near(tr.doc.resolve(end + 1)));
}

/** Where a block goes: in place of an empty text block, else after the text block at the caret. */
function findBlockSlot(state: EditorState, type: NodeType) {
  const { $from } = state.selection;
  if (!$from.parent.isTextblock || $from.depth === 0) return null;
  const container = $from.node(-1);
  const isEmpty = $from.parent.content.size === 0;
  const [from, to] = isEmpty
    ? [$from.index(-1), $from.indexAfter(-1)]
    : [$from.indexAfter(-1), $from.indexAfter(-1)];
  if (!container.canReplaceWith(from, to, type)) return null;
  return isEmpty
    ? { from: $from.before(), to: $from.after() }
    : { from: $from.after(), to: $from.after() };
}

/**
 * Inserts a node: an inline node in place of the selection, a text block by turning the current
 * block into it, and another block in place of an empty text block or after the current one.
 */
export function insertNode(type: NodeType, attrs: RichTextAttributes | undefined): Command {
  return (state, dispatch) => {
    if (type.isTextblock) return setBlockType(type, attrs)(state, dispatch);
    const node = type.createAndFill(attrs);
    const slot = type.isInline ? null : findBlockSlot(state, type);
    if (!node || (!type.isInline && !slot)) return false;
    if (!dispatch) return true;
    if (!slot) {
      dispatch(state.tr.replaceSelectionWith(node).scrollIntoView());
      return true;
    }
    const tr = state.tr.replaceWith(slot.from, slot.to, node);
    if (node.isLeaf) placeAfterLeaf(tr, slot.from + node.nodeSize);
    else tr.setSelection(Selection.near(tr.doc.resolve(slot.from + 1)));
    dispatch(tr.scrollIntoView());
    return true;
  };
}

/** The extent of the mark of `type` around a position, within its text block. */
function findMarkRange($pos: ResolvedPos, type: MarkType): { from: number; to: number } | null {
  const start = $pos.start();
  let offset = 0;
  let range: { from: number; to: number } | null = null;
  let mark = null;
  for (let index = 0; index < $pos.parent.childCount; index += 1) {
    const child = $pos.parent.child(index);
    const from = start + offset;
    const to = from + child.nodeSize;
    offset += child.nodeSize;
    const own = type.isInSet(child.marks);
    if (range && own && mark && own.eq(mark)) range.to = to;
    else if (range) break;
    else if (own && $pos.pos >= from && $pos.pos <= to) [range, mark] = [{ from, to }, own];
  }
  return range;
}

/**
 * Links the selection to `href`; at a caret, changes the link around it or inserts the address as
 * linked text. `null` removes the link from the selection or around the caret. Unsafe addresses
 * (`javascript:`) are refused.
 */
export function setLink(href: string | null): Command {
  return (state, dispatch) => {
    const type = state.schema.marks.link;
    if (!type || (href !== null && (!href.trim() || !isSafeUrl(href)))) return false;
    const { selection } = state;
    const around = selection.empty ? findMarkRange(selection.$from, type) : null;
    const { from, to } = around ?? selection;
    if (href === null && from === to) return false;
    if (!dispatch) return true;
    const tr = state.tr.removeMark(from, to, type);
    if (href !== null && from === to) {
      tr.insertText(href, from).addMark(from, from + href.length, type.create({ href }));
      tr.setSelection(TextSelection.create(tr.doc, from + href.length));
    } else if (href !== null) {
      tr.addMark(from, to, type.create({ href }));
    }
    dispatch(tr.scrollIntoView());
    return true;
  };
}
