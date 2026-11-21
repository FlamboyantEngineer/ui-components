'use client';

import { type CSSProperties, type ReactNode, useId, useMemo, useRef } from 'react';
import { measuredProperty } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import { useScrollOverflow } from '../../utils/use-scroll-overflow.js';
import { Button } from '../button/button.js';
import type { CodeEditorWrap, CodeTokenizer } from '../code-editor/code-editor.js';
import { CopyButton } from '../copy-button/copy-button.js';
import {
  codeBlockHooks as hooks,
  CodeTokens,
  countNumberedLines,
  type NumberedLines,
  readCodeBlockValue,
  splitTerminalLines,
  type TerminalLine,
  TerminalLines,
} from './code-block-content.js';
import { findLanguageTokenizer } from './code-block-languages.js';
import { CodeBlockFrame, type CodeBlockFrameProps } from './code-block-parts.js';

export type {
  CodeBlockActionsProps,
  CodeBlockContentProps,
  CodeBlockCopyButtonProps,
  CodeBlockFooterProps,
  CodeBlockFrameProps,
  CodeBlockHeaderProps,
  CodeBlockLineProps,
  CodeBlockLineVariant,
  CodeBlockTitleProps,
} from './code-block-parts.js';
export {
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockFooter,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
} from './code-block-parts.js';
export type { CodeBlockOverrideOptions } from './markdown-code-block.js';
export { createCodeBlockOverride } from './markdown-code-block.js';

/** `code` shows source; `terminal` shows commands after a prompt and their output. */
export type CodeBlockVariant = 'code' | 'terminal';

/** `sm` tightens the block's padding and type, shadcn/ui's small code block. */
export type CodeBlockSize = 'default' | 'sm';

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

export interface CodeBlockDataProps extends RefProps<HTMLDivElement>, BaseProps, CodeBlockData {
  /** Padding and type size. Defaults to `default`. */
  size?: CodeBlockSize | undefined;
  /** Shows an Apply action that hands over the block's value, such as to insert it in a file. */
  onApply?: ((code: string) => void) | undefined;
  /** Names the Apply action. Defaults to the provider's `codeBlockApply` string. */
  applyLabel?: string | undefined;
  /**
   * Splits the code of a `code` block into typed tokens for highlighting, as `CodeEditor` does.
   * Defaults to the built-in highlighting of `language`, such as `ts`, `py` or `json`.
   */
  tokenize?: CodeTokenizer | undefined;
  /** The prompt that starts a command line of a `terminal` block. Defaults to `$`. */
  prompt?: string | undefined;
  /** Numbers the lines, from 1; the numbers stay out of the text, a selection and Copy. */
  lineNumbers?: boolean | undefined;
  /** The number of the first line with `lineNumbers`, such as a snippet's line in its file. Defaults to 1. */
  firstLineNumber?: number | undefined;
  /** `off` (the default) scrolls long lines sideways; `soft` wraps them. */
  wrap?: CodeEditorWrap | undefined;
}

/** A block drawn from its `code`, or with `children` and no `code`, one composed from parts. */
export type CodeBlockProps = CodeBlockDataProps | CodeBlockFrameProps;

function isDataBlock(props: CodeBlockProps): props is CodeBlockDataProps {
  return props.code !== undefined;
}

function readCopyLabel(strings: UiStrings, variant: CodeBlockVariant, commands: TerminalLine[]) {
  if (variant === 'code') return strings.codeBlockCopy;
  // A continuation line belongs to the command above it.
  const count = commands.filter((line) => !line.isContinuation).length;
  return count > 0 ? strings.codeBlockCopyCommands(count) : strings.codeBlockCopyOutput;
}

/** The digit count of the highest line number, from which the stylesheet sizes the gutter. */
function readGutterStyle(numbered: NumberedLines | null): CSSProperties | undefined {
  if (numbered === null) return undefined;
  const highest = numbered.first + numbered.count - 1;
  return measuredProperty('code-block-line-number-digits', String(String(highest).length));
}

/** The lines numbered with `lineNumbers`, from the first line's number (a whole number from 1). */
function readNumberedLines(code: string, firstLineNumber: number | undefined): NumberedLines {
  const first = firstLineNumber;
  return {
    count: countNumberedLines(code.split('\n').length, code),
    first: first !== undefined && Number.isInteger(first) && first > 0 ? first : 1,
  };
}

/**
 * A block of code headed by its title or language, with a Copy button and an optional Apply
 * action. The code is preformatted and scrolls, or wraps on request; while it overflows, the reader
 * can focus it to scroll by keyboard. A `terminal` block marks its command lines and copies only the
 * commands.
 */
export function CodeBlock(props: CodeBlockProps) {
  return isDataBlock(props) ? <DataCodeBlock {...props} /> : <CodeBlockFrame {...props} />;
}

/** The data block's header: its title, then its Apply and Copy actions. */
function DataCodeBlockHeader(props: {
  titleId: string;
  title: ReactNode;
  onApply: ((code: string) => void) | undefined;
  applyLabel: string | undefined;
  value: string;
  copyLabel: string;
}) {
  const { onApply, value } = props;
  const strings = useUiStrings();
  return (
    <div {...hooks.slot('header')}>
      <span {...hooks.slot('title')} id={props.titleId}>
        {props.title}
      </span>
      <span {...hooks.slot('actions')}>
        {onApply ? (
          <Button
            className={hooks.slotClass('apply')}
            size="sm"
            variant="ghost"
            onPress={() => onApply(value)}
          >
            {props.applyLabel ?? strings.codeBlockApply}
          </Button>
        ) : null}
        <CopyButton {...hooks.slot('copy')} value={value} label={props.copyLabel} size="sm" />
      </span>
    </div>
  );
}

function DataCodeBlock({
  ref,
  code,
  language,
  title,
  variant = 'code',
  size = 'default',
  onApply,
  applyLabel,
  tokenize,
  prompt = '$',
  lineNumbers = false,
  firstLineNumber,
  wrap = 'off',
  className,
  id,
  ...rest
}: CodeBlockDataProps) {
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
  const numbered = lineNumbers ? readNumberedLines(code, firstLineNumber) : null;
  return (
    <div
      ref={ref}
      {...hooks.root({ className, props: rest, data: { variant, size, language } })}
      id={id}
      role="group"
      aria-labelledby={titleId}
    >
      <DataCodeBlockHeader
        titleId={titleId}
        title={title ?? language ?? strings.codeBlockTitle(variant)}
        onApply={onApply}
        applyLabel={applyLabel}
        value={value}
        copyLabel={readCopyLabel(strings, variant, commands)}
      />
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
            <CodeTokens
              code={code}
              tokenize={tokenize ?? findLanguageTokenizer(language)}
              numbered={numbered}
            />
          )}
        </code>
      </pre>
    </div>
  );
}
