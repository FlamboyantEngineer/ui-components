// Container block readers of the Markdown parser: block quotes and lists (specs/MARKDOWN.md).

import type { BlockReader } from './markdown-blocks.js';
import {
  indentOf,
  interruptsParagraph,
  isBlank,
  isFenceClose,
  readFence,
  readListMarker,
  stripBlockquoteMarker,
  type Fence,
  type ListMarker,
} from './markdown-lines.js';
import type { MarkdownListItem } from './markdown-nodes.js';
import { createParagraphState, type ParagraphState } from './markdown-paragraph-state.js';

interface CollectedItem {
  lines: string[];
  checked: boolean | null;
  next: number;
}

const taskMarker = /^\[([ xX])\][ \t]+(?=\S)/;

/**
 * A paragraph continuation line without the container's marker or indentation: the container's
 * last line left a paragraph open, and the line starts no other block.
 */
function isLazyLine(state: ParagraphState, line: string, next: string | undefined): boolean {
  if (!state.isOpen() || isBlank(line)) return false;
  return !interruptsParagraph(line, next) && readListMarker(line) === null;
}

export const readBlockquote: BlockReader = (lines, at, context) => {
  if (stripBlockquoteMarker(lines[at] ?? '') === null) return null;
  const inner: string[] = [];
  const state = createParagraphState();
  let index = at;
  for (; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    const stripped = stripBlockquoteMarker(line);
    const content = stripped ?? (isLazyLine(state, line, lines[index + 1]) ? line : null);
    if (content === null) break;
    inner.push(content);
    state.push(content);
  }
  return { block: { type: 'blockquote', children: context.parseBlocks(inner) }, next: index };
};

function nextNonBlank(lines: readonly string[], from: number): number {
  let index = from;
  while (index < lines.length && isBlank(lines[index] ?? '')) index += 1;
  return index;
}

/** Reads one list item's lines, without its marker and content indentation. */
function collectItem(lines: readonly string[], at: number, marker: ListMarker): CollectedItem {
  const head = (lines[at] ?? '').slice(marker.contentIndent);
  const task = taskMarker.exec(head);
  const itemLines = [task ? head.slice(task[0].length) : head];
  const state = createParagraphState();
  state.push(itemLines[0] ?? '');
  const add = (line: string) => {
    itemLines.push(line);
    state.push(line);
  };
  let index = at + 1;
  while (index < lines.length) {
    const line = lines[index] ?? '';
    if (isBlank(line)) {
      const resume = nextNonBlank(lines, index);
      if (resume >= lines.length || indentOf(lines[resume] ?? '') < marker.contentIndent) break;
      for (; index < resume; index += 1) add('');
    } else if (indentOf(line) >= marker.contentIndent) {
      add(line.slice(marker.contentIndent));
      index += 1;
    } else if (isLazyLine(state, line, lines[index + 1])) {
      add(line.trimStart());
      index += 1;
    } else {
      break;
    }
  }
  const checked = task ? task[1] !== ' ' : null;
  return { lines: itemLines, checked, next: index };
}

/**
 * Whether a blank line separates two of an item's own blocks, rather than lines inside its fenced
 * code or between the items of a list nested in it.
 */
function hasLooseGap(lines: readonly string[]): boolean {
  let fence: Fence | null = null;
  let previous = '';
  let sawBlank = false;
  for (const line of lines) {
    if (fence) {
      if (isFenceClose(line, fence)) fence = null;
    } else if (isBlank(line)) {
      sawBlank = previous !== '';
      continue;
    } else {
      const isNested = indentOf(previous) > 0 || readListMarker(previous) !== null;
      if (sawBlank && !isNested) return true;
      fence = readFence(line);
    }
    previous = line;
    sawBlank = false;
  }
  return false;
}

function isSibling(marker: ListMarker | null, first: ListMarker): marker is ListMarker {
  return marker !== null && marker.ordered === first.ordered && marker.symbol === first.symbol;
}

export const readList: BlockReader = (lines, at, context) => {
  const first = readListMarker(lines[at] ?? '');
  if (!first) return null;
  const items: MarkdownListItem[] = [];
  let tight = true;
  let index = at;
  while (index < lines.length) {
    const marker = readListMarker(lines[index] ?? '');
    if (!isSibling(marker, first)) break;
    const item = collectItem(lines, index, marker);
    if (hasLooseGap(item.lines)) tight = false;
    items.push({
      type: 'listItem',
      checked: item.checked,
      children: context.parseBlocks(item.lines),
    });
    const resume = nextNonBlank(lines, item.next);
    if (resume === item.next || !isSibling(readListMarker(lines[resume] ?? ''), first)) {
      index = item.next;
      continue;
    }
    tight = false;
    index = resume;
  }
  return {
    block: { type: 'list', ordered: first.ordered, start: first.start, tight, children: items },
    next: index,
  };
};
