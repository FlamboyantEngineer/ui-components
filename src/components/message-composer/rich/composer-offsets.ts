// Offsets in the composer message's text, and the editor document positions they stand for
// (specs/MESSAGE-COMPOSER.md, UIC-MESSAGE-COMPOSER-4.11). The text is the document as
// `serializeComposerDocument` writes it: a line per paragraph, fenced code blocks, pills as their
// text. Offsets count UTF-16 code units, as JavaScript strings and the editor do.

import type { Node } from 'prosemirror-model';
import { getPillText } from './composer-schema.js';
import { toFence } from './composer-markdown.js';

/** Which way an offset inside a pill's text moves: to the pill's start or its end. */
export type OffsetBias = -1 | 1;

/**
 * A run of the text and the document positions it stands for: text character for character, a
 * pill's text for the pill, and a code block's fence line for the start or end of its code.
 */
interface Run {
  kind: 'text' | 'pill' | 'fence';
  /** Where the run starts in the text. */
  offset: number;
  /** Its length in the text. */
  length: number;
  /** The position it starts at; a fence stands for this one position. */
  pos: number;
}

function collectBlockRuns(block: Node, start: { offset: number; content: number }): Run[] {
  const runs: Run[] = [];
  let { offset } = start;
  const { content } = start;
  if (block.type.spec.code) {
    const opening = toFence(block.textContent).length + String(block.attrs.language ?? '').length;
    const size = block.content.size;
    runs.push({ kind: 'fence', offset, length: opening + 1, pos: content });
    offset += opening + 1;
    runs.push({ kind: 'text', offset, length: size, pos: content });
    offset += size;
    runs.push({
      kind: 'fence',
      offset,
      length: 1 + toFence(block.textContent).length,
      pos: content + size,
    });
    return runs;
  }
  // An empty line still holds a caret place.
  if (block.childCount === 0) runs.push({ kind: 'text', offset, length: 0, pos: content });
  block.forEach((child, childPos) => {
    const pos = content + childPos;
    const length = child.isText ? child.nodeSize : getPillText(child).length;
    runs.push({ kind: child.isText ? 'text' : 'pill', offset, length, pos });
    offset += length;
  });
  return runs;
}

/** The text's runs in order; a line break between blocks lies between two runs. */
function collectRuns(doc: Node): Run[] {
  const runs: Run[] = [];
  let offset = 0;
  doc.forEach((block, blockPos) => {
    if (blockPos > 0) offset += 1;
    const blockRuns = collectBlockRuns(block, { offset, content: blockPos + 1 });
    runs.push(...blockRuns);
    const last = blockRuns.at(-1);
    if (last) offset = last.offset + last.length;
  });
  return runs;
}

/** The positions a run covers: a text run each of its characters' edges, a pill both its sides. */
function coversPosition(run: Run, pos: number): boolean {
  if (run.kind === 'fence') return false;
  const size = run.kind === 'pill' ? 1 : run.length;
  return pos >= run.pos && pos <= run.pos + size;
}

/** The text offset of a document position inside a line or a code block. */
export function toTextOffset(doc: Node, pos: number): number {
  const runs = collectRuns(doc);
  const run = runs.find((candidate) => coversPosition(candidate, pos));
  if (!run) return runs.at(-1) ? endOf(runs.at(-1) as Run) : 0;
  if (run.kind === 'pill') return pos === run.pos ? run.offset : run.offset + run.length;
  return run.offset + (pos - run.pos);
}

function endOf(run: Run): number {
  return run.offset + run.length;
}

/**
 * The document position of a text offset. An offset inside a pill's text moves to the pill's start
 * (`bias` -1) or end (1); one in a fence line moves into the code it opens or closes; one past the
 * text moves to its end.
 */
export function toDocumentPosition(doc: Node, offset: number, bias: OffsetBias): number {
  const runs = collectRuns(doc);
  const run = runs.find((candidate) => offset >= candidate.offset && offset <= endOf(candidate));
  if (!run) {
    const last = runs.at(-1);
    if (!last) return 1;
    return last.kind === 'pill'
      ? last.pos + 1
      : last.pos + (last.kind === 'text' ? last.length : 0);
  }
  if (run.kind === 'fence') return run.pos;
  if (run.kind === 'text') return run.pos + (offset - run.offset);
  if (offset === run.offset) return run.pos;
  if (offset === endOf(run)) return run.pos + 1;
  return bias < 0 ? run.pos : run.pos + 1;
}
