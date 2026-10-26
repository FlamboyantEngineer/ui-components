import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { getToneGlyph } from '../banner/banner.js';
import { Icon } from '../icon/icon.js';
const hooks = createHooks('inline-error', ['icon', 'spinner', 'message', 'retry']);
/** An assertive alert for a settled failure, a polite status for everything else. */
function toLiveRegion(isUrgent) {
    return isUrgent
        ? { role: 'alert', 'aria-live': 'assertive' }
        : { role: 'status', 'aria-live': 'polite' };
}
/**
 * Compact feedback for a failed operation or validation, with optional recovery. A failure is an
 * assertive alert; a warning, a success or a check still running is a polite status.
 */
export function InlineError({ children, onRetry, onRetryError, retryLabel, isRetryDisabled = false, tone = 'danger', isPending = false, className, ...rest }) {
    const strings = useUiStrings();
    const glyph = getToneGlyph(tone) ?? 'error';
    return (_jsxs("div", { ...rest, ...hooks.root({ className, data: { tone, pending: isPending } }), ...toLiveRegion(tone === 'danger' && !isPending), "aria-atomic": "true", children: [isPending ? (_jsx("span", { ...hooks.slot('spinner'), "aria-hidden": "true" })) : (_jsx(Icon, { glyph: glyph, className: hooks.slotClass('icon') })), _jsx("div", { ...hooks.slot('message'), children: children }), onRetry ? (_jsx(Button, { variant: "secondary", size: "sm", className: hooks.slotClass('retry'), isDisabled: isRetryDisabled, onPress: () => onRetry(), onError: onRetryError, children: retryLabel ?? strings.retry })) : null] }));
}
//# sourceMappingURL=inline-error.js.map