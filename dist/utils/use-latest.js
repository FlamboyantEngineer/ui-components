import { useLayoutEffect, useRef } from 'react';
/**
 * A ref holding the `value` of the latest committed render, for event handlers and effects that
 * must read it without re-rendering or re-subscribing when it changes.
 */
export function useLatest(value) {
    const ref = useRef(value);
    useLayoutEffect(() => {
        ref.current = value;
    });
    return ref;
}
//# sourceMappingURL=use-latest.js.map