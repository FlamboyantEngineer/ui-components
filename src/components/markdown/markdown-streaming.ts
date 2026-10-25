// Prepares Markdown that is still arriving for the parser: holds back a last line too short to
// read yet and closes the inline syntax the last paragraph leaves open (specs/MARKDOWN.md,
// UIC-MARKDOWN-2.11). Pure text in, text out: the parser stays as it is.

import { closeStreamingInlines } from './markdown-streaming-inlines.js';

/** Indentation, block quote markers and list markers before a line's content. */
const containerPrefix = /^(?:[ \t]*(?:>|[-+*](?=[ \t])|\d{1,9}[.)](?=[ \t])))*[ \t]*/;

const fenceLine = /^(`{3,}|~{3,})(.*)$/;

/** A line that starts a block of its own: a list item, a heading or a table row. */
const blockStart = /^[ \t]*(?:(?:[-+*]|\d{1,9}[.)])(?:[ \t]|$)|#{1,6}(?:[ \t]|$)|\|)/;

function contentOf(line: string): string {
  return line.replace(containerPrefix, '');
}

/** The fence still open after the lines, and where the last run of lines after a blank line starts. */
function scanLines(lines: readonly string[]): { fence: string | null; lastBlock: number } {
  let fence: string | null = null;
  let lastBlock = 0;
  lines.forEach((line, index) => {
    const content = contentOf(line);
    const match = fenceLine.exec(content);
    const marker = match?.[1] ?? '';
    if (fence !== null) {
      const closes = marker.startsWith(fence.charAt(0)) && marker.length >= fence.length;
      if (closes && match?.[2]?.trim() === '') [fence, lastBlock] = [null, index + 1];
    } else if (match && !(marker.startsWith('`') && match[2]?.includes('`'))) {
      fence = marker;
    } else if (content.trim() === '') {
      lastBlock = index + 1;
    }
  });
  return { fence, lastBlock };
}

/** Inside an open fence, a last line that may yet close it. */
function isPartialFenceClose(line: string, fence: string): boolean {
  const marker = /^(`+|~+)[ \t]*$/.exec(contentOf(line))?.[1] ?? '';
  return marker.startsWith(fence.charAt(0)) && marker.length < fence.length;
}

/**
 * A last line that cannot be read yet: an opening fence whose language may be partial, a marker
 * that may become a fence, a list item, a heading, a break or a setext underline, or a table row.
 */
function isPendingLine(line: string): boolean {
  if (line.trim() === '') return true;
  const content = contentOf(line).trim();
  if (/^(?:`+|~+)/.test(content) && /^(?:`{1,2}|~{1,2}|`{3,}[^`]*|~{3,}.*)$/.test(content)) {
    return true;
  }
  return (
    /^[-=*_+#~\s]*$/.test(content) || /^\d{1,9}[.)]?$/.test(content) || content.startsWith('|')
  );
}

/** Drops a last table row that has no divider row under it yet. */
function holdBackTableHeader(lines: string[]): string[] {
  const isRow = (line: string | undefined) => line?.trimStart().startsWith('|') ?? false;
  return isRow(lines.at(-1)) && !isRow(lines.at(-2)) ? lines.slice(0, -1) : lines;
}

/** Closes the inline syntax of the last paragraph, list item or heading of the last block. */
function closeLastParagraph(lines: string[], lastBlock: number): string[] {
  const block = lines.slice(lastBlock);
  const startAt = block.findLastIndex((line) => blockStart.test(line));
  const first = startAt === -1 ? 0 : startAt;
  const line = block[first] ?? '';
  const isIndentedCode = !blockStart.test(line) && /^ {4}/.test(line);
  if (block.length === 0 || line.trimStart().startsWith('|') || isIndentedCode) return lines;
  const paragraph = closeStreamingInlines(block.slice(first).join('\n'));
  return [...lines.slice(0, lastBlock + first), paragraph];
}

/**
 * Prepares a streaming source for `parseMarkdown`. Inside an open fence, the code shows as code and
 * a last line that may close the fence waits. Elsewhere a last line that cannot be read yet waits,
 * as does a table row without its divider, and the last paragraph's open inline syntax is closed.
 */
export function prepareStreamingMarkdown(source: string): string {
  const lines = source.split(/\r\n?|\n/);
  const last = lines.pop() ?? '';
  const { fence, lastBlock } = scanLines(lines);
  if (fence !== null) {
    return isPartialFenceClose(last, fence) ? lines.join('\n') : source;
  }
  const kept = holdBackTableHeader(isPendingLine(last) ? lines : [...lines, last]);
  return closeLastParagraph(kept, lastBlock).join('\n');
}
