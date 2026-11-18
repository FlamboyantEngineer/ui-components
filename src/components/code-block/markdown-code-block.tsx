'use client';

// A Markdown node override that renders fenced and indented code through `CodeBlock`
// (specs/CODE-BLOCK.md, UIC-MARKDOWN-2.8).

import type { ReactNode } from 'react';
import type { CodeTokenizer } from '../code-editor/code-editor.js';
import type { MarkdownNode } from '../markdown/markdown.js';
import { CodeBlock } from './code-block.js';
import { isPlainTextLanguage } from './code-block-languages.js';

export interface CodeBlockOverrideOptions {
  /** Shows an Apply action on every block, called with the block's value and its fence language. */
  onApply?: ((code: string, language: string | null) => void) | undefined;
  /** Names the Apply action. Defaults to the provider's `codeBlockApply` string. */
  applyLabel?: string | undefined;
  /**
   * Tokenizers by fence language, such as `{ ts: tokenizeScript }`, for highlighting. A language
   * the map does not register keeps the built-in highlighting of its name.
   */
  tokenizers?: Readonly<Record<string, CodeTokenizer>> | undefined;
}

/** The tokenizer registered as the map's own entry for `language`, never an inherited property. */
function findTokenizer(
  tokenizers: CodeBlockOverrideOptions['tokenizers'],
  language: string | null,
): CodeTokenizer | undefined {
  if (!tokenizers || language === null || !Object.hasOwn(tokenizers, language)) return undefined;
  return tokenizers[language];
}

/** Fence languages that name a terminal session rather than a script. */
const terminalLanguages: ReadonlySet<string> = new Set(['console', 'terminal', 'shell-session']);

/**
 * Creates a `renderNode` for `Markdown` that draws each code block as a `CodeBlock`, headed by its
 * fence language: a `console`, `terminal` or `shell-session` fence becomes a terminal block, and a
 * plain-text fence (`text`, `txt`, `plain`, `plaintext`) wraps its long lines, which hold prose
 * rather than code. Other nodes keep their default rendering. Create it once (for example with `useMemo`), so a streaming
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
        tokenize={findTokenizer(tokenizers, language)}
        wrap={isPlainTextLanguage(language) ? 'soft' : 'off'}
        onApply={onApply ? (code) => onApply(code, language) : undefined}
        applyLabel={applyLabel}
      />
    );
  };
}
