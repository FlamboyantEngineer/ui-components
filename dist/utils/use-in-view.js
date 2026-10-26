import { useEffect, useState } from 'react';
import { findOverlayScrollContainer } from './overlay-geometry.js';
function resolveElement(target) {
    if (!target)
        return null;
    return 'current' in target ? target.current : target;
}
/** Observer options that extend the nearest scrolling container's view by `scrollOffset`, or none. */
function toObserverInit(element, scrollOffset) {
    if (scrollOffset === undefined || !Number.isFinite(scrollOffset))
        return undefined;
    const margin = `${Math.max(0, scrollOffset) * 100}%`;
    return {
        root: findOverlayScrollContainer(element),
        rootMargin: `0px ${margin} ${margin} ${margin}`,
    };
}
/**
 * Whether any part of `target` is visible in the viewport, after clipping by the scrolling
 * ancestors it sits in, for loading more content or rendering it lazily. False until the first
 * report, while disabled, and in a window without `IntersectionObserver`; the observer comes from
 * the element's own window.
 */
export function useInView(target, { enabled = true, scrollOffset } = {}) {
    const [isInView, setInView] = useState(false);
    useEffect(() => {
        const element = resolveElement(target);
        const Observer = element?.ownerDocument.defaultView?.IntersectionObserver;
        if (!enabled || !element || typeof Observer !== 'function')
            return undefined;
        let active = true;
        const observer = new Observer((entries) => {
            if (!active)
                return;
            const entry = entries.findLast((candidate) => candidate.target === element);
            if (entry)
                setInView(entry.isIntersecting);
        }, toObserverInit(element, scrollOffset));
        observer.observe(element);
        return () => {
            active = false;
            observer.disconnect();
            setInView(false);
        };
    }, [enabled, target, scrollOffset]);
    return enabled && isInView;
}
//# sourceMappingURL=use-in-view.js.map