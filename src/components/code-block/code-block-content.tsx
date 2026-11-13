'use client';

// The preformatted content of a code block: highlighted tokens, or terminal lines whose commands
// follow a prompt, each line numbered on request (specs/CODE-BLOCK.md).

import { type ReactNode, useMemo } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { CodeToken, CodeTokenizer } from '../code-editor/code-editor.js';
import { TextMatch } from '../text-match/text-match.js';

/** One line of a terminal block: a command typed after the prompt, or output. */
export interface TerminalLine {
  kind: 'command' | 'output';
  /** The line without its prompt. */
  text: string;
  /**
   * A command line that continues the command above it, which ended in a line continuation (an
   * odd number of backslashes): drawn without a prompt and copied as written.
   */
  isContinuation?: boolean | undefined;
}

/** Whether a command's line ends in a line continuation: an odd run of backslashes at its end. */
function endsInContinuation(text: string): boolean {
  const run = /\\+$/.exec(text)?.[0].length ?? 0;
  return run % 2 === 1;
}

export const codeBlockHooks = createHooks('code-block', [
  'header',
  'title',
  'actions',
  'apply',
  'copy',
  'code',
  'token',
  'line',
  'line-number',
  'prompt',
]);

const hooks = codeBlockHooks;

/**
 * Reads terminal lines: a line that is the prompt, or starts with it and a space, is a command, and
 * so is each line after a command line ending in a line continuation. Here-documents and open
 * quotes are not followed: their lines read as output.
 */
export function splitTerminalLines(code: string, prompt: string): TerminalLine[] {
  let continues = false;
  return code.split('\n').map((line): TerminalLine => {
    const read: TerminalLine = continues
      ? { kind: 'command', text: line, isContinuation: true }
      : line === prompt
        ? { kind: 'command', text: '' }
        : line.startsWith(`${prompt} `)
          ? { kind: 'command', text: line.slice(prompt.length + 1) }
          : { kind: 'output', text: line };
    continues = read.kind === 'command' && endsInContinuation(read.text);
    return read;
  });
}

/** What Copy and Apply use: a terminal block's commands without their prompts, or else the code. */
export function readCodeBlockValue(code: string, commands: readonly TerminalLine[]): string {
  return commands.length === 0 ? code : commands.map((line) => line.text).join('\n');
}

/**
 * Splits tokens into lines at their line breaks, which are dropped; a token across a break
 * continues on the next line with its type.
 */
export function splitTokenLines(tokens: readonly CodeToken[]): CodeToken[][] {
  let line: CodeToken[] = [];
  const lines = [line];
  for (const token of tokens) {
    token.text.split('\n').forEach((text, index) => {
      if (index > 0) {
        line = [];
        lines.push(line);
      }
      if (text) line.push({ ...token, text });
    });
  }
  return lines;
}

/**
 * The lines that get a number: every line, except the empty one after a final line break, which
 * would number a row that shows nothing.
 */
export function countNumberedLines(lineCount: number, code: string): number {
  return lineCount > 1 && code.endsWith('\n') ? lineCount - 1 : lineCount;
}

function Tokens({ tokens }: { tokens: readonly CodeToken[] }) {
  return tokens.map(({ text, type }, index) =>
    type ? (
      <span key={index} {...hooks.slot('token', { token: type })}>
        <TextMatch>{text}</TextMatch>
      </span>
    ) : (
      <TextMatch key={index}>{text}</TextMatch>
    ),
  );
}

interface LineProps {
  /** The line's number, drawn by the stylesheet from `data-line-number`; none without numbers. */
  number: number | null;
  kind?: TerminalLine['kind'] | undefined;
  /** Whether a line break follows, kept inside the line so a line can be a block. */
  isBroken: boolean;
  children: ReactNode;
}

/** One line; its number is an empty decoration, so it never reaches the text, a selection or Copy. */
function Line({ number, kind, isBroken, children }: LineProps) {
  return (
    <span {...hooks.slot('line', { kind })}>
      {number === null ? null : (
        <span {...hooks.slot('line-number')} data-line-number={number} aria-hidden="true" />
      )}
      {children}
      {isBroken ? '\n' : null}
    </span>
  );
}

/** The number of the line at `index`, or none past the numbered lines or without numbers. */
function readLineNumber(index: number, numbered: number | null) {
  return numbered !== null && index < numbered ? index + 1 : null;
}

interface CodeTokensProps {
  code: string;
  tokenize?: CodeTokenizer | undefined;
  /** How many lines to number, from the first; `null` renders one run without lines. */
  numbered: number | null;
}

export function CodeTokens({ code, tokenize, numbered }: CodeTokensProps) {
  const tokens = useMemo(() => (tokenize ? tokenize(code) : [{ text: code }]), [code, tokenize]);
  const lines = useMemo(
    () => (numbered === null ? null : splitTokenLines(tokens)),
    [numbered, tokens],
  );
  if (!lines) return <Tokens tokens={tokens} />;
  return lines.map((line, index) => (
    <Line key={index} number={readLineNumber(index, numbered)} isBroken={index < lines.length - 1}>
      <Tokens tokens={line} />
    </Line>
  ));
}

interface TerminalLinesProps {
  lines: readonly TerminalLine[];
  prompt: string;
  /** How many lines to number, from the first; `null` for none. */
  numbered: number | null;
}

/** Terminal lines; the prompt is decoration, hidden from assistive technology and from Copy. */
export function TerminalLines({ lines, prompt, numbered }: TerminalLinesProps) {
  return lines.map((line, index) => (
    <Line
      key={index}
      number={readLineNumber(index, numbered)}
      kind={line.kind}
      isBroken={index < lines.length - 1}
    >
      {line.kind === 'command' && !line.isContinuation ? (
        <span {...hooks.slot('prompt')} aria-hidden="true">
          {`${prompt} `}
        </span>
      ) : null}
      <TextMatch>{line.text}</TextMatch>
    </Line>
  ));
}
