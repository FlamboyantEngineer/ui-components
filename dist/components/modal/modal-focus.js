import { useEffect, useRef } from 'react';
import { resolveFocusTarget } from '../../utils/focus-target.js';
const tabbableSelector = 'a[href], area[href], button, input, select, textarea, iframe, summary, [tabindex], [contenteditable]';
function focusFirstTabbable(root) {
    if (!root)
        return false;
    for (const element of root.querySelectorAll(tabbableSelector)) {
        if (element.tabIndex < 0 || element.closest('[inert], [hidden]'))
            continue;
        if ('disabled' in element && element.disabled === true)
            continue;
        if (element instanceof HTMLInputElement && element.type === 'hidden')
            continue;
        element.focus();
        if (element.ownerDocument.activeElement === element)
            return true;
    }
    return false;
}
/**
 * Moves focus on open to the caller's target, else to the first focusable element of the body, else
 * of the footer, else of the whole dialog. It renders inside the dialog so its effect runs before
 * the dialog focuses itself, and without a target it leaves focus alone when an element with
 * `autoFocus` took it.
 */
export function InitialFocus({ dialogRef, bodyRef, footerRef, target }) {
    const targetRef = useRef(target);
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog)
            return;
        const chosen = resolveFocusTarget(targetRef.current);
        if (chosen) {
            chosen.focus();
            if (chosen.ownerDocument.activeElement === chosen)
                return;
        }
        const active = dialog.ownerDocument.activeElement;
        if (active !== dialog && dialog.contains(active))
            return;
        if (focusFirstTabbable(bodyRef.current) || focusFirstTabbable(footerRef.current))
            return;
        focusFirstTabbable(dialog);
    }, [dialogRef, bodyRef, footerRef]);
    return null;
}
export { useFocusReturn } from '../../utils/focus-target.js';
//# sourceMappingURL=modal-focus.js.map