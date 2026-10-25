import { useId, useMemo, useRef } from 'react';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import { Button } from '../button/button.js';
import type { CodeTokenizer } from '../code-editor/code-editor.js';
import { CopyButton } from '../copy-button/copy-button.js';
import {
  CodeTokens,
  TerminalLines,
  codeBlockHooks as hooks,
  readCodeBlockValue,
  splitTerminalLines,
  type TerminalLine,
} from './code-block-content.js';
import { useHorizontalOverflow } from './use-horizontal-overflow.js';

export { createCodeBlockOverride } from './markdown-code-block.js';
export type { CodeBlockOverrideOptions } from './markdown-code-block.js';

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

export interface CodeBlockProps extends BaseProps, CodeBlockData {
  /** Shows an Apply action that hands over the block's value, such as to insert it in a file. */
  onApply?: ((code: string) => void) | undefined;
  /** Names the Apply action. Defaults to the provider's `codeBlockApply` string. */
  applyLabel?: string | undefined;
  /** Splits the code of a `code` block into typed tokens for highlighting, as `CodeEditor` does. */
  tokenize?: CodeTokenizer | undefined;
  /** The prompt that starts a command line of a `terminal` block. Defaults to `$`. */
  prompt?: string | undefined;
}

function readCopyLabel(strings: UiStrings, variant: CodeBlockVariant, commands: TerminalLine[]) {
  if (variant === 'code') return strings.codeBlockCopy;
  return commands.length > 0
    ? strings.codeBlockCopyCommands(commands.length)
    : strings.codeBlockCopyOutput;
}

/**
 * A block of code headed by its title or language, with a Copy button and an optional Apply
 * action. The code is preformatted and scrolls sideways; while it overflows, the reader can focus it
 * to scroll by keyboard. A `terminal` block marks its command lines and copies only the commands.
 */
export function CodeBlock({
  code,
  language,
  title,
  variant = 'code',
  onApply,
  applyLabel,
  tokenize,
  prompt = '$',
  className,
  id,
  ...rest
}: CodeBlockProps) {
  const strings = useUiStrings();
  const titleId = useId();
  const codeRef = useRef<HTMLPreElement>(null);
  const isOverflowing = useHorizontalOverflow(codeRef, code);
  const lines = useMemo(
    () => (variant === 'terminal' ? splitTerminalLines(code, prompt) : null),
    [code, prompt, variant],
  );
  const commands = lines?.filter((line) => line.kind === 'command') ?? [];
  const value = readCodeBlockValue(code, commands);
  return (
    <div
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
        {...hooks.slot('code', { overflowing: isOverflowing })}
        ref={codeRef}
        tabIndex={isOverflowing ? 0 : undefined}
      >
        <code>
          {lines ? (
            <TerminalLines lines={lines} prompt={prompt} />
          ) : (
            <CodeTokens code={code} tokenize={tokenize} />
          )}
        </code>
      </pre>
    </div>
  );
}
