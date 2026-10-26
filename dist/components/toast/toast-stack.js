// Stacking: each toast measures itself, so it knows its place in the stack and the height of the
// newer toasts in front of it; regions and lists also hand their swipe settings down.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, } from 'react';
import { UNSTABLE_ToastStateContext as ToastStateContext, useFocusWithin, useHover, } from '../../primitives/index.js';
import { mergeProps } from '../../utils/merge-props.js';
import { useElementSize } from '../../utils/use-element-size.js';
const defaultSwipeThreshold = 50;
const ToastStackContext = createContext({
    swipeDirection: 'right',
    swipeThreshold: defaultSwipeThreshold,
    heights: new Map(),
    report: () => { },
    isPaused: false,
});
export const ToastStackProvider = ToastStackContext.Provider;
/**
 * The stack a region or list provides: its swipe settings, its toasts' measured heights and whether
 * their timers are paused.
 */
export function useToastStack({ swipeDirection = 'right', swipeThreshold = defaultSwipeThreshold }, isPaused = false) {
    const [heights, setHeights] = useState(() => new Map());
    const report = useCallback((key, height) => {
        setHeights((current) => {
            if (current.get(key) === height)
                return current;
            const next = new Map(current);
            if (height === undefined)
                next.delete(key);
            else
                next.set(key, height);
            return next;
        });
    }, []);
    return useMemo(() => ({ swipeDirection, swipeThreshold, heights, report, isPaused }), [swipeDirection, swipeThreshold, heights, report, isPaused]);
}
/** Whether the toast's stack holds its timers: its region is hovered or holds focus. */
export function useIsStackPaused() {
    return useContext(ToastStackContext).isPaused;
}
/** Measures the toast in `ref` into its stack and returns its index and offset there. */
export function useToastStackPosition(key, ref) {
    const { heights, report, swipeDirection, swipeThreshold } = useContext(ToastStackContext);
    const toasts = useContext(ToastStateContext)?.visibleToasts ?? [];
    const height = useElementSize(ref, { box: 'border-box' })?.height;
    useEffect(() => report(key, height), [report, key, height]);
    useEffect(() => () => report(key, undefined), [report, key]);
    const index = Math.max(0, toasts.findIndex((toast) => toast.key === key));
    const offset = toasts
        .slice(0, index)
        .reduce((sum, toast) => sum + (heights.get(toast.key) ?? 0), 0);
    return { index, offset, swipeDirection, swipeThreshold };
}
/**
 * Whether the pointer is over the region or focus is inside it, on the region itself included: the
 * stack is expanded and its timers pause. React Aria's hover and focus-within also end when a toast
 * under the pointer or holding focus leaves and the pointer or focus moves on; a region left without
 * toasts has neither. `regionProps` go on the region element.
 */
export function useStackExpanded(hasToasts) {
    const [isFocused, setFocused] = useState(false);
    const { hoverProps, isHovered } = useHover({ isDisabled: !hasToasts });
    const { focusWithinProps } = useFocusWithin({ onFocusWithinChange: setFocused });
    if (!hasToasts && isFocused)
        setFocused(false);
    return {
        isExpanded: isHovered || isFocused,
        regionProps: mergeProps(hoverProps, focusWithinProps),
    };
}
//# sourceMappingURL=toast-stack.js.map