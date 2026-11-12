// Follows the lines of a block quote or list item to know whether the last one leaves a paragraph
// open, since only an open paragraph takes lazy continuation lines (specs/MARKDOWN.md).

import { maxMarkupDepth } from '../../utils/markup.js';
import {
  type Fence,
  indentOf,
  interruptsParagraph,
  isBlank,
  isFenceClose,
  isTableStart,
  readFence,
  readListMarker,
  readSetextLevel,
  stripBlockquoteMarker,
  stripColumns,
  stripIndent,
} from './markdown-lines.js';

export interface ParagraphState {
  /** Reads the container's next line, as its block parser will see it. */
  push: (line: string) => void;
  /** The last line read leaves a paragraph open. */
  isOpen: () => boolean;
}

interface Containers {
  content: string;
  opensContainer: boolean;
}

/**
 * The deepest container nesting the parser opens: past it, a quote or list marker stays paragraph
 * text, so hostile nesting cannot make parsing explode. It matches the depth the renderers draw.
 */
export const maxContainerDepth = maxMarkupDepth;

/**
 * The line inside the open list items its indentation continues, from `depth` on, and the depth
 * it reaches. The indentation is measured once for all of them, not once per item.
 */
function continueItems(content: string, indents: readonly number[], from: number) {
  const lead = indentOf(content);
  let taken = 0;
  let depth = from;
  for (let indent = indents[depth]; indent !== undefined && lead - taken >= indent;) {
    taken += indent;
    depth += 1;
    indent = indents[depth];
  }
  return { content: stripColumns(content, taken), depth };
}

/**
 * The line inside the containers it continues or opens, and whether it opened any. `indents`
 * holds the content columns of the list items still open, outermost first; a line indented to
 * one continues that item, and a list marker opens a new one in its place.
 */
function stripContainers(line: string, indents: number[]): Containers {
  let content = line;
  let opensContainer = false;
  let depth = 0;
  let opened = 0;
  for (;;) {
    if (depth < indents.length && !isBlank(content)) {
      const continued = continueItems(content, indents, depth);
      content = continued.content;
      depth = continued.depth;
    }
    const quoted = stripBlockquoteMarker(content);
    const marker = quoted === null ? readListMarker(content) : null;
    if (quoted === null && marker === null) break;
    // The parser opens no deeper containers, so the rest of the line is its content.
    if (opened >= maxContainerDepth) break;
    opened += 1;
    if (marker) indents.splice(depth, Infinity, marker.contentIndent);
    depth += marker ? 1 : 0;
    content = quoted ?? marker?.content ?? content;
    opensContainer = true;
  }
  if (!isBlank(content)) indents.splice(depth);
  return { content, opensContainer };
}

export function createParagraphState(): ParagraphState {
  let isOpen = false;
  let isTable = false;
  let fence: Fence | null = null;
  let last = '';
  const indents: number[] = [];
  /** How a line inside the open paragraph reads it: undefined when the line starts a block. */
  const continueParagraph = (content: string, previous: string): boolean | undefined => {
    if (readSetextLevel(content) !== null) return false;
    if (isTableStart(previous, content)) {
      isTable = true;
      return false;
    }
    return interruptsParagraph(content, undefined) ? undefined : true;
  };
  const read = (line: string): boolean => {
    if (fence) {
      if (isFenceClose(stripIndent(line), fence)) fence = null;
      return false;
    }
    const { content, opensContainer } = stripContainers(line, indents);
    const wasOpen = isOpen;
    const previous = last;
    last = content;
    if (isBlank(content)) return false;
    const continued = wasOpen && !opensContainer ? continueParagraph(content, previous) : undefined;
    if (continued !== undefined) return continued;
    if (isTable && !opensContainer && !interruptsParagraph(content, undefined)) return false;
    isTable = false;
    fence = readFence(content);
    if (fence || interruptsParagraph(content, undefined)) return false;
    return indentOf(content) < 4;
  };
  return {
    push: (line) => {
      isOpen = read(line);
    },
    isOpen: () => isOpen,
  };
}
