import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// A text part: Markdown with code blocks and citations, or plain text keeping its line breaks,
// with mention and command tokens as pills and record references as record chips in both
// (specs/CHAT-PARTS.md, UIC-CHAT-PARTS-2).
import { Fragment, useMemo } from 'react';
import { useLatest } from '../../utils/use-latest.js';
import { createCitationOverride } from '../chat-sources/chat-sources.js';
import { createCodeBlockOverride } from '../code-block/code-block.js';
import { Markdown } from '../markdown/markdown.js';
import { RecordLabel } from '../record-label/record-label.js';
import { TextMatch } from '../text-match/text-match.js';
import { chatPartsHooks as hooks } from './chat-parts-hooks.js';
import { listTextTokens, splitTextTokens, splitTokenMarkers, writeTokenSource, } from './chat-text-tokens.js';
/** A token's pill: its label, or a record reference's chip. */
function TokenPill({ token, getReference }) {
    const { id, label, recordType } = token;
    return (_jsx("span", { ...hooks.slot('token', { kind: token.kind }), children: token.kind === 'reference' ? (_jsx(RecordLabel, { mode: "chip", ...getReference?.({ id, label, ...(recordType === undefined ? {} : { recordType }) }), identifier: label })) : (_jsx(TextMatch, { children: label })) }));
}
function PlainLines({ text }) {
    return text.split('\n').map((line, index) => (_jsxs(Fragment, { children: [index > 0 ? _jsx("br", {}) : null, _jsx(TextMatch, { children: line })] }, index)));
}
function PlainText({ part, getReference }) {
    const tokens = listTextTokens(part.text, part.tokens);
    return (_jsx("div", { ...hooks.slot('text', { format: 'plain' }), children: splitTextTokens(part.text, tokens).map((piece, at) => typeof piece === 'number' ? (_jsx(TokenPill, { token: tokens[piece], getReference: getReference }, at)) : (_jsx(PlainLines, { text: piece }, at))) }));
}
/** Draws the token markers in text nodes as pills, and hands everything else to `renderNode`. */
function createTokenOverride({ tokens, renderNode, getReference, }) {
    return (node, children) => {
        if (node.type !== 'text')
            return renderNode(node, children);
        const pieces = splitTokenMarkers(node.text, tokens.length);
        if (pieces.every((piece) => typeof piece === 'string'))
            return renderNode(node, children);
        return pieces.map((piece, at) => typeof piece === 'number' ? (_jsx(TokenPill, { token: tokens[piece], getReference: getReference }, at)) : (_jsx(Fragment, { children: renderNode({ type: 'text', text: piece }, null) ?? _jsx(TextMatch, { children: piece }) }, at)));
    };
}
function MarkdownText({ part, renderNode, getReference }) {
    // The tokens by content, so a host that rebuilds the array each render keeps the overrides.
    const tokensKey = JSON.stringify(part.tokens ?? []);
    const placed = useMemo(() => {
        const tokens = listTextTokens(part.text, JSON.parse(tokensKey));
        return { tokens, source: writeTokenSource(part.text, tokens) };
    }, [part.text, tokensKey]);
    const nodeRenderer = useMemo(() => placed.tokens.length === 0
        ? renderNode
        : createTokenOverride({ tokens: placed.tokens, renderNode, getReference }), [placed.tokens, renderNode, getReference]);
    return (_jsx(Markdown, { source: placed.source, isStreaming: part.status === 'streaming', renderNode: nodeRenderer, className: hooks.slotClass('text'), "data-format": "markdown" }));
}
/** A text part, as Markdown or as plain text. */
export function ChatTextPartView({ part, format, renderNode, getReference, }) {
    return format === 'plain' ? (_jsx(PlainText, { part: part, getReference: getReference })) : (_jsx(MarkdownText, { part: part, renderNode: renderNode, getReference: getReference }));
}
/**
 * The message's Markdown overrides: fenced code as `CodeBlock` (with Apply when `onApplyCode` is
 * given) and `[n]` markers as citations of the sources of its `sources` parts. They stay the same
 * while the sources and the presence of `onApplyCode` do, so streaming keeps finished blocks.
 */
export function usePartsRenderNode(parts, onApplyCode) {
    const sourcesKey = JSON.stringify(parts.flatMap((part) => (part.type === 'sources' ? part.sources : [])));
    const latestApply = useLatest(onApplyCode);
    const hasApply = onApplyCode !== undefined;
    return useMemo(() => {
        const code = createCodeBlockOverride({
            onApply: hasApply
                ? (value, language) => latestApply.current?.(value, {
                    type: 'code',
                    code: value,
                    language: language ?? undefined,
                })
                : undefined,
        });
        const cite = createCitationOverride(JSON.parse(sourcesKey));
        return (node) => code(node) ?? cite(node);
    }, [sourcesKey, hasApply, latestApply]);
}
//# sourceMappingURL=chat-text-part.js.map