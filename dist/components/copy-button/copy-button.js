import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { VisuallyHidden } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { useClipboard } from '../../utils/use-clipboard.js';
import { Button } from '../button/button.js';
const hooks = createHooks('copy-button', ['button', 'status']);
const statusGlyphs = { idle: 'copy', copied: 'check', failed: 'error' };
/**
 * An icon button that copies `value` to the clipboard, shows a check mark (or an error glyph)
 * while the outcome lasts, and announces it in a polite live region.
 */
export function CopyButton({ value, label, timeout, onCopy, variant, size, isDisabled, className, id, ...rest }) {
    const strings = useUiStrings();
    const { copy, status } = useClipboard({ timeout });
    // Counts settled copies: a repeated outcome still changes the live region, so it is announced.
    const [settled, setSettled] = useState(0);
    const announcements = {
        idle: '',
        copied: strings.copied,
        failed: strings.copyFailed,
    };
    return (_jsxs("span", { ...hooks.root({
            className,
            props: rest,
            data: { copied: status === 'copied', failed: status === 'failed' },
        }), id: id, children: [_jsx(Button, { className: hooks.slotClass('button'), icon: statusGlyphs[status], label: label ?? strings.copy, variant: variant, size: size, isDisabled: isDisabled, onPress: () => {
                    // Each press starts a write; the clipboard hook owns which result stays visible.
                    void copy(value).then((copied) => {
                        setSettled((count) => count + 1);
                        onCopy?.(copied);
                    });
                } }), _jsxs(VisuallyHidden, { elementType: "span", className: hooks.slotClass('status'), role: "status", children: [announcements[status], status !== 'idle' && settled % 2 === 0 ? '\u200b' : null] })] }));
}
//# sourceMappingURL=copy-button.js.map