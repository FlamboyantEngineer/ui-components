// A Markdown node override that renders fenced and indented code through `CodeBlock`
// (specs/CODE-BLOCK.md, UIC-MARKDOWN-2.8).

import type { ReactNode } from 'react';
import type { CodeTokenizer } from '../code-editor/code-editor.js';
import type { MarkdownNode } from '../markdown/markdown.js';
import { CodeBlock } from './code-block.js';

export interface CodeBlockOverrideOptions {
  /** Shows an Apply action on every block, called with the block's value and its fence language. */
  onApply?: ((code: string, language: string | null) => void) | undefined;
  /** Names the Apply action. Defaults to the provider's `codeBlockApply` string. */
  applyLabel?: string | undefined;
  /** Tokenizers by fence language, such as `{ ts: tokenizeScript }`, for highlighting. */
  tokenizers?: Readonly<Record<string, CodeTokenizer>> | undefined;
}

/** Fence languages that name a terminal session rather than a script. */
const terminalLanguages: ReadonlySet<string> = new Set(['console', 'terminal', 'shell-session']);

/**
 * Creates a `renderNode` for `Markdown` that draws each code block as a `CodeBlock`, headed by its
 * fence language: a `console`, `terminal` or `shell-session` fence becomes a terminal block. Other
 * nodes keep their default rendering. Create it once (for example with `useMemo`), so a streaming
 * `Markdown` keeps its finished blocks.
 */
export function createCodeBlockOverride(options: CodeBlockOverrideOptions = {}) {
  const { onApply, applyLabel, tokenizers } = options;
  return (node: MarkdownNode): ReactNode => {
    if (node.type !== 'codeBlock') return undefined;
    const { language, text } = node;
    return (
      <CodeBlock
        code={text}
        language={language ?? undefined}
        variant={language !== null && terminalLanguages.has(language) ? 'terminal' : 'code'}
        tokenize={language === null ? undefined : tokenizers?.[language]}
        onApply={onApply ? (code) => onApply(code, language) : undefined}
        applyLabel={applyLabel}
      />
    );
  };
}
