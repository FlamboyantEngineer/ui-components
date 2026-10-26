import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment } from 'react';
import { createHooks, measuredProperty } from '../../core/hooks.js';
export const codeEditorHooks = createHooks('code-editor', [
    'toolbar',
    'surface',
    'gutter',
    'line',
    'line-number',
    'line-text',
    'code',
    'highlight',
    'token',
    'mark',
    'match',
    'bracket',
    'caret',
    'input',
    'diagnostics',
    'diagnostic',
    'announcement',
    'tooltip',
    'popover',
    'search',
    'format',
    'scrollbars',
    'scroll-marker',
]);
const hooks = codeEditorHooks;
function renderSegment(segment, index, caretRef) {
    if (segment === null)
        return _jsx("span", { ...hooks.slot('caret'), ref: caretRef }, index);
    const { text, type, severity, match, bracket } = segment;
    let node = type ? _jsx("span", { ...hooks.slot('token', { token: type }), children: text }) : text;
    if (bracket)
        node = _jsx("span", { ...hooks.slot('bracket', { unmatched: bracket.isUnmatched }), children: node });
    if (match)
        node = _jsx("span", { ...hooks.slot('match', { current: match.isCurrent }), children: node });
    if (severity)
        node = _jsx("span", { ...hooks.slot('mark', { severity }), children: node });
    return _jsx(Fragment, { children: node }, index);
}
function formatLocation({ line, column }) {
    if (line === undefined)
        return '';
    return column === undefined ? `${line} ` : `${line}:${column} `;
}
/**
 * The highlighted copy of the source behind the input. A final line break keeps its last line as
 * tall as the input's, so the two scroll to the same extent.
 */
export function CodeHighlight({ segments, caretRef, highlightRef }) {
    return (_jsxs("pre", { ...hooks.slot('highlight'), ref: highlightRef, "aria-hidden": "true", children: [segments.map((segment, index) => renderSegment(segment, index, caretRef)), '\n'] }));
}
/**
 * Line numbers beside the input. Each row holds a hidden copy of its line, so a wrapped line keeps
 * one number and the rows stay as tall as the lines they number.
 */
export function CodeGutter({ lines, measurement, firstLineNumber, severities, textWidth, gutterRef, }) {
    return (_jsx("div", { ...hooks.slot('gutter', { measurement }), ref: gutterRef, "aria-hidden": "true", style: textWidth === undefined ? undefined : measuredProperty('code-editor-text-width', textWidth), children: lines.map((line, index) => (_jsxs("div", { ...hooks.slot('line', { severity: severities.get(index + 1) }), children: [_jsx("span", { ...hooks.slot('line-number'), children: index + firstLineNumber }), _jsx("span", { ...hooks.slot('line-text'), children: line || '​' })] }, index))) }));
}
/** The worst severity on each line that a diagnostic points at. */
export function severitiesByLine(diagnostics) {
    const lines = new Map();
    for (const { line, severity = 'error' } of diagnostics) {
        if (line === undefined || lines.get(line) === 'error')
            continue;
        lines.set(line, severity);
    }
    return lines;
}
/** The diagnostics list. It stays in the document so new diagnostics are announced politely. */
export function CodeDiagnostics({ id, diagnostics }) {
    return (_jsx("ul", { ...hooks.slot('diagnostics'), id: id, "aria-live": "polite", children: diagnostics.map((diagnostic, index) => (_jsxs("li", { ...hooks.slot('diagnostic', { severity: diagnostic.severity ?? 'error' }), children: [formatLocation(diagnostic), diagnostic.message] }, index))) }));
}
//# sourceMappingURL=code-layers.js.map