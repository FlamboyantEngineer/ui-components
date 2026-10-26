import { useCallback, useLayoutEffect, useState } from 'react';
import { useResizeObserver } from '../../utils/use-resize-observer.js';
/**
 * Whether the element's content is wider than its box, measured after each change of `content` and
 * whenever the element resizes.
 */
export function useHorizontalOverflow(ref, content) {
    const [isOverflowing, setOverflowing] = useState(false);
    const measure = useCallback(() => {
        const element = ref.current;
        if (element)
            setOverflowing(element.scrollWidth > element.clientWidth + 1);
    }, [ref]);
    useResizeObserver([ref], measure);
    useLayoutEffect(() => {
        measure();
    }, [measure, content]);
    return isOverflowing;
}
//# sourceMappingURL=use-horizontal-overflow.js.map