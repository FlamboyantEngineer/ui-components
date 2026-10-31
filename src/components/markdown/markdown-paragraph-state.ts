// Follows the lines of a block quote or list item to know whether the last one leaves a paragraph
// open, since only an open paragraph takes lazy continuation lines (specs/MARKDOWN.md).

import {
  indentOf,
  interruptsParagraph,
  isBlank,
  isFenceClose,
  isTableStart,
  readFence,
  readListMarker,
  readSetextLevel,
  stripBlockquoteMarker,
  type Fence,
} from './markdown-lines.js';

export interface ParagraphState {
  /** Reads the container's next line, as its block parser will see it. */
  push: (line: string) => void;
  /** The last line read leaves a paragraph open. */
  isOpen: () => boolean;
}

/** The line inside the block quotes and list items it opens, and whether it opened any. */
function stripContainers(line: string): { content: string; opensContainer: boolean } {
  let content = line;
  let opensContainer = false;
  for (;;) {
    const quoted = stripBlockquoteMarker(content);
    const marker = quoted === null ? readListMarker(content) : null;
    if (quoted === null && marker === null) return { content, opensContainer };
    content = quoted ?? content.slice(marker?.contentIndent ?? 0);
    opensContainer = true;
  }
}

export function createParagraphState(): ParagraphState {
  let isOpen = false;
  let isTable = false;
  let fence: Fence | null = null;
  let last = '';
  /** How a line inside the open paragraph reads it: undefined when the line starts a block. */
  const continueParagraph = (content: string): boolean | undefined => {
    if (readSetextLevel(content) !== null) return false;
    if (isTableStart(last, content)) {
      isTable = true;
      return false;
    }
    return interruptsParagraph(content, undefined) ? undefined : true;
  };
  const read = (line: string): boolean => {
    if (fence) {
      if (isFenceClose(line.trimStart(), fence)) fence = null;
      return false;
    }
    const { content, opensContainer } = stripContainers(line);
    if (isBlank(content)) return false;
    const continued = isOpen && !opensContainer ? continueParagraph(content) : undefined;
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
      last = isOpen ? stripContainers(line).content : '';
    },
    isOpen: () => isOpen,
  };
}
