import { useLayoutEffect, useRef, useState } from 'react';
import { useResizeObserver } from './use-resize-observer.js';
function resolveElement(target, parent) {
    if (!target)
        return null;
    const element = 'current' in target ? target.current : target;
    return (parent ? element?.parentElement : element) ?? null;
}
function isSameSize(current, next) {
    return current !== null && current.width === next.width && current.height === next.height;
}
function readSize(entry, element, box) {
    if (box === 'client')
        return { width: element.clientWidth, height: element.clientHeight };
    if (box === 'border-box') {
        const border = entry.borderBoxSize?.[0];
        if (border)
            return { width: border.inlineSize, height: border.blockSize };
        const rect = element.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
    }
    return { width: entry.contentRect.width, height: entry.contentRect.height };
}
/**
 * The size of `target` (or its parent), or `null` before the first measurement, while disabled,
 * and in a window without `ResizeObserver`. The observer and animation frames come from the
 * element's own window. The first report applies at once; later reports coalesce to one update per
 * animation frame. An unchanged size keeps the previous object, so the result is a stable effect
 * dependency. A replaced element starts unmeasured.
 */
export function useElementSize(target, { box = 'content-box', parent = false, enabled = true } = {}) {
    const [size, setSize] = useState(null);
    const onEntries = useRef(() => { });
    const lastEntry = useRef(null);
    useLayoutEffect(() => {
        const element = resolveElement(target, parent);
        const view = element?.ownerDocument.defaultView;
        if (!enabled || !element || !view || typeof view.ResizeObserver !== 'function') {
            lastEntry.current = null;
            return undefined;
        }
        const commit = (next) => setSize((current) => (isSameSize(current, next) ? current : next));
        let measured = false;
        let frame = null;
        let pending = null;
        onEntries.current = (entries) => {
            const entry = entries[entries.length - 1];
            if (!entry || entry.target !== element)
                return;
            lastEntry.current = entry;
            const next = readSize(entry, element, box);
            if (!measured || typeof view.requestAnimationFrame !== 'function') {
                measured = true;
                commit(next);
                return;
            }
            pending = next;
            frame ??= view.requestAnimationFrame(() => {
                frame = null;
                if (pending)
                    commit(pending);
                pending = null;
            });
        };
        // Switching boxes may keep the existing observation: reread its last report at once.
        if (lastEntry.current?.target === element)
            onEntries.current([lastEntry.current]);
        return () => {
            onEntries.current = () => { };
            if (frame !== null)
                view.cancelAnimationFrame(frame);
            setSize(null);
        };
    }, [box, enabled, parent, target]);
    // A client size changes with padding (border box) and with scrollbars (content box only).
    useResizeObserver(() => {
        const element = enabled ? resolveElement(target, parent) : null;
        return [
            { element, box: box === 'content-box' ? 'content-box' : 'border-box' },
            box === 'client' ? { element, box: 'content-box' } : null,
        ];
    }, (entries) => onEntries.current(entries));
    return enabled ? size : null;
}
//# sourceMappingURL=use-element-size.js.map