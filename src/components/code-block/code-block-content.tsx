'use client';

// The preformatted content of a code block: highlighted tokens, or terminal lines whose commands
// follow a prompt (specs/CODE-BLOCK.md).

import { Fragment, useMemo } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { CodeTokenizer } from '../code-editor/code-editor.js';
import { TextMatch } from '../text-match/text-match.js';

/** One line of a terminal block: a command typed after the prompt, or output. */
export interface TerminalLine {
  kind: 'command' | 'output';
  /** The line without its prompt. */
  text: string;
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
  'prompt',
]);

const hooks = codeBlockHooks;

/** Reads terminal lines: a line that is the prompt, or starts with it and a space, is a command. */
export function splitTerminalLines(code: string, prompt: string): TerminalLine[] {
  return code.split('\n').map((line) => {
    if (line === prompt) return { kind: 'command', text: '' };
    if (line.startsWith(`${prompt} `))
      return { kind: 'command', text: line.slice(prompt.length + 1) };
    return { kind: 'output', text: line };
  });
}

/** What Copy and Apply use: a terminal block's commands without their prompts, or else the code. */
export function readCodeBlockValue(code: string, commands: readonly TerminalLine[]): string {
  return commands.length === 0 ? code : commands.map((line) => line.text).join('\n');
}

export function CodeTokens({ code, tokenize }: { code: string; tokenize?: CodeTokenizer }) {
  const tokens = useMemo(() => (tokenize ? tokenize(code) : null), [code, tokenize]);
  if (!tokens) return <TextMatch>{code}</TextMatch>;
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

/** Terminal lines; the prompt is decoration, hidden from assistive technology and from Copy. */
export function TerminalLines({ lines, prompt }: { lines: TerminalLine[]; prompt: string }) {
  return lines.map((line, index) => (
    <Fragment key={index}>
      {index > 0 ? '\n' : null}
      <span {...hooks.slot('line', { kind: line.kind })}>
        {line.kind === 'command' ? (
          <span {...hooks.slot('prompt')} aria-hidden="true">
            {`${prompt} `}
          </span>
        ) : null}
        <TextMatch>{line.text}</TextMatch>
      </span>
    </Fragment>
  ));
}
