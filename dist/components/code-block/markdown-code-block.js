import { jsx as _jsx } from "react/jsx-runtime";
import { CodeBlock } from './code-block.js';
/** Fence languages that name a terminal session rather than a script. */
const terminalLanguages = new Set(['console', 'terminal', 'shell-session']);
/**
 * Creates a `renderNode` for `Markdown` that draws each code block as a `CodeBlock`, headed by its
 * fence language: a `console`, `terminal` or `shell-session` fence becomes a terminal block. Other
 * nodes keep their default rendering. Create it once (for example with `useMemo`), so a streaming
 * `Markdown` keeps its finished blocks.
 */
export function createCodeBlockOverride(options = {}) {
    const { onApply, applyLabel, tokenizers } = options;
    return (node) => {
        if (node.type !== 'codeBlock')
            return undefined;
        const { language, text } = node;
        return (_jsx(CodeBlock, { code: text, language: language ?? undefined, variant: language !== null && terminalLanguages.has(language) ? 'terminal' : 'code', tokenize: language === null ? undefined : tokenizers?.[language], onApply: onApply ? (code) => onApply(code, language) : undefined, applyLabel: applyLabel }));
    };
}
//# sourceMappingURL=markdown-code-block.js.map