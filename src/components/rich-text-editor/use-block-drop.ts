'use client';

import { useEditorEffect } from '@handlewithcare/react-prosemirror';
import { closeHistory } from 'prosemirror-history';
import type { Node as DocNode } from 'prosemirror-model';
import { NodeSelection, TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { type RefObject, useState } from 'react';
import { isHTMLElement, isNode } from '../../utils/is-element.js';
import { readBlockStarts } from './block-starts.js';

/** A dragged block: its position in the document it was dragged from. */
export interface BlockDragSource {
  pos: number;
  doc: DocNode;
}

/** Where a dragged block would land: before the top-level block at `index`, or at the end. */
interface BlockGap {
  index: number;
  /** The gap's offset from the surface's top, in its scrolled content, in pixels. */
  top: number;
}

/** The top-level block at `index`'s box, if it is drawn. */
function blockRect(view: EditorView, doc: DocNode, index: number): DOMRect | null {
  const pos = readBlockStarts(doc)[index];
  if (pos === undefined) return null;
  const dom = view.nodeDOM(pos);
  return isHTMLElement(dom) ? dom.getBoundingClientRect() : null;
}

/**
 * The gap between top-level blocks nearest `clientY`: before the first block whose middle lies
 * below it, found by halving since blocks run down the page, or after the last block.
 */
function findGap(view: EditorView, surface: HTMLElement, clientY: number): BlockGap | null {
  const { doc } = view.state;
  let low = 0;
  let high = doc.childCount;
  while (low < high) {
    const middle = (low + high) >> 1;
    const rect = blockRect(view, doc, middle);
    if (!rect) return null;
    if (clientY < rect.top + rect.height / 2) high = middle;
    else low = middle + 1;
  }
  const atEnd = low === doc.childCount;
  const rect = blockRect(view, doc, atEnd ? low - 1 : low);
  if (!rect) return null;
  const edge = atEnd ? rect.bottom : rect.top;
  return { index: low, top: edge - surface.getBoundingClientRect().top + surface.scrollTop };
}

/** The index of the top-level block starting at `pos`. */
function indexAt(doc: DocNode, pos: number): number {
  return doc.resolve(pos).index(0);
}

/** Whether dropping the block at `source` into the gap before `index` leaves it where it is. */
function isInPlace(doc: DocNode, source: number, index: number): boolean {
  const from = indexAt(doc, source);
  return index === from || index === from + 1;
}

/** Moves the top-level block at `source` into the gap before `index`, as its own undoable step. */
function moveBlock(view: EditorView, source: number, index: number) {
  const { doc } = view.state;
  const node = doc.nodeAt(source);
  if (!node || isInPlace(doc, source, index)) return;
  let gap = 0;
  for (let at = 0; at < index; at += 1) gap += doc.child(at).nodeSize;
  const tr = view.state.tr.delete(source, source + node.nodeSize);
  const to = tr.mapping.map(gap, -1);
  tr.insert(to, node);
  const selection = node.isAtom
    ? NodeSelection.create(tr.doc, to)
    : TextSelection.near(tr.doc.resolve(to + 1));
  view.dispatch(closeHistory(tr.setSelection(selection).scrollIntoView()));
  view.focus();
}

/**
 * Drops a block dragged by the handle's grip between the top-level blocks of the surface: the
 * gap nearest the pointer, shown while the drag is over the surface, takes the block as one
 * edit. The surface's capture listeners run before ProseMirror's, which would otherwise drop the
 * block's content at the nearest text position, inside a list or a quote. A drop in place, out of
 * the surface or after the drag is cancelled changes nothing. The drag belongs to the document it
 * started in: once the document changes, by the host replacing the value or by any edit, its
 * position may name another block or none, so the drag shows no gap and its drop changes nothing.
 *
 * Returns the gap a drop would fill, for the drop indicator, while it would move the block.
 */
export function useBlockDrop(
  surfaceRef: RefObject<HTMLElement | null>,
  source: BlockDragSource | null,
): BlockGap | null {
  const [gap, setGap] = useState<BlockGap | null>(null);
  useEditorEffect(
    (view) => {
      const surface = surfaceRef.current;
      if (source === null || !surface) return undefined;
      const toGap = (event: DragEvent) => {
        const isCurrent = view.editable && view.state.doc === source.doc;
        const found = isCurrent ? findGap(view, surface, event.clientY) : null;
        return found && !isInPlace(view.state.doc, source.pos, found.index) ? found : null;
      };
      const onDragOver = (event: DragEvent) => {
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
        const found = toGap(event);
        setGap((current) =>
          current?.index === found?.index && current?.top === found?.top ? current : found,
        );
      };
      const onDragLeave = (event: DragEvent) => {
        if (!(isNode(event.relatedTarget) && surface.contains(event.relatedTarget))) setGap(null);
      };
      const onDrop = (event: DragEvent) => {
        event.preventDefault();
        const found = toGap(event);
        setGap(null);
        if (found) moveBlock(view, source.pos, found.index);
      };
      surface.addEventListener('dragover', onDragOver, true);
      surface.addEventListener('dragleave', onDragLeave, true);
      surface.addEventListener('drop', onDrop, true);
      return () => {
        surface.removeEventListener('dragover', onDragOver, true);
        surface.removeEventListener('dragleave', onDragLeave, true);
        surface.removeEventListener('drop', onDrop, true);
        setGap(null);
      };
    },
    [surfaceRef, source],
  );
  return source === null ? null : gap;
}
