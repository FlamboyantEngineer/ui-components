import { useCallback, useRef } from 'react';
import { useLatest } from './use-latest.js';
/** How long after a request focus may still come back to the overlay's trigger, in milliseconds. */
const HANDBACK_WINDOW = 1000;
/**
 * Hands focus on to an editor after a choice in a menu, select or popover. Those overlays keep
 * focus inside while open and give it back to their trigger once they close, so after `request`
 * `focus` runs when the trigger (or the element under `ref`) gets focus back shortly after.
 */
export function useFocusHandback(focus) {
    const requestedAt = useRef(0);
    const latestFocus = useLatest(focus);
    const ref = useCallback((element) => {
        if (!element)
            return undefined;
        const onFocus = () => {
            if (Date.now() - requestedAt.current > HANDBACK_WINDOW)
                return;
            requestedAt.current = 0;
            latestFocus.current();
        };
        element.addEventListener('focusin', onFocus);
        return () => element.removeEventListener('focusin', onFocus);
    }, [latestFocus]);
    const request = useCallback(() => {
        requestedAt.current = Date.now();
    }, []);
    return { request, ref };
}
//# sourceMappingURL=use-focus-handback.js.map