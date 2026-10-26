import { useMemo, useRef } from 'react';
import { mergeRefs } from './merge-props.js';
/**
 * A ref object for a component's own use, and the ref callback to put on its element, which also
 * hands the element to the caller's `ref` (running a React 19 callback ref's cleanup on detach).
 */
export function useForwardedRef(ref) {
    const own = useRef(null);
    const setRef = useMemo(() => mergeRefs(own, ref), [ref]);
    return [own, setRef];
}
//# sourceMappingURL=use-forwarded-ref.js.map