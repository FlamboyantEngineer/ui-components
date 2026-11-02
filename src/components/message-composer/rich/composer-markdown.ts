// The rich composer's document as Markdown text with token ranges, and back.

import type { Node } from 'prosemirror-model';
import type { MessageComposerMessage, MessageComposerToken } from '../composer-message.js';
import { composerSchema as schema, getPillText, type PillAttributes } from './composer-schema.js';

// A fence is three or more backticks; the opening one may name a language, and a run of at least
// as many backticks alone on a line closes it, as in CommonMark.
const openingFence = /^(`{3,})([^`\s]*)$/;
const backtickLine = /^`+$/;
const backtickRun = /`+/g;

/** A fence longer than every run of backticks in `code`, so no line of it closes the block. */
function toFence(code: string): string {
  const longest = Math.max(0, ...Array.from(code.matchAll(backtickRun), ([run]) => run.length));
  return '`'.repeat(Math.max(3, longest + 1));
}

/** A pill's token without its range: `recordType` only when the pill has one. */
function toPillToken({ kind, id, label, recordType }: PillAttributes) {
  return { kind, id, label, ...(recordType === undefined ? {} : { recordType }) };
}

/** Lines of text written one after another, with the tokens placed in them. */
function createWriter() {
  const lines: string[] = [];
  const tokens: MessageComposerToken[] = [];
  let length = 0;
  return {
    /** Starts a line and returns where it starts in the text. */
    line(text: string): number {
      const start = lines.length === 0 ? 0 : length + 1;
      lines.push(text);
      length = start + text.length;
      return start;
    },
    token(token: MessageComposerToken) {
      tokens.push(token);
    },
    finish: (): MessageComposerMessage => ({ text: lines.join('\n'), tokens }),
  };
}

type Writer = ReturnType<typeof createWriter>;

/** A paragraph as one line, its pills as tokens over their text. */
function writeParagraph(writer: Writer, block: Node) {
  let text = '';
  const placed: MessageComposerToken[] = [];
  block.forEach((child) => {
    if (child.isText) {
      text += child.text ?? '';
      return;
    }
    const pillText = getPillText(child);
    const token = toPillToken(child.attrs as PillAttributes);
    placed.push({ ...token, start: text.length, end: text.length + pillText.length });
    text += pillText;
  });
  const start = writer.line(text);
  for (const token of placed) {
    writer.token({ ...token, start: start + token.start, end: start + token.end });
  }
}

/**
 * The document as Markdown: a line per paragraph, code blocks between fences longer than any run of
 * backticks in their code, pills as text.
 */
export function serializeComposerDocument(doc: Node): MessageComposerMessage {
  const writer = createWriter();
  doc.forEach((block) => {
    if (!block.type.spec.code) return writeParagraph(writer, block);
    const fence = toFence(block.textContent);
    writer.line(`${fence}${String(block.attrs.language ?? '')}`);
    for (const line of block.textContent.split('\n')) writer.line(line);
    writer.line(fence);
  });
  return writer.finish();
}

/** The paragraph for one line, with a pill for each token that lies within it. */
function parseLine(line: string, start: number, tokens: MessageComposerToken[]) {
  const children: Node[] = [];
  let at = 0;
  const inside = tokens
    .filter((token) => token.start >= start && token.end <= start + line.length)
    .sort((a, b) => a.start - b.start);
  for (const token of inside) {
    const offset = token.start - start;
    if (offset < at) continue;
    if (offset > at) children.push(schema.text(line.slice(at, offset)));
    children.push(schema.node('pill', toPillToken(token)));
    at = token.end - start;
  }
  if (at < line.length) children.push(schema.text(line.slice(at)));
  return schema.node('paragraph', null, children);
}

/** Where the code block opened at `open` closes, or -1 when it never does. */
function findClosingFence(lines: readonly string[], open: number): number {
  const length = openingFence.exec(lines[open] ?? '')?.[1]?.length;
  if (length === undefined) return -1;
  return lines.findIndex(
    (line, index) => index > open && line.length >= length && backtickLine.test(line),
  );
}

/**
 * The document for a message: a paragraph per line with pills over its tokens, and a code block
 * for each fenced run of lines. An unclosed fence stays text.
 */
export function parseComposerMessage(message: MessageComposerMessage): Node {
  const lines = message.text.split('\n');
  const blocks: Node[] = [];
  let start = 0;
  for (let index = 0; index < lines.length; ) {
    const line = lines[index] ?? '';
    const close = findClosingFence(lines, index);
    if (close === -1) {
      blocks.push(parseLine(line, start, message.tokens));
      start += line.length + 1;
      index += 1;
      continue;
    }
    const code = lines.slice(index + 1, close).join('\n');
    const language = openingFence.exec(line)?.[2] ?? '';
    blocks.push(schema.node('codeBlock', { language }, code ? schema.text(code) : undefined));
    start += lines.slice(index, close + 1).join('\n').length + 1;
    index = close + 1;
  }
  return schema.node('doc', null, blocks);
}
