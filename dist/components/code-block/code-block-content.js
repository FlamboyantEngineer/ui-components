import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// The preformatted content of a code block: highlighted tokens, or terminal lines whose commands
// follow a prompt (specs/CODE-BLOCK.md).
import { Fragment, useMemo } from 'react';
import { createHooks } from '../../core/hooks.js';
import { TextMatch } from '../text-match/text-match.js';
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
export function splitTerminalLines(code, prompt) {
    return code.split('\n').map((line) => {
        if (line === prompt)
            return { kind: 'command', text: '' };
        if (line.startsWith(`${prompt} `))
            return { kind: 'command', text: line.slice(prompt.length + 1) };
        return { kind: 'output', text: line };
    });
}
/** What Copy and Apply use: a terminal block's commands without their prompts, or else the code. */
export function readCodeBlockValue(code, commands) {
    return commands.length === 0 ? code : commands.map((line) => line.text).join('\n');
}
export function CodeTokens({ code, tokenize }) {
    const tokens = useMemo(() => (tokenize ? tokenize(code) : null), [code, tokenize]);
    if (!tokens)
        return _jsx(TextMatch, { children: code });
    return tokens.map(({ text, type }, index) => type ? (_jsx("span", { ...hooks.slot('token', { token: type }), children: _jsx(TextMatch, { children: text }) }, index)) : (_jsx(TextMatch, { children: text }, index)));
}
/** Terminal lines; the prompt is decoration, hidden from assistive technology and from Copy. */
export function TerminalLines({ lines, prompt }) {
    return lines.map((line, index) => (_jsxs(Fragment, { children: [index > 0 ? '\n' : null, _jsxs("span", { ...hooks.slot('line', { kind: line.kind }), children: [line.kind === 'command' ? (_jsx("span", { ...hooks.slot('prompt'), "aria-hidden": "true", children: `${prompt} ` })) : null, _jsx(TextMatch, { children: line.text })] })] }, index)));
}
//# sourceMappingURL=code-block-content.js.map