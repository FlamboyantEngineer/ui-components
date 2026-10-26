import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useMemo, useRef } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { CopyButton } from '../copy-button/copy-button.js';
import { CodeTokens, TerminalLines, codeBlockHooks as hooks, readCodeBlockValue, splitTerminalLines, } from './code-block-content.js';
import { useHorizontalOverflow } from './use-horizontal-overflow.js';
export { createCodeBlockOverride } from './markdown-code-block.js';
function readCopyLabel(strings, variant, commands) {
    if (variant === 'code')
        return strings.codeBlockCopy;
    return commands.length > 0
        ? strings.codeBlockCopyCommands(commands.length)
        : strings.codeBlockCopyOutput;
}
/**
 * A block of code headed by its title or language, with a Copy button and an optional Apply
 * action. The code is preformatted and scrolls sideways; while it overflows, the reader can focus it
 * to scroll by keyboard. A `terminal` block marks its command lines and copies only the commands.
 */
export function CodeBlock({ code, language, title, variant = 'code', onApply, applyLabel, tokenize, prompt = '$', className, id, ...rest }) {
    const strings = useUiStrings();
    const titleId = useId();
    const codeRef = useRef(null);
    const isOverflowing = useHorizontalOverflow(codeRef, code);
    const lines = useMemo(() => (variant === 'terminal' ? splitTerminalLines(code, prompt) : null), [code, prompt, variant]);
    const commands = lines?.filter((line) => line.kind === 'command') ?? [];
    const value = readCodeBlockValue(code, commands);
    return (_jsxs("div", { ...hooks.root({ className, props: rest, data: { variant, language } }), id: id, role: "group", "aria-labelledby": titleId, children: [_jsxs("div", { ...hooks.slot('header'), children: [_jsx("span", { ...hooks.slot('title'), id: titleId, children: title ?? language ?? strings.codeBlockTitle(variant) }), _jsxs("span", { ...hooks.slot('actions'), children: [onApply ? (_jsx(Button, { className: hooks.slotClass('apply'), size: "sm", variant: "ghost", onPress: () => onApply(value), children: applyLabel ?? strings.codeBlockApply })) : null, _jsx(CopyButton, { className: hooks.slotClass('copy'), value: value, label: readCopyLabel(strings, variant, commands), size: "sm" })] })] }), _jsx("pre", { ...hooks.slot('code', { overflowing: isOverflowing }), ref: codeRef, tabIndex: isOverflowing ? 0 : undefined, children: _jsx("code", { children: lines ? (_jsx(TerminalLines, { lines: lines, prompt: prompt })) : (_jsx(CodeTokens, { code: code, tokenize: tokenize })) }) })] }));
}
//# sourceMappingURL=code-block.js.map