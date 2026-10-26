// Keyboard focus around content that turns inert while its region loads.
import { useLayoutEffect, useRef } from 'react';
/**
 * Keeps keyboard focus in place while the content is inert, where browsers would drop it to the
 * document body: focus inside the content moves to the root as blocking starts, and returns to the
 * element that had it once blocking ends, unless the reader has moved focus elsewhere meanwhile.
 */
export function useBlockedFocus({ rootRef, contentRef, isBlocked }) {
    const returnTo = useRef(null);
    // A layout effect runs before the browser moves focus out of the newly inert content.
    useLayoutEffect(() => {
        const root = rootRef.current;
        const content = contentRef.current;
        if (!root || !content)
            return;
        const active = root.ownerDocument.activeElement;
        if (isBlocked) {
            if (active && content.contains(active)) {
                returnTo.current = active;
                root.focus({ preventScroll: true });
            }
            return;
        }
        const target = returnTo.current;
        returnTo.current = null;
        if (target?.isConnected && (active === root || active === root.ownerDocument.body)) {
            target.focus({ preventScroll: true });
        }
    }, [rootRef, contentRef, isBlocked]);
}
//# sourceMappingURL=use-blocked-focus.js.map