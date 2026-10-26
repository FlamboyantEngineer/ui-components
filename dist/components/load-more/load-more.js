import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { normalizeCount } from '../../utils/count.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { useInView } from '../../utils/use-in-view.js';
import { usePendingAction, Button, } from '../button/button.js';
const hooks = createHooks('load-more');
/** The visible text: the label, then the remaining count when it is a known, nonnegative number. */
function toVisibleText(label, remainingCount, formatRemaining) {
    const remaining = remainingCount !== undefined && remainingCount >= 0
        ? normalizeCount(remainingCount)
        : undefined;
    return remaining === undefined ? label : `${label} (${formatRemaining(remaining)})`;
}
/**
 * Runs `onLoadMore` from a press, or each time the control comes into view, pending until it
 * settles. Staying in view never loads again on its own, so a request that adds nothing cannot
 * repeat endlessly and a failed one is retried only when the reader comes back to the control.
 */
function useLoadRequests({ onLoadMore, onError, isPending, isDisabled, autoLoad, scrollOffset, button, }) {
    const { pending, run } = usePendingAction({ isPending, isDisabled, onError });
    const isInView = useInView(button, { enabled: Boolean(autoLoad) && !isDisabled, scrollOffset });
    const request = useCallback(() => run(onLoadMore), [run, onLoadMore]);
    const latestRequest = useRef(request);
    useEffect(() => {
        latestRequest.current = request;
    }, [request]);
    useEffect(() => {
        if (isInView)
            latestRequest.current();
    }, [isInView]);
    return { pending, request };
}
/** One control that fetches the next page of a collection, on press or as it scrolls into view. */
export function LoadMore({ onLoadMore, onError, isPending, isDisabled = false, autoLoad = false, scrollOffset, remainingCount, itemLabel, label, variant = 'secondary', size = 'sm', className, ref, ...rest }) {
    const strings = useUiStrings();
    const text = toVisibleText(label ?? strings.loadMore, remainingCount, strings.remainingCount);
    const collection = itemLabel?.trim();
    const [button, setButton] = useState(null);
    const buttonRef = useMemo(() => mergeRefs(setButton, ref), [ref]);
    const { pending, request } = useLoadRequests({
        onLoadMore,
        onError,
        isPending,
        isDisabled,
        autoLoad,
        scrollOffset,
        button,
    });
    return (_jsx(Button, { ...rest, ref: buttonRef, className: mergeClassNames(hooks.className, className), type: "button", variant: variant, size: size, isDisabled: isDisabled, isPending: pending, "aria-label": collection ? `${text} ${collection}` : undefined, onPress: onLoadMore ? request : undefined, children: text }));
}
//# sourceMappingURL=load-more.js.map