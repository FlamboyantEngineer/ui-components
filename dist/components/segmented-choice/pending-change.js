import { useState } from 'react';
function isPromiseLike(result) {
    return typeof result?.then === 'function';
}
/**
 * A value the caller may control whose change may settle later. When `onChange` returns a promise,
 * the new value shows at once and stays pending until the promise settles: fulfilled, it takes
 * effect (an uncontrolled value keeps it); rejected, the value in effect shows again.
 */
export function usePendingChange(value, defaultValue, onChange) {
    const [own, setOwn] = useState(defaultValue);
    const [pending, setPending] = useState(null);
    const isControlled = value !== undefined;
    const change = (next) => {
        if (pending)
            return;
        const result = onChange?.(next);
        if (!isPromiseLike(result)) {
            if (!isControlled)
                setOwn(next);
            return;
        }
        setPending({ value: next });
        result.then(() => {
            if (!isControlled)
                setOwn(next);
            setPending(null);
        }, 
        // The caller reports its own failure; the choice only goes back.
        () => setPending(null));
    };
    const current = isControlled ? value : own;
    return { value: pending ? pending.value : current, isPending: pending !== null, change };
}
//# sourceMappingURL=pending-change.js.map