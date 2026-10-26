import { useId, useRef } from 'react';
/**
 * Returns a function that creates a new id on each call, unique within the document, for the items
 * an editor adds (rules, steps).
 */
export function useIdFactory() {
    const base = useId();
    const count = useRef(0);
    return () => {
        count.current += 1;
        return `${base}${count.current}`;
    };
}
//# sourceMappingURL=use-id-factory.js.map