// Where each top-level block of a document starts, read once per document.

import type { Node as DocNode } from 'prosemirror-model';

/** The start of each top-level block, per document: documents are immutable, so it holds. */
const cache = new WeakMap<DocNode, readonly number[]>();

/** The start position of each top-level block of `doc`, in order. */
export function readBlockStarts(doc: DocNode): readonly number[] {
  let starts = cache.get(doc);
  if (!starts) {
    const list: number[] = [];
    doc.forEach((_child, offset) => list.push(offset));
    starts = list;
    cache.set(doc, starts);
  }
  return starts;
}
