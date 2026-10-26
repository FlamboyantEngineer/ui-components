import { useLayoutEffect, useState } from 'react';
/** The target's element, or null when the ref is empty or no element matches the selector. */
export function resolveTourTarget(target) {
    if (target === undefined)
        return null;
    if (typeof target !== 'string')
        return target.current;
    try {
        return document.querySelector(target);
    }
    catch {
        // An invalid selector points at nothing.
        return null;
    }
}
/**
 * Looks up the shown step's target once the tour has rendered, and scrolls it into view. Until the
 * first lookup is done, `isResolved` is false, so the popover does not open at a stale place; on a
 * step change the previous target stands in until the lookup, before the page paints, so the
 * popover and its focus scope stay mounted from step to step.
 */
export function useTourTarget(target, isOpen) {
    const [resolved, setResolved] = useState(null);
    useLayoutEffect(() => {
        if (!isOpen)
            return;
        const element = resolveTourTarget(target);
        element?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
        setResolved({ element });
    }, [target, isOpen]);
    return { element: resolved?.element ?? null, isResolved: isOpen && resolved !== null };
}
//# sourceMappingURL=use-tour-target.js.map