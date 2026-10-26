import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { useEnterExit } from '../../utils/use-enter-exit.js';
import { useDelayedFlag } from '../../utils/use-delayed-flag.js';
import { Button } from '../button/button.js';
import { Icon } from '../icon/icon.js';
import { TruncationTooltip } from '../truncation-tooltip/truncation-tooltip.js';
const hooks = createHooks('save-status', ['message', 'icon', 'label', 'retry']);
const phaseGlyphs = {
    saved: 'check',
    error: 'error',
    offline: 'offline',
};
/**
 * An editor's save status: a label and glyph for the phase in a polite live region, so each change
 * is announced without moving focus, and a Retry button after a failed save.
 */
export function SaveStatus({ phase, labels, onRetry, hideSavedAfter, className, ...rest }) {
    const strings = useUiStrings();
    const ref = useRef(null);
    const isHidden = useDelayedFlag(phase === 'saved', hideSavedAfter);
    const { isMounted, isEntering, isExiting } = useEnterExit(ref, phase !== 'idle' && !isHidden);
    const glyph = phaseGlyphs[phase];
    const showLabel = isMounted && phase !== 'idle';
    return (_jsxs("span", { ...rest, ...hooks.root({
            className,
            data: { phase, entering: isEntering, exiting: isExiting },
        }), ref: ref, children: [_jsx("span", { ...hooks.slot('message'), role: "status", children: showLabel ? (_jsxs(_Fragment, { children: [glyph ? _jsx(Icon, { glyph: glyph, className: hooks.slotClass('icon') }) : null, _jsx(TruncationTooltip, { className: hooks.slotClass('label'), children: labels?.[phase] ?? strings.saveStatus(phase) })] })) : null }), phase === 'error' && onRetry ? (_jsx(Button, { size: "xs", variant: "link", className: hooks.slotClass('retry'), onPress: onRetry, children: strings.retry })) : null] }));
}
//# sourceMappingURL=save-status.js.map