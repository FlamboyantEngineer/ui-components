import type { ReactNode } from 'react';
import type { CodeTokenizer } from '../code-editor/code-editor.js';
import type { MarkdownNode } from '../markdown/markdown.js';
export interface CodeBlockOverrideOptions {
    /** Shows an Apply action on every block, called with the block's value and its fence language. */
    onApply?: ((code: string, language: string | null) => void) | undefined;
    /** Names the Apply action. Defaults to the provider's `codeBlockApply` string. */
    applyLabel?: string | undefined;
    /** Tokenizers by fence language, such as `{ ts: tokenizeScript }`, for highlighting. */
    tokenizers?: Readonly<Record<string, CodeTokenizer>> | undefined;
}
/**
 * Creates a `renderNode` for `Markdown` that draws each code block as a `CodeBlock`, headed by its
 * fence language: a `console`, `terminal` or `shell-session` fence becomes a terminal block. Other
 * nodes keep their default rendering. Create it once (for example with `useMemo`), so a streaming
 * `Markdown` keeps its finished blocks.
 */
export declare function createCodeBlockOverride(options?: CodeBlockOverrideOptions): (node: MarkdownNode) => ReactNode;
//# sourceMappingURL=markdown-code-block.d.ts.map