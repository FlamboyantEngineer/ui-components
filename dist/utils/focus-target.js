// Focus targets a caller names (`initialFocus`, `finalFocus`) and returning focus to one when a
// focus-managing container leaves the page. Shared by Modal and FocusScope.
import { useLayoutEffect, useRef } from 'react';
/** The element a focus target names now, if it is still in the document. */
export function resolveFocusTarget(target) {
    const element = typeof target === 'function' ? target() : target?.current;
    return element?.isConnected ? element : null;
}
/**
 * When the container leaves the page, moves focus to `finalFocus`, else to `fallback`, provided
 * focus was still inside the container or on the body, so a reader who moved elsewhere keeps their
 * place. It runs while the container is removed, before React Aria's own restoration, which then
 * stands down.
 */
export function useFocusReturn({ containerRef, finalFocus, fallback }) {
    const optionsRef = useRef({ finalFocus, fallback });
    useLayoutEffect(() => {
        optionsRef.current = { finalFocus, fallback };
    });
    useLayoutEffect(() => {
        const container = containerRef.current;
        return () => {
            const active = document.activeElement;
            if (active !== document.body && !container?.contains(active))
                return;
            const { finalFocus: chosen, fallback: opener } = optionsRef.current;
            const target = resolveFocusTarget(chosen) ??
                (opener instanceof HTMLElement && opener.isConnected ? opener : null);
            target?.focus();
        };
    }, [containerRef]);
}
//# sourceMappingURL=focus-target.js.map