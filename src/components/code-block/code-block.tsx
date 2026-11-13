'use client';

import { type CSSProperties, useId, useMemo, useRef } from 'react';
import { measuredProperty } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import { Button } from '../button/button.js';
import type { CodeEditorWrap, CodeTokenizer } from '../code-editor/code-editor.js';
import { CopyButton } from '../copy-button/copy-button.js';
import {
  codeBlockHooks as hooks,
  CodeTokens,
  countNumberedLines,
  readCodeBlockValue,
  splitTerminalLines,
  type TerminalLine,
  TerminalLines,
} from './code-block-content.js';
import { useScrollOverflow } from './use-scroll-overflow.js';

export type { CodeBlockOverrideOptions } from './markdown-code-block.js';
export { createCodeBlockOverride } from './markdown-code-block.js';

/** `code` shows source; `terminal` shows commands after a prompt and their output. */
export type CodeBlockVariant = 'code' | 'terminal';

/** The data of a code block, as a message part carries it. */
export interface CodeBlockData {
  /** The code, shown exactly as given. */
  code: string;
  /** The language, such as `ts`; heads the block when there is no `title`. */
  language?: string | undefined;
  /** Heads the block in place of the language, such as a file name. */
  title?: string | undefined;
  /** Defaults to `code`. */
  variant?: CodeBlockVariant | undefined;
}

export interface CodeBlockProps extends RefProps<HTMLDivElement>, BaseProps, CodeBlockData {
  /** Shows an Apply action that hands over the block's value, such as to insert it in a file. */
  onApply?: ((code: string) => void) | undefined;
  /** Names the Apply action. Defaults to the provider's `codeBlockApply` string. */
  applyLabel?: string | undefined;
  /** Splits the code of a `code` block into typed tokens for highlighting, as `CodeEditor` does. */
  tokenize?: CodeTokenizer | undefined;
  /** The prompt that starts a command line of a `terminal` block. Defaults to `$`. */
  prompt?: string | undefined;
  /** Numbers the lines, from 1; the numbers stay out of the text, a selection and Copy. */
  lineNumbers?: boolean | undefined;
  /** `off` (the default) scrolls long lines sideways; `soft` wraps them. */
  wrap?: CodeEditorWrap | undefined;
}

function readCopyLabel(strings: UiStrings, variant: CodeBlockVariant, commands: TerminalLine[]) {
  if (variant === 'code') return strings.codeBlockCopy;
  // A continuation line belongs to the command above it.
  const count = commands.filter((line) => !line.isContinuation).length;
  return count > 0 ? strings.codeBlockCopyCommands(count) : strings.codeBlockCopyOutput;
}

/** The digit count of the highest line number, from which the stylesheet sizes the gutter. */
function readGutterStyle(numbered: number | null): CSSProperties | undefined {
  if (numbered === null) return undefined;
  return measuredProperty('code-block-line-number-digits', String(String(numbered).length));
}

/**
 * A block of code headed by its title or language, with a Copy button and an optional Apply
 * action. The code is preformatted and scrolls, or wraps on request; while it overflows, the reader
 * can focus it to scroll by keyboard. A `terminal` block marks its command lines and copies only the
 * commands.
 */
export function CodeBlock({
  ref,
  code,
  language,
  title,
  variant = 'code',
  onApply,
  applyLabel,
  tokenize,
  prompt = '$',
  lineNumbers = false,
  wrap = 'off',
  className,
  id,
  ...rest
}: CodeBlockProps) {
  const strings = useUiStrings();
  const titleId = useId();
  const codeRef = useRef<HTMLPreElement>(null);
  const isOverflowing = useScrollOverflow(codeRef);
  const lines = useMemo(
    () => (variant === 'terminal' ? splitTerminalLines(code, prompt) : null),
    [code, prompt, variant],
  );
  const commands = lines?.filter((line) => line.kind === 'command') ?? [];
  const value = readCodeBlockValue(code, commands);
  const numbered = lineNumbers ? countNumberedLines(code.split('\n').length, code) : null;
  return (
    <div
      ref={ref}
      {...hooks.root({ className, props: rest, data: { variant, language } })}
      id={id}
      role="group"
      aria-labelledby={titleId}
    >
      <div {...hooks.slot('header')}>
        <span {...hooks.slot('title')} id={titleId}>
          {title ?? language ?? strings.codeBlockTitle(variant)}
        </span>
        <span {...hooks.slot('actions')}>
          {onApply ? (
            <Button
              className={hooks.slotClass('apply')}
              size="sm"
              variant="ghost"
              onPress={() => onApply(value)}
            >
              {applyLabel ?? strings.codeBlockApply}
            </Button>
          ) : null}
          <CopyButton
            className={hooks.slotClass('copy')}
            value={value}
            label={readCopyLabel(strings, variant, commands)}
            size="sm"
          />
        </span>
      </div>
      <pre
        {...hooks.slot('code', { overflowing: isOverflowing, wrap, lineNumbers })}
        ref={codeRef}
        style={readGutterStyle(numbered)}
        tabIndex={isOverflowing ? 0 : undefined}
      >
        <code>
          {lines ? (
            <TerminalLines lines={lines} prompt={prompt} numbered={numbered} />
          ) : (
            <CodeTokens code={code} tokenize={tokenize} numbered={numbered} />
          )}
        </code>
      </pre>
    </div>
  );
}
