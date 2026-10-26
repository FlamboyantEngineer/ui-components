// Merging props for an element several parties configure: a component's own props, hook props and
// the props a caller adds to a part it renders itself (specs/COMPOSITION.md).
const handlerName = /^on[A-Z]/;
function setRef(ref, value) {
    if (typeof ref === 'function') {
        const cleanup = ref(value);
        return typeof cleanup === 'function' ? cleanup : () => ref(null);
    }
    if (!ref)
        return undefined;
    ref.current = value;
    return () => {
        ref.current = null;
    };
}
function chainHandlers(first, second) {
    return (...args) => {
        first(...args);
        return second(...args);
    };
}
function mergeValue(key, current, next) {
    if (next === undefined)
        return current;
    if (current === undefined)
        return next;
    if (typeof current === 'function' && typeof next === 'function' && handlerName.test(key)) {
        return chainHandlers(current, next);
    }
    if (key === 'className' && typeof current === 'string' && typeof next === 'string') {
        return [current, next].filter(Boolean).join(' ');
    }
    if (key === 'style' && typeof current === 'object' && typeof next === 'object') {
        return { ...current, ...next };
    }
    if (key === 'ref')
        return mergeRefs(current, next);
    return next;
}
/**
 * One callback ref that hands the element to every ref given (objects and callbacks), and clears
 * them, or runs their React 19 cleanups, when the element leaves.
 */
export function mergeRefs(...refs) {
    return (value) => {
        const cleanups = refs.map((ref) => setRef(ref, value));
        return () => {
            for (const cleanup of cleanups)
                cleanup?.();
        };
    };
}
/**
 * Merges props objects left to right. Handlers named `on` + a capital letter run in order,
 * `className`s are joined, `style` objects are merged, refs are combined with `mergeRefs`, and any
 * other prop comes from the last object that sets it to something other than `undefined`.
 */
export function mergeProps(...props) {
    const merged = {};
    for (const source of props) {
        for (const [key, value] of Object.entries(source)) {
            merged[key] = mergeValue(key, merged[key], value);
        }
    }
    return merged;
}
//# sourceMappingURL=merge-props.js.map